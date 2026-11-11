# analise-onibus-curitiba

Página que estima a velocidade dos ônibus das canaletas de Curitiba (Ligeirões e Expressos) a partir dos dados abertos de GPS da URBS e mostra quanto tempo passam acima de um limite escolhido.

## Importante

Os dados da URBS **não trazem velocidade nem o limite da via**. A velocidade é **estimada** pela distância entre dois registros de GPS consecutivos do mesmo veículo dividida pelo tempo. Isso indica *suspeita* de excesso, não é medição de radar. O limite é um valor único (padrão 50 km/h) aplicado a todos os trechos.

## Fluxo

```
baixar_dias.py  ->  importar_banco.py  ->  onibus.duckdb  ->  processar_ligeirao.py  ->  ligeirao.html
(espelho UFPR)      (*.json.xz p/ banco)    (todas as linhas)    (consulta e gera a página)
```

Instale a dependência uma vez: `pip install duckdb`.

### 1. Baixar dias (espelho da UFPR)

```bash
python3 baixar_dias.py --listar                                   # só lista o que existe
python3 baixar_dias.py --ultimos 7                                # últimos 7 dias
python3 baixar_dias.py --inicio 2026-03-01 --fim 2026-03-31       # um período
python3 baixar_dias.py --inicio 2026-01-01 --passo 7              # amostra: 1 dia por semana
python3 baixar_dias.py --ultimos 14 --processar                   # baixa, importa e gera a página
```

Cada dia de veículos pesa cerca de 20 MB. Arquivos já baixados são pulados. O script lê a listagem de <http://dadosabertos.c3sl.ufpr.br/curitibaurbs/>; se o servidor mudar, use `--base` e `--listar` para conferir. Os arquivos também podem ser baixados à mão do [portal de dados abertos](https://dadosabertos.curitiba.pr.gov.br/conjuntodado/detalhe?chave=ca40f13b-ef61-472b-810f-dd705f85fd2e) (`AAAA_MM_DD_veiculos.json.xz` e `AAAA_MM_DD_linhas.json.xz`).

### 2. Importar no banco

```bash
python3 importar_banco.py            # importa o que ainda não foi importado para onibus.duckdb
python3 importar_banco.py --resumo   # mostra o que há no banco
```

Guarda **todas as posições de todas as linhas** (cerca de 30 MB por dia no banco). Reimportar um arquivo substitui os registros dele. Tabelas: `posicoes`, `linhas`, `arquivos_importados`; a view `trechos` calcula a velocidade estimada por consulta. Exemplo:

```sql
-- velocidade média e máxima por linha (descartando saltos de GPS)
SELECT cod_linha, count(*) n, round(avg(vel_kmh),1) media, round(max(vel_kmh),1) maxima
FROM trechos WHERE vel_kmh < 90 GROUP BY 1 ORDER BY 3 DESC;
```

O `onibus.duckdb` **não é versionado** (veja `.gitignore`): ele pode chegar a vários GB. Para recriá-lo, baixe os dias de novo e importe.

### 3. Gerar a página

```bash
python3 processar_ligeirao.py                                    # Ligeirão + Expresso, todos os dias do banco
python3 processar_ligeirao.py --categorias "LIGEIRÃO"            # só Ligeirão
python3 processar_ligeirao.py --inicio 2026-03-01 --fim 2026-03-31
```

Abra `ligeirao.html` no navegador (precisa de internet para os gráficos e o mapa).

## Registrar uma viagem e comparar com a URBS

Para medir o quanto a velocidade estimada pela URBS subestima a real (a URBS registra a posição a cada ~10 s), grave uma viagem como passageiro:

1. Abra `viagem.html` no celular **por HTTPS** (o navegador só libera o GPS em páginas seguras; um arquivo solto no celular não funciona). Hospede-a em qualquer serviço estático gratuito (Cloudflare Pages, Netlify, GitHub Pages em repositório público). A página não envia nada: tudo fica no aparelho.
2. Escolha a linha, informe o código do veículo se estiver visível, toque em **Iniciar viagem** e mantenha a tela ligada. **Marcar momento** anota um instante (ex.: uma freada ou aceleração forte).
3. Ao final, **Baixar arquivo** gera `viagem_AAAAMMDD_HHMM_linhaNNN.json`.
4. No dia seguinte (os dados da URBS chegam com 1 dia de atraso), importe o dia no banco e compare:

```bash
python3 comparar_viagem.py viagem_20261112_0815_linha203.json
python3 comparar_viagem.py viagem.json --veiculo BE602 --limite 50
```

O ônibus é identificado pela proximidade entre a sua trilha e as posições da URBS na mesma linha e horário. A saída mostra, trecho a trecho, a velocidade da URBS contra a média e o pico medidos pelo celular, e conta quantos trechos passam do limite em cada método. As viagens contêm a sua localização: `*.json` e `comparacao_*.csv` estão no `.gitignore`.

## Grupos

- **Ligeirão**: linhas 250, 500 e 550.
- **Expresso**: categoria da URBS com as linhas biarticuladas das canaletas (ex.: 203 Sta. Cândida / C. Raso), mais reforços e especiais (códigos X). Os dados não distinguem biarticulado de articulado.

## Dados no repositório

Os `.json.xz` de 10/11/2026 (dia dos dados; extração em 11/11) ficam versionados como exemplo e para reproduzir a página. Arquivos novos baixados são ignorados pelo Git.

## Licença dos dados

Dados abertos da Prefeitura de Curitiba / URBS, licença [Creative Commons Atribuição 4.0](http://creativecommons.org/licenses/by/4.0/deed.pt_BR).
