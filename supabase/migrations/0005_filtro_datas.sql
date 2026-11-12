-- Filtro de período para o painel público. As datas retornadas vêm sempre das tabelas publicadas.
create or replace function public.painel_dados(p_inicio date default null, p_fim date default null)
returns jsonb language sql stable security invoker set search_path = public as $$
with grupos as (select array['LIGEIRÃO','EXPRESSO']::text[] nomes),
ls as (
  select l.cod,l.nome,l.categoria,array_position(g.nomes,l.categoria)-1 g,row_number() over(order by l.cod)-1 idx
  from linhas l cross join grupos g where l.categoria = any(g.nomes)
),
ds_disponiveis as (select array_agg(dia order by dia) v from (select distinct dia from metricas_linha_hora) x),
ds as (
  select array_agg(dia order by dia) v from (
    select distinct dia from metricas_linha_hora
    where dia >= coalesce(p_inicio, '-infinity'::date) and dia <= coalesce(p_fim, 'infinity'::date)
  ) x
),
hbin as (
  select ls.idx,h,bin,coalesce(sum((m.histograma->>bin)::bigint),0) n
  from ls cross join generate_series(0,23) h cross join generate_series(0,89) bin
  left join metricas_linha_hora m on m.cod_linha=ls.cod and m.hora=h
    and m.dia = any(coalesce((select v from ds),'{}'::date[]))
  group by ls.idx,h,bin
),
hist as (select idx,jsonb_agg(hv order by h) v from (select idx,h,jsonb_agg(n order by bin) hv from hbin group by idx,h) x group by idx),
stats as (
  select ls.idx,sum(m.trechos) n,max(m.velocidade_max) mx,sum(m.descartados) d
  from ls left join metricas_linha_hora m on m.cod_linha=ls.cod and m.dia = any(coalesce((select v from ds),'{}'::date[])) group by ls.idx
),
veic_raw as (
  select v.veiculo,ls.idx,sum(v.trechos) n from veiculos_resumo v join ls on ls.cod=v.cod_linha
  where v.dia = any(coalesce((select v from ds),'{}'::date[])) group by 1,2
),
veic as (select *,row_number() over(order by idx,veiculo)-1 vi from veic_raw),
det_base as materialized (
  select * from trechos_publicos where dia = any(coalesce((select v from ds),'{}'::date[])) order by velocidade_kmh desc limit 4000
),
det as (
  select t.*,ls.idx,array_position((select v from ds),t.dia)-1 di,v.vi
  from det_base t join ls on ls.cod=t.cod_linha join veic v on v.veiculo=t.veiculo and v.idx=ls.idx
)
select jsonb_build_object(
  'grupos',(select jsonb_agg(jsonb_build_object('nome',initcap(x))) from unnest((select nomes from grupos)) x),
  'linhas',(select jsonb_agg(jsonb_build_object('cod',cod,'nome',initcap(nome),'g',g) order by idx) from ls),
  'dias',(select coalesce(to_jsonb(v),'[]'::jsonb) from ds),
  'diasDisponiveis',(select coalesce(to_jsonb(v),'[]'::jsonb) from ds_disponiveis),
  'hist',(select jsonb_agg(v order by idx) from hist),
  'stats',(select jsonb_agg(jsonb_build_object('n',coalesce(n,0),'max',coalesce(mx,0),'descartados',coalesce(d,0)) order by idx) from stats),
  'veic',(select coalesce(jsonb_agg(jsonb_build_array(veiculo,idx,n) order by vi),'[]'::jsonb) from veic),
  'detalhe',(select coalesce(jsonb_agg(jsonb_build_array(idx,vi,di,extract(epoch from dthr::time)::integer,round(velocidade_kmh*10),round(lat*100000),round(lon*100000))),'[]'::jsonb) from det),
  'params',jsonb_build_object('dtMin',3,'dtMax',40,'vMax',90,'vDetalhe',40)
);
$$;
grant execute on function public.painel_dados(date, date) to anon;

-- Mantém o mapa de calor no mesmo intervalo escolhido no painel.
create or replace function public.mapa_calor(p_limite numeric default 50, p_categorias text[] default array['LIGEIRÃO','EXPRESSO']::text[], p_inicio date default null, p_fim date default null)
returns table(lat double precision, lon double precision, velocidade_max numeric, trechos bigint)
language sql stable security invoker set search_path = public as $$
  select round(t.lat::numeric, 3)::double precision as lat,
         round(t.lon::numeric, 3)::double precision as lon,
         max(t.velocidade_kmh) as velocidade_max,
         count(*) as trechos
  from trechos_publicos t join linhas l on l.cod = t.cod_linha
  where t.velocidade_kmh >= greatest(p_limite, 40)
    and l.categoria = any(p_categorias)
    and t.dia >= coalesce(p_inicio, '-infinity'::date)
    and t.dia <= coalesce(p_fim, 'infinity'::date)
  group by 1, 2 order by trechos desc limit 10000;
$$;
grant execute on function public.mapa_calor(numeric, text[], date, date) to anon;
