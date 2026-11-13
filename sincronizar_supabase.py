#!/usr/bin/env python3
"""Publica no Supabase os dados derivados do DuckDB local.

Os arquivos da URBS e o DuckDB permanecem locais. Este programa envia apenas
métricas agregadas e trechos >= 40 km/h usados pelo mapa.

Uso:
    export SUPABASE_DB_URL='postgresql://...'
    pip install -r requirements.txt
    python3 sincronizar_supabase.py --resumo
    python3 sincronizar_supabase.py --dia 2026-11-10
    python3 sincronizar_supabase.py --todos
"""
import argparse, hashlib, logging, os, sys, time
from collections import defaultdict

from comparacoes_urbs import processar_pendentes

try:
    import duckdb
    import psycopg
    from dotenv import load_dotenv
except ImportError:
    sys.exit("Instale as dependências: pip install -r requirements.txt")

V_MAX, V_DETALHE = 90, 40
CATEGORIAS = ("LIGEIRÃO", "EXPRESSO")
LOTE_INSERCAO = 1_000
log = logging.getLogger(__name__)


def duracao(inicio):
    return f"{time.perf_counter() - inicio:.1f}s"


def inserir_em_lotes(cur, sql, registros, descricao):
    """Insere registros em lotes para tornar o progresso visível no terminal."""
    total = len(registros)
    if not total:
        log.info("%s: nenhum registro para enviar", descricao)
        return
    inicio = time.perf_counter()
    lotes = (total + LOTE_INSERCAO - 1) // LOTE_INSERCAO
    log.info("%s: enviando %d registro(s) em %d lote(s)", descricao, total, lotes)
    for indice, inicio_lote in enumerate(range(0, total, LOTE_INSERCAO), 1):
        cur.executemany(sql, registros[inicio_lote:inicio_lote + LOTE_INSERCAO])
        log.info("%s: lote %d/%d concluído (%d/%d; %s)", descricao, indice, lotes,
                 min(inicio_lote + LOTE_INSERCAO, total), total, duracao(inicio))


def checksum(path):
    if not path or not os.path.exists(path):
        return "sem-arquivo-local"
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for bloco in iter(lambda: f.read(1024 * 1024), b""):
            h.update(bloco)
    return h.hexdigest()


def linhas_alvo(con):
    dia = con.execute("SELECT max(dia) FROM linhas").fetchone()[0]
    rows = con.execute("SELECT cod, nome, upper(categoria) FROM linhas WHERE dia = ?", [dia]).fetchall()
    return [(c, n, cat) for c, n, cat in rows if cat in CATEGORIAS]


def publicar_dia(local, remoto, dia, origem, sha):
    inicio_dia = time.perf_counter()
    log.info("%s: iniciando publicação", dia)
    codigos = [r[0] for r in linhas_alvo(local)]
    if not codigos:
        raise RuntimeError("Nenhuma linha LIGEIRÃO/EXPRESSO encontrada no DuckDB.")
    log.info("%s: %d linha(s) alvo", dia, len(codigos))
    with remoto.cursor() as cur:
        inicio = time.perf_counter()
        log.info("%s: removendo dados publicados anteriormente", dia)
        cur.execute("DELETE FROM trechos_publicos WHERE dia = %s", [dia])
        cur.execute("DELETE FROM veiculos_resumo WHERE dia = %s", [dia])
        cur.execute("DELETE FROM metricas_linha_hora WHERE dia = %s", [dia])
        log.info("%s: remoção concluída (%s)", dia, duracao(inicio))

        # Cadastro é pequeno e pode ser atualizado a cada execução.
        inicio = time.perf_counter()
        linhas = linhas_alvo(local)
        inserir_em_lotes(cur, """INSERT INTO linhas (cod, nome, categoria) VALUES (%s, %s, %s)
                         ON CONFLICT (cod) DO UPDATE SET nome = excluded.nome, categoria = excluded.categoria, atualizado_em = now()""", linhas, f"{dia}: linhas")
        log.info("%s: cadastro de linhas concluído (%s)", dia, duracao(inicio))

        inicio = time.perf_counter()
        log.info("%s: calculando métricas no DuckDB", dia)
        hist = defaultdict(lambda: [0] * V_MAX)
        q = """SELECT t.cod_linha, hour(t.dthr)::int, floor(t.vel_kmh)::int, count(*)
               FROM trechos t WHERE t.dia = ? AND t.cod_linha IN (SELECT unnest(?))
                 AND t.vel_kmh >= 0 AND t.vel_kmh < ? GROUP BY ALL"""
        for cod, hora, faixa, n in local.execute(q, [dia, codigos, V_MAX]).fetchall():
            hist[(cod, hora)][faixa] = n
        estat = local.execute("""SELECT cod_linha, hour(dthr)::int,
              count(*) FILTER (WHERE vel_kmh < ?) AS trechos,
              coalesce(max(vel_kmh) FILTER (WHERE vel_kmh < ?), 0) AS vmax,
              count(*) FILTER (WHERE vel_kmh >= ?) AS descartados
            FROM trechos WHERE dia = ? AND cod_linha IN (SELECT unnest(?)) GROUP BY ALL""",
            [V_MAX, V_MAX, V_MAX, dia, codigos]).fetchall()
        metricas = [(dia, cod, hora, __import__("json").dumps(hist[(cod, hora)]), n, mx, desc)
                    for cod, hora, n, mx, desc in estat]
        log.info("%s: %d métrica(s) preparada(s) (%s)", dia, len(metricas), duracao(inicio))
        inserir_em_lotes(cur, """INSERT INTO metricas_linha_hora
            (dia,cod_linha,hora,histograma,trechos,velocidade_max,descartados)
            VALUES (%s,%s,%s,%s::jsonb,%s,%s,%s)""", metricas, f"{dia}: métricas")

        inicio = time.perf_counter()
        log.info("%s: calculando resumo de veículos no DuckDB", dia)
        veiculos = local.execute("""SELECT dia, cod_linha, veiculo, count(*)
            FROM trechos WHERE dia = ? AND cod_linha IN (SELECT unnest(?)) AND vel_kmh < ? GROUP BY ALL""",
            [dia, codigos, V_MAX]).fetchall()
        log.info("%s: %d resumo(s) de veículo preparado(s) (%s)", dia, len(veiculos), duracao(inicio))
        inserir_em_lotes(cur, "INSERT INTO veiculos_resumo (dia,cod_linha,veiculo,trechos) VALUES (%s,%s,%s,%s)", veiculos, f"{dia}: veículos")

        inicio = time.perf_counter()
        log.info("%s: selecionando trechos públicos no DuckDB", dia)
        detalhes = local.execute("""SELECT dia, cod_linha, veiculo, dthr, round(vel_kmh, 1), round(lat, 5), round(lon, 5)
            FROM trechos WHERE dia = ? AND cod_linha IN (SELECT unnest(?))
              AND vel_kmh >= ? AND vel_kmh < ?""", [dia, codigos, V_DETALHE, V_MAX]).fetchall()
        log.info("%s: %d trecho(s) público(s) preparado(s) (%s)", dia, len(detalhes), duracao(inicio))
        inserir_em_lotes(cur, """INSERT INTO trechos_publicos (dia,cod_linha,veiculo,dthr,velocidade_kmh,lat,lon)
                           VALUES (%s,%s,%s,%s,%s,%s,%s)""", detalhes, f"{dia}: trechos públicos")
        inicio = time.perf_counter()
        log.info("%s: publicando posições completas para navegação", dia)
        cur.execute("DELETE FROM posicoes_navegacao WHERE dia = %s", [dia])
        cursor_local = local.execute("""SELECT DISTINCT cast(dthr as date), cod_linha, veiculo, dthr,
                                      round(lat, 6), round(lon, 6) FROM posicoes
                                      WHERE cast(dthr as date) = ? ORDER BY cod_linha, veiculo, dthr""", [dia])
        total = 0
        while lote := cursor_local.fetchmany(LOTE_INSERCAO):
            cur.executemany("""INSERT INTO posicoes_navegacao (dia,cod_linha,veiculo,dthr,lat,lon)
                             VALUES (%s,%s,%s,%s,%s,%s)""", lote)
            total += len(lote)
            if total % (LOTE_INSERCAO * 20) == 0:
                log.info("%s: %d posições de navegação enviadas", dia, total)
        log.info("%s: %d posições completas publicadas (%s)", dia, total, duracao(inicio))
        inicio = time.perf_counter()
        cur.execute("""INSERT INTO ingestoes_dia (dia,origem,checksum_sha256,registros)
                       VALUES (%s,%s,%s,%s)
                       ON CONFLICT (dia) DO UPDATE SET origem=excluded.origem, checksum_sha256=excluded.checksum_sha256,
                       registros=excluded.registros, processado_em=now()""", [dia, origem, sha, sum(r[3] for r in veiculos)])
        log.info("%s: metadados de ingestão atualizados (%s)", dia, duracao(inicio))
    log.info("%s: preparado para commit — %d métricas, %d veículos, %d trechos (%s)", dia,
             len(metricas), len(veiculos), len(detalhes), duracao(inicio_dia))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--banco", default="onibus.duckdb")
    ap.add_argument("--dia", action="append", help="dia dos dados AAAA-MM-DD; pode repetir")
    ap.add_argument("--todos", action="store_true", help="publica todos os dias do DuckDB")
    ap.add_argument("--resumo", action="store_true")
    ap.add_argument("--log-level", default="INFO", choices=("DEBUG", "INFO", "WARNING", "ERROR"),
                    help="nível de detalhe dos logs (padrão: INFO)")
    a = ap.parse_args()
    logging.basicConfig(level=getattr(logging, a.log_level), format="%(asctime)s %(levelname)s %(message)s",
                        datefmt="%H:%M:%S")
    load_dotenv()
    url = os.getenv("SUPABASE_DB_URL")
    if not url:
        sys.exit("Defina SUPABASE_DB_URL no ambiente; veja .env.example.")
    local = duckdb.connect(a.banco, read_only=True)
    if a.resumo:
        for row in local.execute("SELECT dia_dados, arquivo, registros FROM arquivos_importados ORDER BY 1").fetchall(): print(*row)
        return
    existentes = [str(r[0]) for r in local.execute("SELECT DISTINCT dia FROM trechos ORDER BY 1").fetchall()]
    dias = a.dia or (existentes if a.todos else existentes[-1:])
    if not dias: sys.exit("Não há dias no DuckDB.")
    arquivos = {str(d): n for n, d in local.execute("SELECT arquivo, dia_dados FROM arquivos_importados").fetchall()}
    log.info("conectando ao Supabase para publicar %d dia(s)", len(dias))
    inicio_conexao = time.perf_counter()
    with psycopg.connect(url) as remoto:
        log.info("conexão com Supabase estabelecida (%s)", duracao(inicio_conexao))
        for dia in dias:
            nome = arquivos.get(str(dia), "")
            inicio_checksum = time.perf_counter()
            log.info("%s: calculando checksum da origem", dia)
            sha = checksum(nome)
            log.info("%s: checksum concluído (%s)", dia, duracao(inicio_checksum))
            publicar_dia(local, remoto, dia, nome or "DuckDB local", sha)
        log.info("processando solicitações pendentes de comparação com a URBS")
        n_comparacoes = processar_pendentes(local, remoto)
        if n_comparacoes:
            log.info("%d comparação(ões) URBS processada(s)", n_comparacoes)
        inicio_commit = time.perf_counter()
        log.info("confirmando transação no Supabase")
        remoto.commit()
        log.info("commit concluído (%s)", duracao(inicio_commit))

if __name__ == "__main__":
    main()
