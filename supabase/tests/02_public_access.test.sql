-- RLS de leitura e escrita para quem NÃO administra: anônimo, autenticado sem perfil e admin inativo.
-- IDs: cccc…01/02 categoria ativa/inativa · dddd…01/02 família de cat. ativa/inativa
--      eeee…01 rascunho · eeee…02 publicado · eeee…03 publicado e excluído
--      ffff…01 variante do rascunho · ffff…02 visível do publicado · ffff…03 HIDDEN do publicado
--      bbbb…01 mídia do publicado · bbbb…02 mídia do rascunho · bbbb…03 mídia sem uso
--      9999…01/02 bloco ativo/inativo · 8888…01/02 contato ativo/inativo
begin;
\ir _fixtures.psql
select * from no_plan();

-- =============================================================================
-- Anônimo
-- =============================================================================
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select ok(exists (select 1 from public.categories where id = 'cccccccc-0000-4000-8000-000000000001'), 'anônimo lê categoria ativa');
select ok(not exists (select 1 from public.categories where id = 'cccccccc-0000-4000-8000-000000000002'), 'anônimo não lê categoria inativa');
select ok(exists (select 1 from public.product_families where id = 'dddddddd-0000-4000-8000-000000000001'), 'anônimo lê família de categoria ativa');
select ok(not exists (select 1 from public.product_families where id = 'dddddddd-0000-4000-8000-000000000002'), 'anônimo não lê família de categoria inativa');
select ok(exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), 'anônimo lê produto publicado');
select ok(not exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001'), 'anônimo não lê rascunho');
select ok(not exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000003'), 'anônimo não lê produto excluído logicamente');
select ok(exists (select 1 from public.product_variants where id = 'ffffffff-0000-4000-8000-000000000002'), 'anônimo lê variante visível de produto publicado');
select ok(not exists (select 1 from public.product_variants where id = 'ffffffff-0000-4000-8000-000000000003'), 'anônimo não lê variante HIDDEN');
select ok(not exists (select 1 from public.product_variants where id = 'ffffffff-0000-4000-8000-000000000001'), 'anônimo não lê variante de rascunho');
select ok(exists (select 1 from public.product_specs where product_id = 'eeeeeeee-0000-4000-8000-000000000002'), 'anônimo lê especificações de produto publicado');
select ok(not exists (select 1 from public.product_specs where product_id = 'eeeeeeee-0000-4000-8000-000000000001'), 'anônimo não lê especificações de rascunho');
select ok(exists (select 1 from public.product_media where product_id = 'eeeeeeee-0000-4000-8000-000000000002'), 'anônimo lê vínculo de mídia de produto publicado');
select ok(not exists (select 1 from public.product_media where product_id = 'eeeeeeee-0000-4000-8000-000000000001'), 'anônimo não lê vínculo de mídia de rascunho');
select ok(exists (select 1 from public.media_assets where id = 'bbbbbbbb-0000-4000-8000-000000000001'), 'anônimo lê mídia usada por produto publicado');
select ok(not exists (select 1 from public.media_assets where id = 'bbbbbbbb-0000-4000-8000-000000000002'), 'anônimo não lê mídia de rascunho');
select ok(not exists (select 1 from public.media_assets where id = 'bbbbbbbb-0000-4000-8000-000000000003'), 'anônimo não lê mídia sem uso');
select ok(exists (select 1 from public.homepage_sections where id = '99999999-0000-4000-8000-000000000001'), 'anônimo lê bloco ativo da Home');
select ok(not exists (select 1 from public.homepage_sections where id = '99999999-0000-4000-8000-000000000002'), 'anônimo não lê bloco inativo');
select ok(exists (select 1 from public.contacts where id = '88888888-0000-4000-8000-000000000001'), 'anônimo lê contato ativo');
select ok(not exists (select 1 from public.contacts where id = '88888888-0000-4000-8000-000000000002'), 'anônimo não lê contato inativo');
select ok(exists (select 1 from public.site_settings where key = 'seo'), 'anônimo lê configuração pública');
select ok(not exists (select 1 from public.site_settings where key = 'media'), 'anônimo não lê configuração privada');
select throws_ok($$ select 1 from public.admin_profiles $$, '42501', null, 'anônimo não acessa perfis administrativos');
select throws_ok($$ select 1 from public.audit_logs $$, '42501', null, 'anônimo não acessa auditoria');

select throws_ok(
  $$ insert into public.categories (name, slug) values ('Invasora', 't-invasora') $$,
  '42501', null, 'anônimo não cria categoria');
select throws_ok(
  $$ update public.products set name = 'Alterado' where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  '42501', null, 'anônimo não edita produto');
select throws_ok(
  $$ update public.product_variants set price_cash = 1 where id = 'ffffffff-0000-4000-8000-000000000002' $$,
  '42501', null, 'anônimo não altera preço');
select throws_ok(
  $$ delete from public.homepage_sections where id = '99999999-0000-4000-8000-000000000001' $$,
  '42501', null, 'anônimo não exclui bloco da Home');
select throws_ok(
  $$ insert into public.site_settings (key, value_json) values ('footer', '{}') $$,
  '42501', null, 'anônimo não cria configuração');
select throws_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
     values ('home/invasao.webp', 'IMAGE', 'image/webp', 10, 10, 10, 'Invasão') $$,
  '42501', null, 'anônimo não cadastra mídia');

reset role;
set local request.jwt.claims to '';

-- =============================================================================
-- Autenticado sem perfil administrativo
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000005", "role": "authenticated"}';

select ok(exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), 'autenticado sem perfil lê produto publicado');
select ok(not exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001'), 'autenticado sem perfil não lê rascunho');
select ok(not exists (select 1 from public.site_settings where key = 'media'), 'autenticado sem perfil não lê configuração privada');
select is((select count(*)::int from public.admin_profiles), 0, 'autenticado sem perfil não vê perfis administrativos');
select is((select count(*)::int from public.audit_logs), 0, 'autenticado sem perfil não vê auditoria');

select throws_ok(
  $$ insert into public.categories (name, slug) values ('Invasora', 't-invasora') $$,
  '42501', null, 'autenticado sem perfil não cria categoria');
select results_eq(
  $$ with u as (update public.products set name = 'Alterado'
       where id = 'eeeeeeee-0000-4000-8000-000000000002' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'autenticado sem perfil não edita produto (0 linhas afetadas)');
select results_eq(
  $$ with d as (delete from public.homepage_sections
       where id = '99999999-0000-4000-8000-000000000001' returning 1)
     select count(*)::int from d $$,
  $$ values (0) $$,
  'autenticado sem perfil não exclui bloco da Home');
select throws_ok(
  $$ insert into public.admin_profiles (user_id, display_name, role)
     values ('aaaaaaaa-0000-4000-8000-000000000005', 'Eu mesmo', 'OWNER') $$,
  '42501', null, 'autenticado sem perfil não se promove a OWNER');
select throws_ok(
  $$ insert into public.audit_logs (source, entity_type, entity_id, operation)
     values ('admin', 'products', 'x', 'INSERT') $$,
  '42501', null, 'autenticado sem perfil não escreve na auditoria');

reset role;
set local request.jwt.claims to '';

-- =============================================================================
-- Admin com perfil inativo
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000006", "role": "authenticated"}';

select ok(not exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001'), 'admin inativo não lê rascunho');
select throws_ok(
  $$ insert into public.categories (name, slug) values ('Invasora', 't-invasora') $$,
  '42501', null, 'admin inativo não cria categoria');
select is(
  (select array_agg(user_id)::text from public.admin_profiles),
  '{aaaaaaaa-0000-4000-8000-000000000006}',
  'admin inativo vê apenas o próprio perfil (para o app saber que está inativo)');

reset role;
set local request.jwt.claims to '';

select * from finish();
rollback;
