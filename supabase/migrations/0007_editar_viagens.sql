-- Permite que cada usuário corrija apenas os metadados das próprias viagens.
drop policy if exists "dono edita viagens" on public.viagens;
create policy "dono edita viagens" on public.viagens
  for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Pontos GPS, horários e métricas permanecem imutáveis pela página.
grant update (linha, nome_linha, veiculo, obs) on public.viagens to authenticated;
