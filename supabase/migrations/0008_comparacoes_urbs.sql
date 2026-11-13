-- Fila e resultados privados da comparação entre uma viagem do celular e a URBS.
-- As séries guardam somente tempo relativo e velocidade; coordenadas não são copiadas.
create table if not exists public.comparacoes_urbs (
  viagem_id uuid primary key references public.viagens(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'processando', 'concluida', 'indisponivel', 'erro')),
  solicitada_em timestamptz not null default now(),
  processada_em timestamptz,
  veiculo_urbs text,
  distancia_mediana_m numeric(8,1),
  motivo text,
  resumo jsonb,
  serie_celular jsonb,
  serie_urbs jsonb
);
create index if not exists comparacoes_urbs_pendentes_idx on public.comparacoes_urbs (status, solicitada_em)
  where status = 'pendente';

alter table public.comparacoes_urbs enable row level security;
drop policy if exists "dono le comparacoes urbs" on public.comparacoes_urbs;
create policy "dono le comparacoes urbs" on public.comparacoes_urbs for select to authenticated
  using (usuario_id = (select auth.uid()));

-- A RPC confere a propriedade da viagem antes de enfileirar ou reprocessar.
create or replace function public.solicitar_comparacao_urbs(p_viagem_id uuid)
returns public.comparacoes_urbs language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_resultado public.comparacoes_urbs;
begin
  if v_uid is null then raise exception 'É preciso estar logado para comparar uma viagem.'; end if;
  if not exists (select 1 from viagens where id = p_viagem_id and usuario_id = v_uid) then
    raise exception 'Viagem não encontrada.';
  end if;

  insert into comparacoes_urbs (viagem_id, usuario_id, status, solicitada_em, processada_em,
                                veiculo_urbs, distancia_mediana_m, motivo, resumo, serie_celular, serie_urbs)
  values (p_viagem_id, v_uid, 'pendente', now(), null, null, null, null, null, null, null)
  on conflict (viagem_id) do update set
    status = 'pendente', solicitada_em = now(), processada_em = null,
    veiculo_urbs = null, distancia_mediana_m = null, motivo = null,
    resumo = null, serie_celular = null, serie_urbs = null
  where comparacoes_urbs.usuario_id = v_uid
  returning * into v_resultado;
  return v_resultado;
end;
$$;
revoke all on public.comparacoes_urbs from anon, authenticated;
revoke execute on function public.solicitar_comparacao_urbs(uuid) from anon, public;
grant select on public.comparacoes_urbs to authenticated;
grant execute on function public.solicitar_comparacao_urbs(uuid) to authenticated;
