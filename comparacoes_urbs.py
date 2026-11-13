"""Processa, no computador que possui o DuckDB, a fila privada de comparações URBS."""
import bisect
import datetime
import logging
import math
import statistics

DT_MIN, DT_MAX = 3, 40
V_MAX = 90
OFFSET_OK_M = 150
EPOCA = datetime.datetime(1970, 1, 1)
log = logging.getLogger(__name__)


def hav(la1, lo1, la2, lo2):
    p = math.pi / 180
    a = math.sin((la2 - la1) * p / 2) ** 2 + math.cos(la1 * p) * math.cos(la2 * p) * math.sin((lo2 - lo1) * p / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(a))


def segundos(dt):
    return (dt - EPOCA).total_seconds()


def buscar_veiculo(por_veiculo, amostras, preferido=None):
    tempos = [a["s"] for a in amostras]
    candidatos = {}
    for veiculo, pontos in por_veiculo.items():
        distancias = []
        for t, lat, lon in pontos:
            i = bisect.bisect_left(tempos, segundos(t))
            vizinhos = [j for j in (i - 1, i) if 0 <= j < len(amostras) and abs(amostras[j]["s"] - segundos(t)) <= 10]
            if vizinhos:
                j = min(vizinhos, key=lambda x: abs(amostras[x]["s"] - segundos(t)))
                distancias.append(hav(lat, lon, amostras[j]["lat"], amostras[j]["lon"]))
        if len(distancias) >= 3:
            candidatos[veiculo] = statistics.median(distancias)
    if preferido and preferido in candidatos:
        return preferido, candidatos[preferido]
    if not candidatos:
        return None, None
    veiculo = min(candidatos, key=candidatos.get)
    return veiculo, candidatos[veiculo]


def carregar_viagem(remoto, viagem_id):
    viagem = remoto.execute("""SELECT linha, veiculo, inicio AT TIME ZONE 'America/Sao_Paulo',
                                      fim AT TIME ZONE 'America/Sao_Paulo'
                               FROM viagens WHERE id = %s""", [viagem_id]).fetchone()
    pontos = remoto.execute("""SELECT t AT TIME ZONE 'America/Sao_Paulo', lat, lon, vel_ms
                                FROM viagem_pontos WHERE viagem_id = %s ORDER BY seq""", [viagem_id]).fetchall()
    if not viagem or len(pontos) < 10:
        return None
    linha, veiculo, inicio, fim = viagem
    amostras = [{"t": t, "s": segundos(t), "lat": lat, "lon": lon, "vel": vel} for t, lat, lon, vel in pontos]
    return {"linha": linha, "veiculo": veiculo, "inicio": inicio, "fim": fim, "amostras": amostras}


def comparar(local, viagem):
    amostras = viagem["amostras"]
    inicio, fim = amostras[0]["t"], amostras[-1]["t"]
    pad = datetime.timedelta(seconds=90)
    rows = local.execute("""SELECT veiculo, dthr, lat, lon FROM posicoes
                            WHERE cod_linha = ? AND dthr BETWEEN ? AND ? ORDER BY veiculo, dthr""",
                         [viagem["linha"], inicio - pad, fim + pad]).fetchall()
    if not rows:
        return None, "A URBS não possui posições desta linha nesse horário no banco local. Importe o dia correspondente."
    por_veiculo = {}
    for veiculo, t, lat, lon in rows:
        por_veiculo.setdefault(veiculo, []).append((t, lat, lon))
    veiculo, distancia = buscar_veiculo(por_veiculo, amostras, viagem["veiculo"])
    if not veiculo:
        return None, "Não foi possível identificar um ônibus da URBS próximo ao trajeto gravado."
    if distancia is None or distancia > OFFSET_OK_M:
        return None, "O ônibus mais próximo ficou a mais de %d m do trajeto; a identificação não é confiável." % OFFSET_OK_M

    fixes = por_veiculo[veiculo]
    segmentos = []
    for (ta, la, loa), (tb, lb, lob) in zip(fixes, fixes[1:]):
        dt = (tb - ta).total_seconds()
        if not (DT_MIN <= dt <= DT_MAX) or ta < inicio or tb > fim:
            continue
        vel_urbs = hav(la, loa, lb, lob) / dt * 3.6
        if vel_urbs >= V_MAX:
            continue
        sa, sb = segundos(ta), segundos(tb)
        medidas = [a["vel"] * 3.6 for a in amostras if sa <= a["s"] <= sb and a["vel"] is not None]
        if len(medidas) < max(2, dt * 0.5):
            continue
        segmentos.append({"s": (sa + sb) / 2 - amostras[0]["s"], "urbs": vel_urbs,
                           "cel_media": statistics.fmean(medidas), "cel_max": max(medidas)})
    if not segmentos:
        return None, "Não há trechos comparáveis: faltaram leituras contínuas do celular ou da URBS."

    diffs = [s["urbs"] - s["cel_media"] for s in segmentos]
    celular = [[round(a["s"] - amostras[0]["s"], 1), round(a["vel"] * 3.6, 1)]
               for a in amostras if a["vel"] is not None]
    urbs = [[round(s["s"], 1), round(s["urbs"], 1)] for s in segmentos]
    resumo = {"trechos": len(segmentos), "urbs_mediana_kmh": round(statistics.median(s["urbs"] for s in segmentos), 1),
              "urbs_max_kmh": round(max(s["urbs"] for s in segmentos), 1),
              "celular_mediana_kmh": round(statistics.median(s["cel_media"] for s in segmentos), 1),
              "celular_max_kmh": round(max(s["cel_max"] for s in segmentos), 1),
              "diferenca_mediana_kmh": round(statistics.median(diffs), 1),
              "erro_absoluto_medio_kmh": round(statistics.fmean(abs(x) for x in diffs), 1)}
    return {"veiculo": veiculo, "distancia": round(distancia, 1), "resumo": resumo,
            "celular": celular, "urbs": urbs}, None


def processar_pendentes(local, remoto, limite=20):
    """Atende solicitações pendentes sem expor coordenadas de nenhum dos trajetos."""
    if not remoto.execute("SELECT to_regclass('public.comparacoes_urbs')").fetchone()[0]:
        log.info("comparações URBS: migration 0008 ainda não aplicada; fila ignorada")
        return 0
    pendentes = remoto.execute("""SELECT viagem_id::text FROM comparacoes_urbs
                                  WHERE status = 'pendente' ORDER BY solicitada_em LIMIT %s""", [limite]).fetchall()
    for (viagem_id,) in pendentes:
        remoto.execute("UPDATE comparacoes_urbs SET status = 'processando' WHERE viagem_id = %s AND status = 'pendente'", [viagem_id])
        try:
            viagem = carregar_viagem(remoto, viagem_id)
            if not viagem:
                raise RuntimeError("Viagem sem pontos GPS suficientes para a comparação.")
            resultado, motivo = comparar(local, viagem)
            if resultado:
                remoto.execute("""UPDATE comparacoes_urbs
                                  SET status='concluida', processada_em=now(), veiculo_urbs=%s, distancia_mediana_m=%s,
                                      motivo=null, resumo=%s::jsonb, serie_celular=%s::jsonb, serie_urbs=%s::jsonb
                                  WHERE viagem_id=%s""", [resultado["veiculo"], resultado["distancia"],
                                  __import__("json").dumps(resultado["resumo"]), __import__("json").dumps(resultado["celular"]),
                                  __import__("json").dumps(resultado["urbs"]), viagem_id])
                log.info("comparação URBS concluída para viagem %s (%s)", viagem_id[:8], resultado["veiculo"])
            else:
                remoto.execute("UPDATE comparacoes_urbs SET status='indisponivel', processada_em=now(), motivo=%s WHERE viagem_id=%s", [motivo, viagem_id])
                log.info("comparação URBS indisponível para viagem %s: %s", viagem_id[:8], motivo)
        except Exception as erro:
            remoto.execute("UPDATE comparacoes_urbs SET status='erro', processada_em=now(), motivo=%s WHERE viagem_id=%s", [str(erro), viagem_id])
            log.exception("erro ao processar comparação URBS da viagem %s", viagem_id[:8])
    return len(pendentes)
