#!/usr/bin/env python3
"""
Importa os arquivos diários da URBS (*.json.xz) para um banco DuckDB (onibus.duckdb).

Uso:
    pip install duckdb
    python3 importar_banco.py [pasta_dos_arquivos]            # importa o que ainda não foi importado
    python3 importar_banco.py . --reimportar                  # refaz a importação dos arquivos
    python3 importar_banco.py --resumo                        # mostra o que há no banco

Tabelas:
    posicoes(arquivo, veiculo, cod_linha, dthr, lat, lon)     -- todos os registros de GPS, todas as linhas
    linhas(dia, cod, nome, categoria, cor, somente_cartao)    -- cadastro de linhas (um retrato por arquivo)
    arquivos_importados(arquivo, dia_dados, registros, importado_em)
Visão:
    trechos  -- velocidade estimada entre dois registros consecutivos do mesmo veículo/linha
                (dist. Haversine / tempo; só intervalos de 3 a 40 s)

Exemplos de consulta (duckdb onibus.duckdb, ou Python):
    SELECT cod_linha, count(*), avg(vel_kmh), max(vel_kmh) FROM trechos WHERE vel_kmh < 90 GROUP BY 1 ORDER BY 3 DESC;

A velocidade é ESTIMADA: os dados da URBS não trazem velocidade.
"""
import argparse, glob, json, lzma, os, re, sys, tempfile, time

try:
    import duckdb
except ImportError:
    sys.exit("Instale o DuckDB primeiro:  pip install duckdb")

DT_MIN, DT_MAX = 3, 40   # intervalo aceito entre dois registros (s)

SQL_INICIAL = """
CREATE TABLE IF NOT EXISTS posicoes (
    arquivo VARCHAR, veiculo VARCHAR, cod_linha VARCHAR, dthr TIMESTAMP, lat DOUBLE, lon DOUBLE);
CREATE TABLE IF NOT EXISTS linhas (
    dia DATE, cod VARCHAR, nome VARCHAR, categoria VARCHAR, cor VARCHAR, somente_cartao VARCHAR);
CREATE TABLE IF NOT EXISTS arquivos_importados (
    arquivo VARCHAR PRIMARY KEY, dia_dados DATE, registros BIGINT, importado_em TIMESTAMP);
CREATE OR REPLACE VIEW trechos AS
WITH p AS (
    SELECT DISTINCT veiculo, cod_linha, dthr, lat, lon FROM posicoes
), q AS (
    SELECT veiculo, cod_linha, dthr, lat, lon,
           lag(dthr) OVER w AS dthr_ant, lag(lat) OVER w AS lat_ant, lag(lon) OVER w AS lon_ant
    FROM p WINDOW w AS (PARTITION BY veiculo, cod_linha ORDER BY dthr)
), r AS (
    SELECT *, date_diff('second', dthr_ant, dthr) AS dt_s,
           2 * 6371000 * asin(sqrt(
               pow(sin(radians(lat - lat_ant) / 2), 2)
             + cos(radians(lat_ant)) * cos(radians(lat)) * pow(sin(radians(lon - lon_ant) / 2), 2))) AS dist_m
    FROM q WHERE dthr_ant IS NOT NULL
)
SELECT veiculo, cod_linha, dthr, CAST(dthr AS DATE) AS dia, lat, lon, dt_s, dist_m,
       dist_m / dt_s * 3.6 AS vel_kmh
FROM r WHERE dt_s BETWEEN %d AND %d;
""" % (DT_MIN, DT_MAX)


def conectar(caminho):
    con = duckdb.connect(caminho)
    con.execute(SQL_INICIAL)
    return con


def abrir_xz(caminho):
    return lzma.open(caminho, "rt", encoding="utf-8")


def importar_veiculos(con, caminho):
    nome = os.path.basename(caminho)
    t0 = time.time()
    with tempfile.TemporaryDirectory() as tmp:
        nd = os.path.join(tmp, "veiculos.ndjson")
        with abrir_xz(caminho) as f, open(nd, "w", encoding="utf-8") as o:
            for linha in f:          # o arquivo da URBS tem linhas em branco
                if linha.strip():
                    o.write(linha)
        con.execute("BEGIN")
        con.execute("DELETE FROM posicoes WHERE arquivo = ?", [nome])
        con.execute("DELETE FROM arquivos_importados WHERE arquivo = ?", [nome])
        con.execute("""
            INSERT INTO posicoes
            SELECT ?, VEIC, COD_LINHA,
                   strptime(DTHR, '%d/%m/%Y %H:%M:%S'),
                   replace(LAT, ',', '.')::DOUBLE, replace(LON, ',', '.')::DOUBLE
            FROM read_json(?, format = 'newline_delimited',
                           columns = {'VEIC': 'VARCHAR', 'LAT': 'VARCHAR', 'LON': 'VARCHAR',
                                      'DTHR': 'VARCHAR', 'COD_LINHA': 'VARCHAR'})
            ORDER BY 4, 3, 2
        """, [nome, nd])
        n, dia = con.execute("SELECT count(*), mode(CAST(dthr AS DATE)) FROM posicoes WHERE arquivo = ?", [nome]).fetchone()
        con.execute("INSERT INTO arquivos_importados VALUES (?, ?, ?, now())", [nome, dia, n])
        con.execute("COMMIT")
    print("  %s: %s registros, dia dos dados %s (%.0f s)" % (nome, format(n, ","), dia, time.time() - t0))


def importar_linhas(con, caminho):
    nome = os.path.basename(caminho)
    m = re.match(r"(\d{4})_(\d{2})_(\d{2})", nome)
    dia = "%s-%s-%s" % m.groups() if m else None
    with abrir_xz(caminho) as f:
        dados = json.load(f)
    con.execute("BEGIN")
    con.execute("DELETE FROM linhas WHERE dia = ?", [dia])
    con.executemany("INSERT INTO linhas VALUES (?, ?, ?, ?, ?, ?)",
                    [(dia, l["COD"], l["NOME"], l["CATEGORIA_SERVICO"], l.get("NOME_COR"), l.get("SOMENTE_CARTAO")) for l in dados])
    con.execute("COMMIT")
    print("  %s: %d linhas" % (nome, len(dados)))


def resumo(con):
    print("Arquivos importados:")
    for r in con.execute("SELECT arquivo, dia_dados, registros FROM arquivos_importados ORDER BY dia_dados").fetchall():
        print("  %s  dia %s  %s registros" % (r[0], r[1], format(r[2], ",")))
    print("Total de posições:", format(con.execute("SELECT count(*) FROM posicoes").fetchone()[0], ","))
    print("Categorias de linhas (retrato mais recente):")
    for r in con.execute("""SELECT categoria, count(*) FROM linhas
                            WHERE dia = (SELECT max(dia) FROM linhas) GROUP BY 1 ORDER BY 2 DESC""").fetchall():
        print("  %-24s %d" % r)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pasta", nargs="?", default=".", help="pasta com os *.json.xz (padrão: atual)")
    ap.add_argument("--banco", default="onibus.duckdb", help="arquivo do banco (padrão: onibus.duckdb)")
    ap.add_argument("--reimportar", action="store_true", help="importa de novo mesmo os arquivos já importados")
    ap.add_argument("--resumo", action="store_true", help="só mostra o conteúdo do banco")
    a = ap.parse_args()

    con = conectar(a.banco)
    if a.resumo:
        return resumo(con)

    feitos = {r[0] for r in con.execute("SELECT arquivo FROM arquivos_importados").fetchall()}
    veic = sorted(glob.glob(os.path.join(a.pasta, "*_veiculos.json.xz")))
    lin = sorted(glob.glob(os.path.join(a.pasta, "*_linhas.json.xz")))
    if not veic and not lin:
        sys.exit("Nenhum *_veiculos.json.xz ou *_linhas.json.xz em " + a.pasta)
    for c in lin:
        importar_linhas(con, c)
    novos = [c for c in veic if a.reimportar or os.path.basename(c) not in feitos]
    print("%d arquivo(s) de veículos para importar (%d já importados)" % (len(novos), len(veic) - len(novos)))
    for c in novos:
        importar_veiculos(con, c)
    con.close()
    print("Pronto:", a.banco, "-", round(os.path.getsize(a.banco) / 1e6), "MB")


if __name__ == "__main__":
    main()
