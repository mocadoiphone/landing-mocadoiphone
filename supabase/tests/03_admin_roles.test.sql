-- Permissões por papel administrativo (Brain §23; MDI-D008).
-- Usuários: aaaa…01 OWNER · …02 ADMIN · …03 CATALOG_MANAGER · …04 CONTENT_EDITOR · …05 sem perfil
begin;
\ir _fixtures.psql
select * from no_plan();

-- =============================================================================
-- ADMIN: opera catálogo, mídia, Home, contatos e configurações
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';

select ok(exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001'), 'ADMIN lê rascunho');
select ok(exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000003'), 'ADMIN lê produto excluído (para restaurar)');
select lives_ok(
  $$ insert into public.categories (id, name, slug) values ('cccccccc-0000-4000-8000-000000000009', 'Nova', 't-nova') $$,
  'ADMIN cria categoria');
select lives_ok(
  $$ insert into public.products (id, category_id, family_id, name, slug)
     values ('eeeeeeee-0000-4000-8000-000000000009', 'cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 'Novo', 't-novo') $$,
  'ADMIN cria produto');
select lives_ok(
  $$ insert into public.product_variants (product_id, storage, color_name, price_cash, availability)
     values ('eeeeeeee-0000-4000-8000-000000000009', '256 GB', 'Azul', 100000, 'AVAILABLE') $$,
  'ADMIN cria variante');
select lives_ok(
  $$ update public.product_variants set price_cash = 949900 where id = 'ffffffff-0000-4000-8000-000000000002' $$,
  'ADMIN altera preço');
select lives_ok(
  $$ update public.product_variants set availability = 'OUT_OF_STOCK' where id = 'ffffffff-0000-4000-8000-000000000001' $$,
  'ADMIN altera disponibilidade');
select lives_ok(
  $$ update public.products set status = 'DRAFT' where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  'ADMIN despublica produto');
select lives_ok(
  $$ update public.products set status = 'PUBLISHED' where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  'ADMIN publica produto');
select lives_ok(
  $$ update public.products set deleted_at = now() where id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  'ADMIN exclui produto logicamente');
select lives_ok(
  $$ update public.products set deleted_at = null where id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  'ADMIN restaura produto');
select throws_ok(
  $$ delete from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  '42501', null, 'exclusão física de produto não é permitida nem para ADMIN');
select throws_ok(
  $$ delete from public.categories where id = 'cccccccc-0000-4000-8000-000000000009' $$,
  '42501', null, 'exclusão física de categoria não é permitida');
select lives_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
     values ('home/t/hero.webp', 'IMAGE', 'image/webp', 100, 10, 10, 'Hero') $$,
  'ADMIN cadastra mídia');
select lives_ok(
  $$ insert into public.homepage_sections (type, title) values ('CTA', 'Novo bloco') $$,
  'ADMIN gerencia a Home');
select lives_ok(
  $$ update public.contacts set name = 'Contato renomeado' where id = '88888888-0000-4000-8000-000000000001' $$,
  'ADMIN gerencia contatos');
select lives_ok(
  $$ update public.site_settings set value_json = '{"site_name": "Novo"}' where key = 'seo' $$,
  'ADMIN gerencia configurações');
select ok(exists (select 1 from public.site_settings where key = 'media'), 'ADMIN lê configuração privada');
select ok(exists (select 1 from public.audit_logs), 'ADMIN lê auditoria');
select throws_ok(
  $$ insert into public.admin_profiles (user_id, display_name, role)
     values ('aaaaaaaa-0000-4000-8000-000000000005', 'Novo', 'ADMIN') $$,
  '42501', null, 'ADMIN não cria perfis administrativos');
select results_eq(
  $$ with u as (update public.admin_profiles set role = 'OWNER'
       where user_id = 'aaaaaaaa-0000-4000-8000-000000000003' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'ADMIN não altera papéis');

reset role;
set local request.jwt.claims to '';

-- =============================================================================
-- CATALOG_MANAGER: catálogo e mídia; nada de Home, contatos, configurações, auditoria
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';

select lives_ok(
  $$ update public.products set name = 'Renomeado pelo catálogo' where id = 'eeeeeeee-0000-4000-8000-000000000002' $$,
  'CATALOG_MANAGER edita produto');
select lives_ok(
  $$ insert into public.product_specs (product_id, label, value)
     values ('eeeeeeee-0000-4000-8000-000000000002', 'Chip', 'Teste') $$,
  'CATALOG_MANAGER cadastra especificação');
select throws_ok(
  $$ insert into public.homepage_sections (type) values ('CTA') $$,
  '42501', null, 'CATALOG_MANAGER não gerencia a Home');
select results_eq(
  $$ with u as (update public.site_settings set value_json = '{}' where key = 'seo' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'CATALOG_MANAGER não altera configurações');
select results_eq(
  $$ with u as (update public.contacts set name = 'x' where id = '88888888-0000-4000-8000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'CATALOG_MANAGER não altera contatos');
select is((select count(*)::int from public.audit_logs), 0, 'CATALOG_MANAGER não lê auditoria');

reset role;
set local request.jwt.claims to '';

-- =============================================================================
-- CONTENT_EDITOR: Home e mídia; lê o catálogo, mas não altera
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000004", "role": "authenticated"}';

select lives_ok(
  $$ update public.homepage_sections set title = 'Editado' where id = '99999999-0000-4000-8000-000000000001' $$,
  'CONTENT_EDITOR edita bloco da Home');
select lives_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
     values ('banners/t/promo.webp', 'IMAGE', 'image/webp', 100, 10, 10, 'Promoção') $$,
  'CONTENT_EDITOR cadastra mídia');
select ok(exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001'), 'CONTENT_EDITOR lê rascunhos (para montar blocos)');
select throws_ok(
  $$ insert into public.products (category_id, family_id, name, slug)
     values ('cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 'X', 't-x') $$,
  '42501', null, 'CONTENT_EDITOR não cria produto');
select results_eq(
  $$ with u as (update public.product_variants set price_cash = 1
       where id = 'ffffffff-0000-4000-8000-000000000002' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'CONTENT_EDITOR não altera preço');

reset role;
set local request.jwt.claims to '';

-- =============================================================================
-- OWNER: gerencia perfis; travas de integridade
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.admin_profiles (user_id, display_name, role)
     values ('aaaaaaaa-0000-4000-8000-000000000005', 'Promovido', 'ADMIN') $$,
  'OWNER cria perfil administrativo');
select lives_ok(
  $$ update public.admin_profiles set role = 'CATALOG_MANAGER' where user_id = 'aaaaaaaa-0000-4000-8000-000000000002' $$,
  'OWNER altera papel de outro usuário');
select throws_ok(
  $$ update public.admin_profiles set role = 'ADMIN' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '42501', null, 'ninguém altera o próprio papel');
select throws_ok(
  $$ update public.admin_profiles set is_active = false where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  '42501', null, 'ninguém desativa a própria conta');

reset role;
set local request.jwt.claims to '';

-- Último OWNER ativo: deixa só o OWNER de teste e tenta rebaixá-lo (como postgres).
update public.admin_profiles set is_active = false
where role = 'OWNER' and user_id <> 'aaaaaaaa-0000-4000-8000-000000000001';
select throws_ok(
  $$ update public.admin_profiles set role = 'ADMIN' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'P0001', 'É necessário manter ao menos um OWNER ativo.',
  'sempre resta ao menos um OWNER ativo');
select throws_ok(
  $$ delete from public.admin_profiles where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'P0001', 'É necessário manter ao menos um OWNER ativo.',
  'o último OWNER não pode ser removido');

-- Bootstrap do primeiro OWNER.
select throws_ok(
  $$ select app.bootstrap_first_owner('visitante@tests.local') $$,
  'P0001', 'Já existe um OWNER. Gerencie administradores pelo painel.',
  'bootstrap só funciona enquanto não existe OWNER');

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select app.bootstrap_first_owner('visitante@tests.local') $$,
  '42501', null, 'usuário autenticado não executa o bootstrap');
reset role;
set local request.jwt.claims to '';

select * from finish();
rollback;
