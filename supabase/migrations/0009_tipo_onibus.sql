-- Tipo informado pelo passageiro para a visualização da navegação.
alter table public.viagens add column if not exists tipo_onibus text
  check (tipo_onibus is null or tipo_onibus in ('comum', 'articulado', 'biarticulado'));
grant update (tipo_onibus) on public.viagens to authenticated;
