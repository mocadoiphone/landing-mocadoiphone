-- Regras do catálogo: price_from derivado, published_at, pré-requisitos de publicação,
-- autoria forçada pelo banco e proteção de mídia em uso (MDI-D005, D006, D007, D010).
begin;
\ir _fixtures.psql
select * from no_plan();

-- =============================================================================
-- price_from = menor preço à vista entre variantes vendáveis
-- Produto publicado eeee…02: ffff…02 visível R$ 8.999 · ffff…03 HIDDEN R$ 9.999
-- =============================================================================
select is((select price_from from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), 899900,
  'price_from considera só variantes vendáveis (HIDDEN fica fora)');

update public.product_variants set price_cash = 799900 where id = 'ffffffff-0000-4000-8000-000000000003';
select is((select price_from from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), 899900,
  'variante HIDDEN mais barata não altera price_from');

update public.product_variants set availability = 'AVAILABLE' where id = 'ffffffff-0000-4000-8000-000000000003';
select is((select price_from from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), 799900,
  'price_from acompanha mudança de disponibilidade');

update public.product_variants set price_on_request = true where id = 'ffffffff-0000-4000-8000-000000000003';
select is((select price_from from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), 899900,
  'variante "Consulte valores" fica fora do price_from');

update public.product_variants set availability = 'DISCONTINUED' where id = 'ffffffff-0000-4000-8000-000000000002';
select is((select price_from from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), null,
  'sem variante vendável com preço, price_from fica vazio');

update public.product_variants set availability = 'AVAILABLE' where id = 'ffffffff-0000-4000-8000-000000000002';
update public.product_variants set deleted_at = now() where id = 'ffffffff-0000-4000-8000-000000000002';
select is((select price_from from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), null,
  'variante excluída logicamente sai do price_from');

-- price_from e published_at não aceitam valores do cliente.
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
update public.products
set price_from = 1, published_at = '2000-01-01'
where id in ('eeeeeeee-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000003');
reset role;
set local request.jwt.claims to '';

select is((select price_from from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001'), 500000,
  'price_from não aceita valor enviado pelo cliente');
select isnt((select published_at from public.products where id = 'eeeeeeee-0000-4000-8000-000000000003'), '2000-01-01'::timestamptz,
  'published_at não aceita valor enviado pelo cliente');
select is((select published_at from public.products where id = 'eeeeeeee-0000-4000-8000-000000000001'), null,
  'rascunho continua sem published_at');

-- =============================================================================
-- Publicação: pré-requisitos e published_at
-- =============================================================================
select isnt((select published_at from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'), null,
  'publicar preenche published_at');

insert into public.products (id, category_id, family_id, name, slug)
values ('eeeeeeee-0000-4000-8000-000000000010', 'cccccccc-0000-4000-8000-000000000001',
        'dddddddd-0000-4000-8000-000000000001', 'Incompleto', 't-incompleto');

select throws_ok(
  $$ update public.products set status = 'PUBLISHED' where id = 'eeeeeeee-0000-4000-8000-000000000010' $$,
  'P0001', 'Produto não pode ser publicado: cadastre ao menos uma variante visível.',
  'publicar sem variante falha');

insert into public.product_variants (product_id, storage, availability)
values ('eeeeeeee-0000-4000-8000-000000000010', '64 GB', 'HIDDEN');
select throws_ok(
  $$ update public.products set status = 'PUBLISHED' where id = 'eeeeeeee-0000-4000-8000-000000000010' $$,
  'P0001', 'Produto não pode ser publicado: cadastre ao menos uma variante visível.',
  'variante HIDDEN não conta para publicação');

insert into public.product_variants (product_id, storage, availability)
values ('eeeeeeee-0000-4000-8000-000000000010', '128 GB', 'PRE_ORDER');
select throws_ok(
  $$ update public.products set status = 'PUBLISHED' where id = 'eeeeeeee-0000-4000-8000-000000000010' $$,
  'P0001', 'Produto não pode ser publicado: defina a imagem principal.',
  'publicar sem imagem principal falha');

insert into public.product_media (product_id, media_asset_id, slot)
values ('eeeeeeee-0000-4000-8000-000000000010', 'bbbbbbbb-0000-4000-8000-000000000003', 'MAIN');
select lives_ok(
  $$ update public.products set status = 'PUBLISHED' where id = 'eeeeeeee-0000-4000-8000-000000000010' $$,
  'produto com variante visível e imagem principal é publicado');

select throws_ok(
  $$ insert into public.products (category_id, family_id, name, slug, status)
     values ('cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 'Direto', 't-direto', 'PUBLISHED') $$,
  'P0001', 'Produto não pode ser publicado: cadastre ao menos uma variante visível.',
  'produto não nasce publicado');

-- Categoria inativa bloqueia publicação.
insert into public.products (id, category_id, family_id, name, slug)
values ('eeeeeeee-0000-4000-8000-000000000011', 'cccccccc-0000-4000-8000-000000000002',
        'dddddddd-0000-4000-8000-000000000002', 'Em categoria inativa', 't-cat-inativa');
insert into public.product_variants (product_id, storage, availability)
values ('eeeeeeee-0000-4000-8000-000000000011', '128 GB', 'AVAILABLE');
insert into public.product_media (product_id, media_asset_id, slot)
values ('eeeeeeee-0000-4000-8000-000000000011', 'bbbbbbbb-0000-4000-8000-000000000003', 'MAIN');
select throws_ok(
  $$ update public.products set status = 'PUBLISHED' where id = 'eeeeeeee-0000-4000-8000-000000000011' $$,
  'P0001', 'Produto não pode ser publicado: a categoria está inativa ou excluída.',
  'publicar em categoria inativa falha');

-- Desativar a categoria tira os produtos do ar sem alterar o status deles.
update public.categories set is_active = false where id = 'cccccccc-0000-4000-8000-000000000001';
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select ok(not exists (select 1 from public.products where id = 'eeeeeeee-0000-4000-8000-000000000002'),
  'produto de categoria desativada some do público');
reset role;
set local request.jwt.claims to '';
update public.categories set is_active = true where id = 'cccccccc-0000-4000-8000-000000000001';

-- =============================================================================
-- Autoria definida pelo banco
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
insert into public.categories (id, name, slug, created_by, updated_by)
values ('cccccccc-0000-4000-8000-000000000010', 'Autoria', 't-autoria',
        'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001');
update public.categories set deleted_at = now(), deleted_by = 'aaaaaaaa-0000-4000-8000-000000000001'
where id = 'cccccccc-0000-4000-8000-000000000010';
reset role;
set local request.jwt.claims to '';

select is((select created_by from public.categories where id = 'cccccccc-0000-4000-8000-000000000010'),
  'aaaaaaaa-0000-4000-8000-000000000002'::uuid, 'created_by vem da sessão (não pode ser forjado)');
select is((select deleted_by from public.categories where id = 'cccccccc-0000-4000-8000-000000000010'),
  'aaaaaaaa-0000-4000-8000-000000000002'::uuid, 'deleted_by vem da sessão (não pode ser forjado)');

-- =============================================================================
-- Mídia em uso não pode ser excluída
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ update public.media_assets set deleted_at = now() where id = 'bbbbbbbb-0000-4000-8000-000000000002' $$,
  'P0001', 'Esta mídia está em uso e não pode ser excluída.',
  'mídia em uso não pode ser excluída');
insert into public.media_assets (id, storage_path, kind, mime_type, size_bytes, width, height, alt_text)
values ('bbbbbbbb-0000-4000-8000-000000000009', 'seo/t/livre.webp', 'IMAGE', 'image/webp', 10, 10, 10, 'Livre');
select lives_ok(
  $$ update public.media_assets set deleted_at = now() where id = 'bbbbbbbb-0000-4000-8000-000000000009' $$,
  'mídia sem uso pode ser excluída logicamente');
select throws_ok(
  $$ delete from public.media_assets where id = 'bbbbbbbb-0000-4000-8000-000000000009' $$,
  '42501', null, 'exclusão física de mídia não é permitida');
reset role;
set local request.jwt.claims to '';

select * from finish();
rollback;
