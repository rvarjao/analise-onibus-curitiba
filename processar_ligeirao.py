#!/usr/bin/env python3
"""
Processa os arquivos diários da URBS (veiculos + linhas) e gera ligeirao.html,
uma página única com a análise de velocidade estimada dos Ligeirões.

Uso:
    python3 processar_ligeirao.py [pasta_com_os_arquivos] [categorias separadas por vírgula]

Espera arquivos no padrão AAAA_MM_DD_veiculos.json.xz e AAAA_MM_DD_linhas.json.xz.
Todos os dias encontrados na pasta são somados. Categorias padrão: LIGEIRÃO,EXPRESSO (Expresso = biarticulados
que circulam pelas canaletas; os dados não distinguem biarticulado de articulado).

IMPORTANTE: os dados da URBS NÃO têm velocidade. Ela é estimada aqui como
distância (Haversine) / tempo entre duas posições GPS consecutivas do mesmo veículo.
"""
import glob, json, lzma, math, os, sys, collections, datetime

pasta = sys.argv[1] if len(sys.argv) > 1 else "."
categorias = [c.strip().upper() for c in (sys.argv[2] if len(sys.argv) > 2 else "LIGEIRÃO,EXPRESSO").split(",")]
DT_MIN, DT_MAX = 3, 40      # intervalo aceito entre dois pontos (s)
V_MAX = 90                  # acima disso é descartado como salto de GPS (km/h)
V_DETALHE = 40              # só guarda o trecho individual se >= isso (km/h)

def haversine(lat1, lon1, lat2, lon2):
    p = math.pi / 180
    a = math.sin((lat2 - lat1) * p / 2) ** 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lon2 - lon1) * p / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(a))

def abrir(caminho):
    return lzma.open(caminho, "rt", encoding="utf-8")

arqs_vei = sorted(glob.glob(os.path.join(pasta, "*_veiculos.json.xz")))
if not arqs_vei:
    sys.exit("Nenhum arquivo *_veiculos.json.xz encontrado em " + pasta)

# linhas da categoria (usa o arquivo de linhas mais recente)
arq_lin = sorted(glob.glob(os.path.join(pasta, "*_linhas.json.xz")))[-1]
todas = json.load(abrir(arq_lin))
linhas = []
for g, cat in enumerate(categorias):
    sel = sorted((l for l in todas if l["CATEGORIA_SERVICO"].upper() == cat), key=lambda l: l["COD"])
    if not sel:
        sys.exit("Nenhuma linha na categoria " + cat)
    for l in sel:
        l["g"] = g
    linhas += sel
cod2i = {l["COD"]: i for i, l in enumerate(linhas)}
print("Linhas:", [(l["COD"], l["NOME"]) for l in linhas])

hist = [[[0] * V_MAX for _ in range(24)] for _ in linhas]
stats = [{"n": 0, "max": 0.0, "descartados": 0} for _ in linhas]
veic_idx, veic = {}, []          # veic[i] = [nome, linha, total_trechos]
detalhe, dias = [], []

for arq in arqs_vei:
    por_veic = collections.defaultdict(list)
    datas = collections.Counter()
    with abrir(arq) as f:
        for linha in f:
            if not linha.strip():
                continue
            d = json.loads(linha)
            li = cod2i.get(d["COD_LINHA"])
            if li is None:
                continue
            dia, hora = d["DTHR"].split(" ")
            datas[dia] += 1
            dd, mm, aa = map(int, dia.split("/"))
            h, mi, s = map(int, hora.split(":"))
            t = datetime.date(aa, mm, dd).toordinal() * 86400 + h * 3600 + mi * 60 + s
            por_veic[(d["VEIC"], li)].append((t, float(d["LAT"].replace(",", ".")), float(d["LON"].replace(",", "."))))
    # o nome do arquivo é a data da extração; a data real vem do campo DTHR
    d0, m0, a0 = datas.most_common(1)[0][0].split("/")
    rotulo = f"{a0}-{m0}-{d0}"
    dias.append(rotulo)
    di = len(dias) - 1
    for (v, li), pts in por_veic.items():
        pts = sorted(set(pts))
        if (v, li) not in veic_idx:
            veic_idx[(v, li)] = len(veic)
            veic.append([v, li, 0])
        vi = veic_idx[(v, li)]
        for a, b in zip(pts, pts[1:]):
            dt = b[0] - a[0]
            if not (DT_MIN <= dt <= DT_MAX):
                continue
            vel = haversine(a[1], a[2], b[1], b[2]) / dt * 3.6
            if vel >= V_MAX:
                stats[li]["descartados"] += 1
                continue
            sod = b[0] % 86400
            hist[li][sod // 3600][int(vel)] += 1
            stats[li]["n"] += 1
            stats[li]["max"] = max(stats[li]["max"], vel)
            veic[vi][2] += 1
            if vel >= V_DETALHE:
                detalhe.append([li, vi, di, sod, round(vel * 10), round(b[1] * 1e5), round(b[2] * 1e5)])
    print(rotulo, "ok")

for s in stats:
    s["max"] = round(s["max"], 1)

dados = {
    "grupos": [{"nome": c.title()} for c in categorias],
    "dias": dias,
    "linhas": [{"cod": l["COD"], "nome": " ".join(l["NOME"].title().split()), "g": l["g"]} for l in linhas],
    "hist": hist, "stats": stats, "veic": veic, "detalhe": detalhe,
    "params": {"dtMin": DT_MIN, "dtMax": DT_MAX, "vMax": V_MAX, "vDetalhe": V_DETALHE},
}

aqui = os.path.dirname(os.path.abspath(__file__))
modelo = open(os.path.join(aqui, "modelo_ligeirao.html"), encoding="utf-8").read()
saida = os.path.join(aqui, "ligeirao.html")
open(saida, "w", encoding="utf-8").write(modelo.replace("/*__DADOS__*/null", json.dumps(dados, ensure_ascii=False, separators=(",", ":"))))
print("Gerado", saida, "-", len(detalhe), "trechos >=", V_DETALHE, "km/h")
