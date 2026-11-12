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
import argparse, hashlib, os, sys
from collections import defaultdict

try:
    import duckdb
    import psycopg
    from dotenv import load_dotenv
except ImportError:
    sys.exit("Instale as dependências: pip install -r requirements.txt")

V_MAX, V_DETALHE = 90, 40
CATEGORIAS = ("LIGEIRÃO", "EXPRESSO")


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
    codigos = [r[0] for r in linhas_alvo(local)]
    if not codigos:
        raise RuntimeError("Nenhuma linha LIGEIRÃO/EXPRESSO encontrada no DuckDB.")
    with remoto.cursor() as cur:
        cur.execute("DELETE FROM trechos_publicos WHERE dia = %s", [dia])
        cur.execute("DELETE FROM veiculos_resumo WHERE dia = %s", [dia])
        cur.execute("DELETE FROM metricas_linha_hora WHERE dia = %s", [dia])

        # Cadastro é pequeno e pode ser atualizado a cada execução.
        cur.executemany("""INSERT INTO linhas (cod, nome, categoria) VALUES (%s, %s, %s)
                         ON CONFLICT (cod) DO UPDATE SET nome = excluded.nome, categoria = excluded.categoria, atualizado_em = now()""", linhas_alvo(local))

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
        cur.executemany("""INSERT INTO metricas_linha_hora
            (dia,cod_linha,hora,histograma,trechos,velocidade_max,descartados)
            VALUES (%s,%s,%s,%s::jsonb,%s,%s,%s)""", metricas)

        veiculos = local.execute("""SELECT dia, cod_linha, veiculo, count(*)
            FROM trechos WHERE dia = ? AND cod_linha IN (SELECT unnest(?)) AND vel_kmh < ? GROUP BY ALL""",
            [dia, codigos, V_MAX]).fetchall()
        cur.executemany("INSERT INTO veiculos_resumo (dia,cod_linha,veiculo,trechos) VALUES (%s,%s,%s,%s)", veiculos)

        detalhes = local.execute("""SELECT dia, cod_linha, veiculo, dthr, round(vel_kmh, 1), round(lat, 5), round(lon, 5)
            FROM trechos WHERE dia = ? AND cod_linha IN (SELECT unnest(?))
              AND vel_kmh >= ? AND vel_kmh < ?""", [dia, codigos, V_DETALHE, V_MAX]).fetchall()
        cur.executemany("""INSERT INTO trechos_publicos (dia,cod_linha,veiculo,dthr,velocidade_kmh,lat,lon)
                           VALUES (%s,%s,%s,%s,%s,%s,%s)""", detalhes)
        cur.execute("""INSERT INTO ingestoes_dia (dia,origem,checksum_sha256,registros)
                       VALUES (%s,%s,%s,%s)
                       ON CONFLICT (dia) DO UPDATE SET origem=excluded.origem, checksum_sha256=excluded.checksum_sha256,
                       registros=excluded.registros, processado_em=now()""", [dia, origem, sha, sum(r[3] for r in veiculos)])
    print(f"{dia}: {len(metricas)} métricas, {len(veiculos)} veículos, {len(detalhes)} trechos publicados")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--banco", default="onibus.duckdb")
    ap.add_argument("--dia", action="append", help="dia dos dados AAAA-MM-DD; pode repetir")
    ap.add_argument("--todos", action="store_true", help="publica todos os dias do DuckDB")
    ap.add_argument("--resumo", action="store_true")
    a = ap.parse_args()
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
    with psycopg.connect(url) as remoto:
        for dia in dias:
            nome = arquivos.get(str(dia), "")
            publicar_dia(local, remoto, dia, nome or "DuckDB local", checksum(nome))
        remoto.commit()

if __name__ == "__main__":
    main()
