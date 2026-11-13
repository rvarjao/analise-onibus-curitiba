-- Posições completas da URBS, destinadas exclusivamente à reprodução de trajetos.
create table if not exists public.posicoes_navegacao (
  dia date not null,
  cod_linha text not null,
  veiculo text not null,
  dthr timestamp not null,
  lat numeric(8,6) not null,
  lon numeric(9,6) not null,
  primary key (dia, cod_linha, veiculo, dthr)
);
create index if not exists posicoes_navegacao_rota_idx
  on public.posicoes_navegacao (dia, cod_linha, veiculo, dthr);
alter table public.posicoes_navegacao enable row level security;
drop policy if exists "leitura publica de posicoes para navegacao" on public.posicoes_navegacao;
create policy "leitura publica de posicoes para navegacao" on public.posicoes_navegacao for select to anon, authenticated using (true);
grant select on public.posicoes_navegacao to anon, authenticated;

create or replace function public.navegacao_urbs(p_dia date, p_linha text, p_veiculo text)
returns jsonb language sql stable security invoker set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(extract(epoch from dthr), lat, lon) order by dthr), '[]'::jsonb)
  from posicoes_navegacao where dia = p_dia and cod_linha = p_linha and veiculo = p_veiculo;
$$;
grant execute on function public.navegacao_urbs(date, text, text) to anon, authenticated;
