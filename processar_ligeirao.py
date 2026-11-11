#!/usr/bin/env python3
"""
Lê o banco DuckDB (criado por importar_banco.py) e gera ligeirao.html, a página com a
velocidade estimada dos ônibus das canaletas.

Uso:
    python3 processar_ligeirao.py                                   # Ligeirão + Expresso, todos os dias do banco
    python3 processar_ligeirao.py --categorias "LIGEIRÃO"           # só Ligeirão
    python3 processar_ligeirao.py --inicio 2026-03-01 --fim 2026-03-31

IMPORTANTE: os dados da URBS NÃO têm velocidade. Ela é estimada pela view `trechos` do banco:
distância (Haversine) / tempo entre duas posições GPS consecutivas do mesmo veículo.
"""
import argparse, json, os, sys

try:
    import duckdb
except ImportError:
    sys.exit("Instale o DuckDB primeiro:  pip install duckdb")

V_MAX = 90        # acima disso é descartado como salto de GPS (km/h)
V_DETALHE = 40    # só guarda o trecho individual se >= isso (km/h)

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("--banco", default="onibus.duckdb")
ap.add_argument("--categorias", default="LIGEIRÃO,EXPRESSO",
                help="categorias da URBS separadas por vírgula (Expresso = biarticulados; "
                     "os dados não distinguem biarticulado de articulado)")
ap.add_argument("--inicio", help="AAAA-MM-DD (dia dos dados)")
ap.add_argument("--fim", help="AAAA-MM-DD (dia dos dados)")
a = ap.parse_args()

if not os.path.exists(a.banco):
    sys.exit("Banco não encontrado: %s. Rode antes: python3 importar_banco.py" % a.banco)
con = duckdb.connect(a.banco, read_only=True)
categorias = [c.strip().upper() for c in a.categorias.split(",")]

# linhas das categorias, usando o cadastro mais recente
todas = con.execute("""SELECT cod, nome, upper(categoria) FROM linhas
                       WHERE dia = (SELECT max(dia) FROM linhas) ORDER BY cod""").fetchall()
if not todas:
    sys.exit("Banco sem cadastro de linhas. Importe um arquivo *_linhas.json.xz.")
linhas = []
for g, cat in enumerate(categorias):
    sel = [(cod, nome, g) for cod, nome, c in todas if c == cat]
    if not sel:
        sys.exit("Nenhuma linha na categoria " + cat)
    linhas += sel
cod2i = {l[0]: i for i, l in enumerate(linhas)}
print("Linhas:", [(l[0], l[1]) for l in linhas])

# filtro comum
con.execute("CREATE TEMP TABLE alvo(cod VARCHAR, li INTEGER)")
con.executemany("INSERT INTO alvo VALUES (?, ?)", [(cod, i) for cod, i in cod2i.items()])
filtro, par = "", []
if a.inicio:
    filtro += " AND t.dia >= ?"; par.append(a.inicio)
if a.fim:
    filtro += " AND t.dia <= ?"; par.append(a.fim)
base = ("FROM trechos t JOIN alvo ON alvo.cod = t.cod_linha WHERE true" + filtro)

dias = [str(r[0]) for r in con.execute("SELECT DISTINCT t.dia " + base + " ORDER BY 1", par).fetchall()]
if not dias:
    sys.exit("Nenhum trecho encontrado para essas linhas/período.")
dia2i = {d: i for i, d in enumerate(dias)}

# histograma: linha x hora x faixa de 1 km/h
hist = [[[0] * V_MAX for _ in range(24)] for _ in linhas]
for li, h, b, n in con.execute(
        "SELECT alvo.li, hour(t.dthr)::INT, floor(t.vel_kmh)::INT, count(*) " + base +
        " AND t.vel_kmh < %d GROUP BY ALL" % V_MAX, par).fetchall():
    hist[li][h][b] = n

stats = [{"n": 0, "max": 0.0, "descartados": 0} for _ in linhas]
for li, n, mx, desc in con.execute(
        "SELECT alvo.li, count(*) FILTER (WHERE t.vel_kmh < %d), max(t.vel_kmh) FILTER (WHERE t.vel_kmh < %d), "
        "count(*) FILTER (WHERE t.vel_kmh >= %d) " % (V_MAX, V_MAX, V_MAX) + base + " GROUP BY ALL", par).fetchall():
    stats[li] = {"n": n, "max": round(mx or 0, 1), "descartados": desc}

# veículos (nome, linha, total de trechos)
veic, veic_idx = [], {}
for v, li, n in con.execute(
        "SELECT t.veiculo, alvo.li, count(*) " + base + " AND t.vel_kmh < %d GROUP BY ALL ORDER BY 2, 1" % V_MAX, par).fetchall():
    veic_idx[(v, li)] = len(veic)
    veic.append([v, li, n])

# trechos individuais rápidos (para mapa e ranking)
detalhe = []
for v, li, dia, sod, vel, lat, lon in con.execute(
        "SELECT t.veiculo, alvo.li, t.dia, date_diff('second', date_trunc('day', t.dthr), t.dthr), t.vel_kmh, t.lat, t.lon " + base +
        " AND t.vel_kmh >= %d AND t.vel_kmh < %d ORDER BY t.dthr" % (V_DETALHE, V_MAX), par).fetchall():
    detalhe.append([li, veic_idx[(v, li)], dia2i[str(dia)], sod, round(vel * 10), round(lat * 1e5), round(lon * 1e5)])

dados = {
    "grupos": [{"nome": c.title()} for c in categorias],
    "linhas": [{"cod": cod, "nome": " ".join(nome.title().split()), "g": g} for cod, nome, g in linhas],
    "dias": dias, "hist": hist, "stats": stats, "veic": veic, "detalhe": detalhe,
    "params": {"dtMin": 3, "dtMax": 40, "vMax": V_MAX, "vDetalhe": V_DETALHE},
}

aqui = os.path.dirname(os.path.abspath(__file__))
modelo = open(os.path.join(aqui, "modelo_ligeirao.html"), encoding="utf-8").read()
saida = os.path.join(aqui, "ligeirao.html")
open(saida, "w", encoding="utf-8").write(
    modelo.replace("/*__DADOS__*/null", json.dumps(dados, ensure_ascii=False, separators=(",", ":"))))
print("Gerado", saida, "-", len(dias), "dia(s),", sum(s["n"] for s in stats), "trechos,", len(detalhe), "trechos >=", V_DETALHE, "km/h")
