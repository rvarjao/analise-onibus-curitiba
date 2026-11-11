# analise-onibus-curitiba

Página que estima a velocidade dos ônibus das canaletas de Curitiba (Ligeirões e Expressos) a partir dos dados abertos de GPS da URBS e mostra quanto tempo passam acima de um limite escolhido.

## Importante

Os dados da URBS **não trazem velocidade nem o limite da via**. A velocidade é **estimada** pela distância entre dois registros de GPS consecutivos do mesmo veículo dividida pelo tempo. Isso indica *suspeita* de excesso, não é medição de radar. O limite é um valor único (padrão 50 km/h) aplicado a todos os trechos.

## Baixar mais dias (espelho da UFPR)

```bash
python3 baixar_dias.py --listar                                   # só lista o que existe
python3 baixar_dias.py --ultimos 7                                # últimos 7 dias
python3 baixar_dias.py --inicio 2026-03-01 --fim 2026-03-31       # um período
python3 baixar_dias.py --inicio 2026-01-01 --passo 7              # amostra: 1 dia por semana
python3 baixar_dias.py --ultimos 14 --processar                   # baixa e já gera a página
```

Cada dia de veículos pesa cerca de 20 MB, então para o ano inteiro use `--passo`. Arquivos já baixados são pulados. O script usa só a biblioteca padrão do Python e lê a listagem de <http://dadosabertos.c3sl.ufpr.br/curitibaurbs/>; se o servidor mudar de endereço ou organização, use `--base` e `--listar` para conferir.

## Como usar

1. Baixe os arquivos diários (com `baixar_dias.py` acima ou à mão) `AAAA_MM_DD_veiculos.json.xz` e `AAAA_MM_DD_linhas.json.xz` do [portal de dados abertos](https://dadosabertos.curitiba.pr.gov.br/conjuntodado/detalhe?chave=ca40f13b-ef61-472b-810f-dd705f85fd2e) (arquivos com mais de 1 ano: [espelho da UFPR](http://dadosabertos.c3sl.ufpr.br/curitibaurbs/)) e coloque na pasta do projeto.
2. Rode:
   ```bash
   python3 processar_ligeirao.py .                      # Ligeirão + Expresso
   python3 processar_ligeirao.py . "LIGEIRÃO"           # só Ligeirão
   ```
3. Abra `ligeirao.html` no navegador (precisa de internet para os gráficos e o mapa).

Todos os dias encontrados na pasta são somados. O script gera `ligeirao.html` a partir de `modelo_ligeirao.html`.

## Grupos

- **Ligeirão**: linhas 250, 500 e 550.
- **Expresso**: categoria da URBS com as linhas biarticuladas das canaletas (ex.: 203 Sta. Cândida / C. Raso), mais reforços e especiais (códigos X). Os dados não distinguem biarticulado de articulado.

## Licença dos dados

Dados abertos da Prefeitura de Curitiba / URBS, licença [Creative Commons Atribuição 4.0](http://creativecommons.org/licenses/by/4.0/deed.pt_BR).
