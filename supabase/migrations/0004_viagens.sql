-- Viagens gravadas por passageiros no viagem.html. Cada usuário autenticado só vê e altera as próprias viagens.
create table if not exists public.viagens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id_local text not null,                       -- gerado no celular; torna o envio idempotente
  linha text not null, nome_linha text, veiculo text, obs text,
  inicio timestamptz not null, fim timestamptz not null, fuso_min smallint not null,
  n_pontos integer not null, duracao_s integer not null, distancia_m numeric(9,1) not null,
  vel_media_kmh numeric(5,1), vel_max_kmh numeric(5,1), vel_p95_kmh numeric(5,1),
  marcas jsonb not null default '[]'::jsonb,
  enviada_em timestamptz not null default now(),
  unique (usuario_id, id_local)
);
create index if not exists viagens_usuario_inicio_idx on public.viagens (usuario_id, inicio desc);

-- Amostras do GPS do celular, na ordem em que foram gravadas.
create table if not exists public.viagem_pontos (
  viagem_id uuid not null references public.viagens(id) on delete cascade,
  seq integer not null,
  t timestamptz not null,
  lat double precision not null, lon double precision not null,
  precisao_m real, vel_ms real, rumo smallint,
  primary key (viagem_id, seq)
);

-- Trecho = deslocamento entre dois pontos consecutivos (mesmo conceito do painel da URBS).
create or replace view public.viagem_trechos with (security_invoker = true) as
select viagem_id, seq, t_ini, t_fim, dt_s, round(distancia_m::numeric, 1) as distancia_m,
       round((distancia_m / nullif(dt_s, 0) * 3.6)::numeric, 1) as vel_calc_kmh,
       round((vel_gps_ms * 3.6)::numeric, 1) as vel_gps_kmh,
       precisao_m, lat_ini, lon_ini, lat_fim, lon_fim
from (
  select p.viagem_id, p.seq, lag(p.t) over w as t_ini, p.t as t_fim,
         extract(epoch from p.t - lag(p.t) over w) as dt_s,
         2 * 6371000 * asin(sqrt(
           sin(radians(p.lat - lag(p.lat) over w) / 2) ^ 2 +
           cos(radians(lag(p.lat) over w)) * cos(radians(p.lat)) * sin(radians(p.lon - lag(p.lon) over w) / 2) ^ 2
         )) as distancia_m,
         (p.vel_ms + lag(p.vel_ms) over w) / 2 as vel_gps_ms,
         greatest(p.precisao_m, lag(p.precisao_m) over w) as precisao_m,
         lag(p.lat) over w as lat_ini, lag(p.lon) over w as lon_ini, p.lat as lat_fim, p.lon as lon_fim
  from public.viagem_pontos p
  window w as (partition by p.viagem_id order by p.seq)
) x
where t_ini is not null;

alter table public.viagens enable row level security;
alter table public.viagem_pontos enable row level security;
drop policy if exists "dono le viagens" on public.viagens;
drop policy if exists "dono cria viagens" on public.viagens;
drop policy if exists "dono apaga viagens" on public.viagens;
drop policy if exists "dono le pontos" on public.viagem_pontos;
drop policy if exists "dono cria pontos" on public.viagem_pontos;
create policy "dono le viagens" on public.viagens for select to authenticated using (usuario_id = (select auth.uid()));
create policy "dono cria viagens" on public.viagens for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "dono apaga viagens" on public.viagens for delete to authenticated using (usuario_id = (select auth.uid()));
create policy "dono le pontos" on public.viagem_pontos for select to authenticated
  using (exists (select 1 from public.viagens v where v.id = viagem_id and v.usuario_id = (select auth.uid())));
create policy "dono cria pontos" on public.viagem_pontos for insert to authenticated
  with check (exists (select 1 from public.viagens v where v.id = viagem_id and v.usuario_id = (select auth.uid())));
-- Apagar pontos acontece pelo "on delete cascade" da viagem.

revoke all on public.viagens, public.viagem_pontos, public.viagem_trechos from anon;
grant select, insert, delete on public.viagens to authenticated;
grant select, insert on public.viagem_pontos to authenticated;
grant select on public.viagem_trechos to authenticated;

-- Converte o array "amostras" do .json do celular em linhas.
create or replace function public._viagem_pontos_json(p jsonb)
returns table(seq integer, t timestamptz, lat double precision, lon double precision, precisao_m real, vel_ms real, rumo smallint)
language sql immutable set search_path = public as $$
  select (ord - 1)::integer, to_timestamp((a->>0)::double precision / 1000),
         (a->>1)::double precision, (a->>2)::double precision,
         (a->>3)::real, (a->>4)::real, (a->>5)::smallint
  from jsonb_array_elements(p->'amostras') with ordinality as x(a, ord);
$$;
revoke execute on function public._viagem_pontos_json(jsonb) from anon, public;
grant execute on function public._viagem_pontos_json(jsonb) to authenticated;

-- Recebe a viagem no mesmo formato do arquivo .json do viagem.html e grava viagem + pontos numa transação.
-- Reenviar a mesma viagem (mesmo id_local) devolve o id já existente.
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
                       vel_media_kmh, vel_max_kmh, vel_p95_kmh, marcas)
  select p->>'id_local', p->>'linha', p->>'nome_linha', p->>'veiculo', p->>'obs',
         to_timestamp((p->>'inicio_ms')::double precision / 1000),
         to_timestamp(coalesce((p->>'fim_ms')::double precision, (p->>'inicio_ms')::double precision) / 1000),
         coalesce((p->>'fuso_min')::smallint, 180),
         (select count(*) from _pts),
         round((coalesce((p->>'fim_ms')::numeric, (p->>'inicio_ms')::numeric) - (p->>'inicio_ms')::numeric) / 1000),
         d.dist, round((d.dist / nullif(extract(epoch from d.t1 - d.t0), 0) * 3.6)::numeric, 1),
         v.vmax, v.vp95, coalesce(p->'marcas', '[]'::jsonb)
  from
    -- mesmo critério do resumo no celular: ignora deslocamentos < 2 m e pontos com precisão pior que 30 m
    (select coalesce(sum(dm) filter (where dm >= 2 and pa <= 30 and pb <= 30), 0)::numeric(9,1) as dist,
            min(t) as t0, max(t) as t1
     from (select t, precisao_m as pb, lag(precisao_m) over (order by seq) as pa,
                  2 * 6371000 * asin(sqrt(sin(radians(lat - lag(lat) over (order by seq)) / 2) ^ 2 +
                    cos(radians(lag(lat) over (order by seq))) * cos(radians(lat)) *
                    sin(radians(lon - lag(lon) over (order by seq)) / 2) ^ 2)) as dm
           from _pts) s) d,
    (select round(max(vel_ms * 3.6)::numeric, 1) as vmax,
            round((percentile_disc(0.95) within group (order by vel_ms) * 3.6)::numeric, 1) as vp95
     from _pts where vel_ms is not null and coalesce(precisao_m, 99) <= 50) v
  returning id into v_id;

  insert into viagem_pontos (viagem_id, seq, t, lat, lon, precisao_m, vel_ms, rumo)
  select v_id, seq, t, lat, lon, precisao_m, vel_ms, rumo from public._viagem_pontos_json(p);

  return v_id;
end;
$$;
revoke execute on function public.salvar_viagem(jsonb) from anon, public;
grant execute on function public.salvar_viagem(jsonb) to authenticated;

-- Séries para comparar viagens: [segundos desde o início, km/h, lat, lon, precisão m] de cada viagem pedida.
-- Devolve um único jsonb para não esbarrar no limite de linhas da API REST.
create or replace function public.viagens_series(p_ids uuid[])
returns jsonb language sql stable security invoker set search_path = public as $$
  select coalesce(jsonb_object_agg(viagem_id, pts), '{}'::jsonb)
  from (
    select p.viagem_id,
           jsonb_agg(jsonb_build_array(round(extract(epoch from p.t - v.inicio)::numeric, 1),
                                       round((p.vel_ms * 3.6)::numeric, 1), round(p.lat::numeric, 6), round(p.lon::numeric, 6),
                                       round(p.precisao_m::numeric, 1))
                     order by p.seq) as pts
    from viagem_pontos p join viagens v on v.id = p.viagem_id
    where p.viagem_id = any(p_ids)
    group by p.viagem_id
  ) x;
$$;
revoke execute on function public.viagens_series(uuid[]) from anon, public;
grant execute on function public.viagens_series(uuid[]) to authenticated;
