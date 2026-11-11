#!/usr/bin/env python3
"""
Compara uma viagem gravada com viagem.html (velocidade medida pelo GPS do celular)
com os registros da URBS no banco (velocidade estimada entre posições consecutivas).

Uso:
    python3 comparar_viagem.py viagem_20261112_0815_linha203.json
    python3 comparar_viagem.py viagem.json --veiculo BE602      # se você sabe o código do ônibus
    python3 comparar_viagem.py viagem.json --limite 50

Requisito: o dia da viagem já estar importado no banco (importar_banco.py). Os arquivos da URBS
chegam com um dia de atraso: uma viagem em 12/11 aparece no arquivo extraído em 13/11.

Saídas: resumo no terminal e um CSV com o trecho a trecho (comparacao_<viagem>.csv).
Sem --veiculo, o ônibus é identificado pela proximidade entre a trilha do celular e as posições
da URBS na mesma linha e horário.
"""
import argparse, bisect, csv, datetime, json, math, os, statistics, sys

try:
    import duckdb
except ImportError:
    sys.exit("Instale o DuckDB primeiro:  pip install duckdb")

DT_MIN, DT_MAX = 3, 40       # mesmo filtro do banco (view trechos)
V_MAX = 90
OFFSET_OK_M = 150            # distância mediana aceitável entre celular e posição da URBS


def hav(la1, lo1, la2, lo2):
    p = math.pi / 180
    a = math.sin((la2 - la1) * p / 2) ** 2 + math.cos(la1 * p) * math.cos(la2 * p) * math.sin((lo2 - lo1) * p / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(a))


EPOCA = datetime.datetime(1970, 1, 1)


def ts(dt):
    """datetime ingênuo -> segundos (sem depender do fuso do computador)."""
    return (dt - EPOCA).total_seconds()


def local(ms, fuso_min):
    """ms (UTC) -> datetime local ingênuo, o mesmo formato do DTHR da URBS."""
    return EPOCA + datetime.timedelta(milliseconds=ms - fuso_min * 60000)


def carregar(caminho):
    v = json.load(open(caminho, encoding="utf-8"))
    cols = v["amostras_colunas"]
    am = []
    for linha in v["amostras"]:
        r = dict(zip(cols, linha))
        am.append({"t": ts(local(r["t_ms"], v["fuso_min"])), "dt": local(r["t_ms"], v["fuso_min"]),
                   "lat": r["lat"], "lon": r["lon"], "acc": r["precisao_m"], "v": r["vel_ms"]})
    am.sort(key=lambda x: x["t"])
    # sem velocidade do aparelho: deriva da posição (marca como calculada)
    for i, a in enumerate(am):
        a["calc"] = False
        if a["v"] is None and i > 0:
            d = a["t"] - am[i - 1]["t"]
            if d > 0:
                a["v"] = hav(am[i - 1]["lat"], am[i - 1]["lon"], a["lat"], a["lon"]) / d
                a["calc"] = True
    return v, am


def escolher_veiculo(fixes_por_veic, am, veiculo=None):
    tempos = [a["t"] for a in am]
    pontos = {}
    for v, fx in fixes_por_veic.items():
        ds = []
        for t, lat, lon in fx:
            i = bisect.bisect_left(tempos, ts(t))
            cand = [j for j in (i - 1, i) if 0 <= j < len(am) and abs(am[j]["t"] - ts(t)) <= 10]
            if cand:
                j = min(cand, key=lambda j: abs(am[j]["t"] - ts(t)))
                ds.append(hav(lat, lon, am[j]["lat"], am[j]["lon"]))
        if len(ds) >= 3:
            pontos[v] = statistics.median(ds)
    if veiculo:
        if veiculo not in fixes_por_veic:
            sys.exit("Veículo %s não tem posições nessa linha e horário no banco." % veiculo)
        return veiculo, pontos.get(veiculo), pontos
    if not pontos:
        sys.exit("Nenhum veículo da linha tem posições próximas à sua trilha. O dia da viagem foi importado no banco?")
    v = min(pontos, key=pontos.get)
    return v, pontos[v], pontos


def interpolar(am, tempos, t):
    i = bisect.bisect_left(tempos, t)
    if i <= 0 or i >= len(am):
        return None
    a, b = am[i - 1], am[i]
    if b["t"] - a["t"] > 10 or b["t"] == a["t"]:
        return None
    f = (t - a["t"]) / (b["t"] - a["t"])
    return a["lat"] + (b["lat"] - a["lat"]) * f, a["lon"] + (b["lon"] - a["lon"]) * f


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("viagem", help="arquivo .json gerado pelo viagem.html")
    ap.add_argument("--banco", default="onibus.duckdb")
    ap.add_argument("--veiculo", help="código do ônibus (padrão: identificado automaticamente)")
    ap.add_argument("--limite", type=float, default=50, help="limite de velocidade para a contagem (km/h, padrão 50)")
    ap.add_argument("--saida", help="CSV de saída (padrão: comparacao_<viagem>.csv)")
    a = ap.parse_args()

    viagem, am = carregar(a.viagem)
    if len(am) < 10:
        sys.exit("Viagem com poucas amostras (%d)." % len(am))
    t0, t1 = am[0]["dt"], am[-1]["dt"]
    linha = viagem["linha"]
    print("Viagem: linha %s%s, %s a %s (horário local), %d pontos" % (
        linha, " (%s)" % viagem["nome_linha"] if viagem.get("nome_linha") else "", t0.strftime("%d/%m/%Y %H:%M:%S"), t1.strftime("%H:%M:%S"), len(am)))

    if not os.path.exists(a.banco):
        sys.exit("Banco não encontrado: %s" % a.banco)
    con = duckdb.connect(a.banco, read_only=True)
    pad = datetime.timedelta(seconds=90)
    rows = con.execute("""SELECT DISTINCT veiculo, dthr, lat, lon FROM posicoes
                          WHERE cod_linha = ? AND dthr BETWEEN ? AND ? ORDER BY veiculo, dthr""", [linha, t0 - pad, t1 + pad]).fetchall()
    if not rows:
        sys.exit("O banco não tem posições da linha %s nesse horário. Importe o dia %s (arquivo extraído no dia seguinte)." % (linha, t0.date()))
    por_veic = {}
    for v, t, la, lo in rows:
        por_veic.setdefault(v, []).append((t, la, lo))

    veic, offset, todos = escolher_veiculo(por_veic, am, (a.veiculo or viagem.get("veiculo") or None))
    print("Veículo na URBS: %s (distância mediana até o celular: %s)" % (veic, "%.0f m" % offset if offset is not None else "n/d"))
    if viagem.get("veiculo") and viagem["veiculo"] != veic and not a.veiculo:
        print("  Atenção: você informou %s, mas o mais próximo da sua trilha é %s." % (viagem["veiculo"], veic))
    outros = sorted((d, v) for v, d in todos.items() if v != veic)[:2]
    if outros:
        print("  Próximos candidatos:", ", ".join("%s (%.0f m)" % (v, d) for d, v in outros))
    if offset is None or offset > OFFSET_OK_M:
        print("  AVISO: a distância é grande (> %d m). Pode ser outro ônibus ou erro de horário; confira --veiculo." % OFFSET_OK_M)

    tempos = [x["t"] for x in am]
    fx = [(t, la, lo) for t, la, lo in por_veic[veic] if t0 - pad <= t <= t1 + pad]
    seg = []
    for (ta, la, loa), (tb, lb, lob) in zip(fx, fx[1:]):
        dt = (tb - ta).total_seconds()
        if not (DT_MIN <= dt <= DT_MAX) or ta < t0 or tb > t1:
            continue
        v_urbs = hav(la, loa, lb, lob) / dt * 3.6
        if v_urbs >= V_MAX:
            continue
        ea, eb = ts(ta), ts(tb)
        dentro = [x for x in am if ea <= x["t"] <= eb and x["v"] is not None]
        if len(dentro) < max(2, dt * 0.5):
            continue                     # lacuna no GPS do celular
        vs = [x["v"] * 3.6 for x in dentro]
        pos = interpolar(am, tempos, eb)
        seg.append({"hora_local": tb.strftime("%H:%M:%S"), "dt_s": int(dt), "v_urbs": v_urbs,
                    "v_cel_media": statistics.fmean(vs), "v_cel_max": max(vs),
                    "offset_m": hav(lb, lob, *pos) if pos else None})
    if not seg:
        sys.exit("Nenhum trecho comparável (verifique horários e se o celular manteve o GPS ligado).")

    for s in seg:
        s["dif_media"] = s["v_urbs"] - s["v_cel_media"]
        s["dif_max"] = s["v_urbs"] - s["v_cel_max"]

    saida = a.saida or "comparacao_%s.csv" % os.path.splitext(os.path.basename(a.viagem))[0]
    with open(saida, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["hora_local", "dt_s", "v_urbs_kmh", "v_celular_media_kmh", "v_celular_max_kmh", "dif_urbs_menos_media", "dif_urbs_menos_max", "dist_urbs_celular_m"])
        for s in seg:
            w.writerow([s["hora_local"], s["dt_s"], *(round(s[k], 1) for k in ("v_urbs", "v_cel_media", "v_cel_max", "dif_media", "dif_max")),
                        round(s["offset_m"]) if s["offset_m"] is not None else ""])

    med = lambda k: statistics.median(s[k] for s in seg)
    print("\n%d trechos comparados (registros da URBS a cada %d–%d s)" % (len(seg), DT_MIN, DT_MAX))
    print("                         mediana   máxima")
    print("  URBS (estimada)        %6.1f   %6.1f km/h" % (med("v_urbs"), max(s["v_urbs"] for s in seg)))
    print("  Celular (média trecho) %6.1f   %6.1f km/h" % (med("v_cel_media"), max(s["v_cel_media"] for s in seg)))
    print("  Celular (pico trecho)  %6.1f   %6.1f km/h" % (med("v_cel_max"), max(s["v_cel_max"] for s in seg)))
    print("\nURBS menos celular (média do trecho): mediana %+.1f km/h, erro absoluto médio %.1f km/h" % (
        med("dif_media"), statistics.fmean(abs(s["dif_media"]) for s in seg)))
    print("URBS menos celular (pico do trecho):  mediana %+.1f km/h; no pior caso %+.1f km/h" % (med("dif_max"), min(s["dif_max"] for s in seg)))
    if len(seg) > 2:
        try:
            print("Correlação URBS x celular (média do trecho): %.2f" % statistics.correlation([s["v_urbs"] for s in seg], [s["v_cel_media"] for s in seg]))
        except statistics.StatisticsError:
            pass
    L = a.limite
    print("\nTrechos a partir de %g km/h:  URBS %d  |  celular (média) %d  |  celular (pico) %d" % (
        L, sum(s["v_urbs"] >= L for s in seg), sum(s["v_cel_media"] >= L for s in seg), sum(s["v_cel_max"] >= L for s in seg)))

    print("\nTrechos mais rápidos pelo celular (pico):")
    for s in sorted(seg, key=lambda s: -s["v_cel_max"])[:8]:
        print("  %s  celular pico %5.1f / média %5.1f  |  URBS %5.1f km/h" % (s["hora_local"], s["v_cel_max"], s["v_cel_media"], s["v_urbs"]))

    if viagem.get("marcas"):
        print("\nMomentos marcados por você:")
        for m in viagem["marcas"]:
            tm = local(m["t_ms"], viagem["fuso_min"])
            prox = min(seg, key=lambda s: abs((datetime.datetime.strptime(s["hora_local"], "%H:%M:%S").replace(
                year=tm.year, month=tm.month, day=tm.day) - tm).total_seconds()), default=None)
            print("  %s  celular %s km/h  |  trecho URBS mais próximo (%s): %.1f km/h" % (
                tm.strftime("%H:%M:%S"), "%.0f" % (m["vel_ms"] * 3.6) if m.get("vel_ms") is not None else "n/d",
                prox["hora_local"], prox["v_urbs"]))
    print("\nCSV:", saida)


if __name__ == "__main__":
    main()
