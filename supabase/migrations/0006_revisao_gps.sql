-- Preserva amostras brutas e revisões; vel_ms contém a velocidade validada.
alter table public.viagens add column if not exists amostras_originais jsonb;
alter table public.viagens add column if not exists revisoes_gps jsonb not null default '{}'::jsonb;

create or replace function public.salvar_viagem(p jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'É preciso estar logado para enviar viagens.'; end if;
  if coalesce(p->>'id_local', '') = '' then raise exception 'Viagem sem id_local.'; end if;
  if p->'amostras_colunas' is distinct from '["t_ms","lat","lon","precisao_m","vel_ms","rumo"]'::jsonb then
    raise exception 'Formato de amostras não suportado.';
  end if;

  select id into v_id from viagens where usuario_id = v_uid and id_local = p->>'id_local';
  if found then return v_id; end if;

  with _pts as (select * from public._viagem_pontos_json(p))
  insert into viagens (id_local, linha, nome_linha, veiculo, obs, inicio, fim, fuso_min, n_pontos, duracao_s, distancia_m,
                       vel_media_kmh, vel_max_kmh, vel_p95_kmh, marcas, amostras_originais, revisoes_gps)
  select p->>'id_local', p->>'linha', p->>'nome_linha', p->>'veiculo', p->>'obs',
         to_timestamp((p->>'inicio_ms')::double precision / 1000),
         to_timestamp(coalesce((p->>'fim_ms')::double precision, (p->>'inicio_ms')::double precision) / 1000),
         coalesce((p->>'fuso_min')::smallint, 180),
         (select count(*) from _pts),
         round((coalesce((p->>'fim_ms')::numeric, (p->>'inicio_ms')::numeric) - (p->>'inicio_ms')::numeric) / 1000),
         d.dist, round((d.dist / nullif(extract(epoch from d.t1 - d.t0), 0) * 3.6)::numeric, 1),
         v.vmax, v.vp95, coalesce(p->'marcas', '[]'::jsonb), p->'amostras_originais', coalesce(p->'revisoes','{}'::jsonb)
  from
    -- mesmo critério do resumo no celular: ignora deslocamentos < 2 m e pontos com precisão pior que 30 m
    (select coalesce(sum(dm) filter (where dm >= 2 and pa <= 30 and pb <= 30 and dt > 0 and dm / nullif(dt,0) * 3.6 <= 120), 0)::numeric(9,1) as dist,
            min(t) as t0, max(t) as t1
     from (select t, extract(epoch from t-lag(t) over (order by seq)) as dt, precisao_m as pb, lag(precisao_m) over (order by seq) as pa,
                  2 * 6371000 * asin(sqrt(sin(radians(lat - lag(lat) over (order by seq)) / 2) ^ 2 +
                    cos(radians(lag(lat) over (order by seq))) * cos(radians(lat)) *
                    sin(radians(lon - lag(lon) over (order by seq)) / 2) ^ 2)) as dm
           from _pts) s) d,
    (select round(max(vel_ms * 3.6)::numeric, 1) as vmax,
            round((percentile_disc(0.95) within group (order by vel_ms) * 3.6)::numeric, 1) as vp95
     from _pts where vel_ms between 0 and 120.0/3.6 and (coalesce(precisao_m, 99) <= 50 or (p->'revisoes'->(seq::text)->>'vel_ms') is not null)) v
  returning id into v_id;

  insert into viagem_pontos (viagem_id, seq, t, lat, lon, precisao_m, vel_ms, rumo)
  select v_id, seq, t, lat, lon, precisao_m, vel_ms, rumo from public._viagem_pontos_json(p);

  return v_id;
end;
$$;
revoke execute on function public.salvar_viagem(jsonb) from anon, public;
grant execute on function public.salvar_viagem(jsonb) to authenticated;

