#!/usr/bin/env python3
"""
Baixa dias de dados da URBS do espelho da UFPR (C3SL) para a pasta do projeto.

Exemplos:
    python3 baixar_dias.py --listar                       # só mostra o que existe, sem baixar
    python3 baixar_dias.py --ultimos 7                    # últimos 7 dias disponíveis
    python3 baixar_dias.py --inicio 2026-03-01 --fim 2026-03-31
    python3 baixar_dias.py --inicio 2026-01-01 --fim 2026-11-10 --passo 7   # 1 dia por semana
    python3 baixar_dias.py --ultimos 14 --processar       # baixa e já gera a página

Cada dia de veículos tem ~20 MB. Para o ano inteiro use --passo (amostra) ou baixe em partes.
Só usa a biblioteca padrão do Python. Arquivos já baixados são pulados.

Obs.: a data no nome do arquivo é a da extração; os registros de GPS são do dia anterior
(o processar_ligeirao.py usa a data real que está dentro do arquivo).
"""
import argparse, datetime, html.parser, os, re, subprocess, sys, time, urllib.parse, urllib.request

BASE = "http://dadosabertos.c3sl.ufpr.br/curitibaurbs/"
DATA_RE = re.compile(r"(\d{4})[-_/]?(\d{2})[-_/]?(\d{2})")


class Links(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)


def abrir(url, tentativas=3):
    for i in range(tentativas):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "analise-onibus-curitiba"}), timeout=60)
        except Exception as e:
            if i == tentativas - 1:
                raise
            time.sleep(2 * (i + 1))


def data_do_caminho(caminho):
    """Data AAAA_MM_DD do nome do arquivo (ou, se não houver, do caminho todo)."""
    for texto in (caminho.rsplit("/", 1)[-1], caminho):
        m = DATA_RE.search(texto)
        if m:
            try:
                return datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            except ValueError:
                pass
    return None


def pasta_fora_do_periodo(caminho, ini, fim):
    """Poda pastas por ano (AAAA) ou ano/mês (AAAA/MM, AAAA-MM) claramente fora do período."""
    partes = [p for p in caminho.strip("/").split("/") if p]
    nums = [p for p in partes if re.fullmatch(r"\d{4}|\d{2}|\d{4}[-_]\d{2}", p)]
    if not nums:
        return False
    ano = mes = None
    for p in nums:
        if re.fullmatch(r"\d{4}[-_]\d{2}", p):
            ano, mes = int(p[:4]), int(p[5:])
        elif re.fullmatch(r"\d{4}", p):
            ano = int(p)
        elif ano is not None and mes is None and 1 <= int(p) <= 12:
            mes = int(p)
    if ano is None:
        return False
    if ano < ini.year or ano > fim.year:
        return True
    if mes is not None:
        ini_m, fim_m = (ini.year, ini.month), (fim.year, fim.month)
        if (ano, mes) < ini_m or (ano, mes) > fim_m:
            return True
    return False


def listar(base, ini, fim, prof_max=3):
    """Percorre a listagem (índice Apache/nginx) e devolve {(data, tipo): url}."""
    achados, visitados = {}, set()

    def varrer(url, prof):
        if url in visitados or prof > prof_max:
            return
        visitados.add(url)
        rel = urllib.parse.urlparse(url).path[len(urllib.parse.urlparse(base).path):]
        if pasta_fora_do_periodo(rel, ini, fim):
            return
        try:
            p = Links()
            p.feed(abrir(url).read().decode("utf-8", "replace"))
        except Exception as e:
            print("  aviso: não consegui abrir", url, "-", e)
            return
        for href in p.links:
            if href.startswith(("?", "#", "/")) or href.startswith("..") or ":" in href.split("/")[0]:
                continue
            alvo = urllib.parse.urljoin(url, href)
            if not alvo.startswith(base):
                continue
            if href.endswith("/"):
                varrer(alvo, prof + 1)
            elif href.endswith(".json.xz"):
                nome = urllib.parse.unquote(href).lower()
                tipo = "veiculos" if "veiculos" in nome else "linhas" if "linhas" in nome and "pontos" not in nome else None
                d = data_do_caminho(urllib.parse.unquote(alvo[len(base):]))
                if tipo and d and ini <= d <= fim:
                    achados[(d, tipo)] = alvo

    varrer(base, 0)
    return achados


def baixar(url, destino):
    if os.path.exists(destino):
        return "já existe"
    tmp = destino + ".part"
    with abrir(url) as r, open(tmp, "wb") as f:
        total = int(r.headers.get("Content-Length") or 0)
        lido = 0
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            f.write(bloco)
            lido += len(bloco)
            if total:
                print("\r    %d / %d MB" % (lido >> 20, total >> 20), end="", flush=True)
    os.replace(tmp, destino)
    print("\r" + " " * 30 + "\r", end="")
    return "baixado (%.1f MB)" % (os.path.getsize(destino) / 1e6)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--inicio", help="AAAA-MM-DD")
    ap.add_argument("--fim", help="AAAA-MM-DD (padrão: hoje)")
    ap.add_argument("--ultimos", type=int, help="últimos N dias disponíveis (ignora --inicio)")
    ap.add_argument("--passo", type=int, default=1, help="pega 1 dia a cada N dias (amostra). Padrão: todos")
    ap.add_argument("--destino", default=".", help="pasta de destino (padrão: atual)")
    ap.add_argument("--base", default=BASE, help="URL do espelho")
    ap.add_argument("--listar", action="store_true", help="só lista os dias encontrados, sem baixar")
    ap.add_argument("--processar", action="store_true", help="ao final, roda processar_ligeirao.py na pasta de destino")
    a = ap.parse_args()

    base = a.base if a.base.endswith("/") else a.base + "/"
    fim = datetime.date.fromisoformat(a.fim) if a.fim else datetime.date.today()
    if a.ultimos:
        ini = fim - datetime.timedelta(days=a.ultimos * 2 + 10)  # folga: pode haver dias faltando
    elif a.inicio:
        ini = datetime.date.fromisoformat(a.inicio)
    else:
        ap.error("informe --inicio ou --ultimos")

    print("Procurando em", base, "de", ini, "a", fim, "...")
    achados = listar(base, ini, fim)
    dias = sorted({d for d, t in achados if t == "veiculos"})
    if not dias:
        sys.exit("Nenhum arquivo de veículos encontrado. Rode com --listar e confira a URL (--base).")
    if a.ultimos:
        dias = dias[-a.ultimos:]
    dias = dias[:: max(1, a.passo)]
    print("Dias encontrados:", len(dias), "(%s a %s)" % (dias[0], dias[-1]))
    if a.listar:
        for d in dias:
            print(" ", d, [t for t in ("veiculos", "linhas") if (d, t) in achados])
        return

    os.makedirs(a.destino, exist_ok=True)
    for i, d in enumerate(dias, 1):
        for tipo in ("veiculos", "linhas"):
            url = achados.get((d, tipo))
            if not url:
                continue
            nome = "%s_%s.json.xz" % (d.strftime("%Y_%m_%d"), tipo)
            print("[%d/%d] %s" % (i, len(dias), nome), end=" ... ", flush=True)
            try:
                print(baixar(url, os.path.join(a.destino, nome)))
            except Exception as e:
                print("ERRO:", e)

    if a.processar:
        script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "processar_ligeirao.py")
        subprocess.run([sys.executable, script, a.destino], check=True)


if __name__ == "__main__":
    main()
