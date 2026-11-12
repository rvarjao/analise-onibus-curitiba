-- Aplicar após 0001 em projetos que já receberam a primeira migration.
create index if not exists trechos_publicos_velocidade_idx on public.trechos_publicos (velocidade_kmh desc)
  include (dia, cod_linha, veiculo, dthr, lat, lon);

create or replace function public.painel_dados()
returns jsonb language sql stable security invoker set search_path = public as $$
with grupos as (select array['LIGEIRÃO','EXPRESSO']::text[] nomes), ls as (
 select l.cod,l.nome,l.categoria,array_position(g.nomes,l.categoria)-1 g,row_number() over(order by l.cod)-1 idx
 from linhas l cross join grupos g where l.categoria = any(g.nomes)
), ds as (select array_agg(dia order by dia) v from (select distinct dia from metricas_linha_hora) x),
hbin as (select ls.idx,h,bin,coalesce(sum((m.histograma->>bin)::bigint),0) n from ls cross join generate_series(0,23) h cross join generate_series(0,89) bin left join metricas_linha_hora m on m.cod_linha=ls.cod and m.hora=h group by ls.idx,h,bin),
hist as (select idx,jsonb_agg(hv order by h) v from (select idx,h,jsonb_agg(n order by bin) hv from hbin group by idx,h) x group by idx),
stats as (select ls.idx,sum(m.trechos) n,max(m.velocidade_max) mx,sum(m.descartados) d from ls left join metricas_linha_hora m on m.cod_linha=ls.cod group by ls.idx),
veic_raw as (select v.veiculo,ls.idx,sum(v.trechos) n from veiculos_resumo v join ls on ls.cod=v.cod_linha group by 1,2),
veic as (select *,row_number() over(order by idx,veiculo)-1 vi from veic_raw),
det_base as materialized (select * from trechos_publicos order by velocidade_kmh desc limit 4000),
det as (select t.*,ls.idx,array_position((select v from ds),t.dia)-1 di,v.vi from det_base t join ls on ls.cod=t.cod_linha join veic v on v.veiculo=t.veiculo and v.idx=ls.idx)
select jsonb_build_object('grupos',(select jsonb_agg(jsonb_build_object('nome',initcap(x))) from unnest((select nomes from grupos)) x),'linhas',(select jsonb_agg(jsonb_build_object('cod',cod,'nome',initcap(nome),'g',g) order by idx) from ls),'dias',(select coalesce(to_jsonb(v),'[]'::jsonb) from ds),'hist',(select jsonb_agg(v order by idx) from hist),'stats',(select jsonb_agg(jsonb_build_object('n',coalesce(n,0),'max',coalesce(mx,0),'descartados',coalesce(d,0)) order by idx) from stats),'veic',(select coalesce(jsonb_agg(jsonb_build_array(veiculo,idx,n) order by vi),'[]'::jsonb) from veic),'detalhe',(select coalesce(jsonb_agg(jsonb_build_array(idx,vi,di,extract(epoch from dthr::time)::integer,round(velocidade_kmh*10),round(lat*100000),round(lon*100000))),'[]'::jsonb) from det),'params',jsonb_build_object('dtMin',3,'dtMax',40,'vMax',90,'vDetalhe',40));
$$;
