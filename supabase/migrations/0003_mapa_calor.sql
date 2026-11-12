-- Grade de aproximadamente 100 m para o mapa de calor, calculada no banco.
create or replace function public.mapa_calor(p_limite numeric default 50, p_categorias text[] default array['LIGEIRÃO','EXPRESSO']::text[])
returns table(lat double precision, lon double precision, velocidade_max numeric, trechos bigint)
language sql stable security invoker set search_path = public as $$
  select round(t.lat::numeric, 3)::double precision as lat,
         round(t.lon::numeric, 3)::double precision as lon,
         max(t.velocidade_kmh) as velocidade_max,
         count(*) as trechos
  from trechos_publicos t
  join linhas l on l.cod = t.cod_linha
  where t.velocidade_kmh >= greatest(p_limite, 40)
    and l.categoria = any(p_categorias)
  group by 1, 2
  order by trechos desc
  limit 10000;
$$;
grant execute on function public.mapa_calor(numeric, text[]) to anon;
