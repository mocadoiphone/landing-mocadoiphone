-- Invariantes do catálogo (MDI-D022): variante padrão, pré-requisitos mantidos
-- em produto publicado e exclusão de categoria/família com filhos ativos.
-- Fixtures: eeee…01 rascunho (ffff…01) · eeee…02 publicado (ffff…02 visível padrão,
-- ffff…03 HIDDEN, MAIN bbbb…01) · cccc…01 categoria com família e produtos ·
-- cccc…02 categoria inativa só com a família dddd…02.
begin;
\ir _fixtures.psql
select * from no_plan();

-- =============================================================================
-- L1 · Variante padrão
-- =============================================================================
insert into public.products (id, category_id, family_id, name, slug)
values ('eeeeeeee-0000-4000-8000-000000000010', 'cccccccc-0000-4000-8000-000000000001',
        'dddddddd-0000-4000-8000-000000000001', 'Novo', 't-novo');

insert into public.product_variants (id, product_id, storage, color_name, availability)
values ('ffffffff-0000-4000-8000-000000000010', 'eeeeeeee-0000-4000-8000-000000000010', '128 GB', 'Oculta', 'HIDDEN');
select is((select is_default from public.product_variants where id = 'ffffffff-0000-4000-8000-000000000010'), false,
  'primeira variante oculta não vira padrão');

insert into public.product_variants (id, product_id, storage, color_name)
values ('ffffffff-0000-4000-8000-000000000011', 'eeeeeeee-0000-4000-8000-000000000010', '128 GB', 'Preto');
select is((select is_default from public.product_variants where id = 'ffffffff-0000-4000-8000-000000000011'), true,
  'primeira variante visível vira padrão automaticamente');

insert into public.product_variants (id, product_id, storage, color_name)
values ('ffffffff-0000-4000-8000-000000000012', 'eeeeeeee-0000-4000-8000-000000000010', '256 GB', 'Preto');
select is((select is_default from public.product_variants where id = 'ffffffff-0000-4000-8000-000000000012'), false,
  'variantes seguintes não viram padrão');

-- Troca atômica pelo gestor de catálogo.
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';
select lives_ok($$ select public.set_default_variant('ffffffff-0000-4000-8000-000000000012') $$,
  'gestor de catálogo troca a variante padrão');
reset role;
set local request.jwt.claims to '';

select results_eq(
  $$ select id from public.product_variants
     where product_id = 'eeeeeeee-0000-4000-8000-000000000010' and is_default and deleted_at is null $$,
  $$ values ('ffffffff-0000-4000-8000-000000000012'::uuid) $$,
  'depois da troca existe exatamente uma variante padrão'
);
select ok(exists (
    select 1 from public.audit_logs
    where entity_type = 'product_variants' and entity_id = 'ffffffff-0000-4000-8000-000000000012'
      and operation = 'UPDATE' and changed_fields @> '{is_default}'
      and actor_user_id = 'aaaaaaaa-0000-4000-8000-000000000003'
  ), 'troca de padrão é auditada com o autor');

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_like($$ select public.set_default_variant('ffffffff-0000-4000-8000-000000000010') $$,
  '%variante visível%', 'variante oculta não pode ser a padrão');
reset role;
set local request.jwt.claims to '';

-- Sem papel de catálogo: recusado, nada muda.
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok($$ select public.set_default_variant('ffffffff-0000-4000-8000-000000000011') $$,
  '42501', null, 'editor de conteúdo não troca a variante padrão');
reset role;
set local request.jwt.claims to '';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok($$ select public.set_default_variant('ffffffff-0000-4000-8000-000000000003') $$,
  'P0001', null, 'usuário sem perfil não enxerga variante oculta para torná-la padrão');
reset role;
set local request.jwt.claims to '';

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok($$ select public.set_default_variant('ffffffff-0000-4000-8000-000000000002') $$,
  '42501', null, 'anônimo não executa set_default_variant');
reset role;
set local request.jwt.claims to '';

select is((select is_default from public.product_variants where id = 'ffffffff-0000-4000-8000-000000000012'), true,
  'tentativas recusadas não alteram a variante padrão');

-- =============================================================================
-- L2 · Produto publicado mantém variante visível e imagem principal
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_like(
  $$ update public.product_variants set availability = 'HIDDEN' where id = 'ffffffff-0000-4000-8000-000000000002' $$,
  '%ao menos uma variante visível%', 'não oculta a última variante visível de produto publicado');
select throws_like(
  $$ update public.product_variants set deleted_at = now() where id = 'ffffffff-0000-4000-8000-000000000002' $$,
  '%ao menos uma variante visível%', 'não exclui a última variante visível de produto publicado');
select lives_ok(
  $$ update public.product_variants set availability = 'OUT_OF_STOCK' where id = 'ffffffff-0000-4000-8000-000000000002' $$,
  'variante indisponível continua visível: alteração permitida');
select lives_ok(
  $$ update public.product_variants set availability = 'HIDDEN' where id = 'ffffffff-0000-4000-8000-000000000001' $$,
  'rascunho pode ocultar a única variante');

update public.product_variants set availability = 'AVAILABLE' where id = 'ffffffff-0000-4000-8000-000000000003';
select lives_ok(
  $$ update public.product_variants set availability = 'HIDDEN' where id = 'ffffffff-0000-4000-8000-000000000002' $$,
  'com outra variante visível, ocultar é permitido');

select throws_like(
  $$ delete from public.product_media where product_id = 'eeeeeeee-0000-4000-8000-000000000002' and slot = 'MAIN' $$,
  '%imagem principal%', 'não remove a imagem principal de produto publicado');
select throws_like(
  $$ update public.product_media set slot = 'GALLERY' where product_id = 'eeeeeeee-0000-4000-8000-000000000002' and slot = 'MAIN' $$,
  '%imagem principal%', 'não move a imagem principal de produto publicado para a galeria');
select lives_ok(
  $$ update public.product_media set media_asset_id = 'bbbbbbbb-0000-4000-8000-000000000003'
     where product_id = 'eeeeeeee-0000-4000-8000-000000000002' and slot = 'MAIN' $$,
  'trocar o arquivo da imagem principal é permitido');
select lives_ok(
  $$ delete from public.product_media where product_id = 'eeeeeeee-0000-4000-8000-000000000001' and slot = 'MAIN' $$,
  'rascunho pode remover a imagem principal');

reset role;
set local request.jwt.claims to '';

-- Mídia excluída não é vinculada.
insert into public.media_assets (id, storage_path, kind, mime_type, size_bytes, width, height, alt_text)
values ('bbbbbbbb-0000-4000-8000-000000000010', 'products/t/excluida.webp', 'IMAGE', 'image/webp', 2048, 800, 800, 'Excluída');
update public.media_assets set deleted_at = now() where id = 'bbbbbbbb-0000-4000-8000-000000000010';
select throws_like(
  $$ insert into public.product_media (product_id, media_asset_id, slot)
     values ('eeeeeeee-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000010', 'GALLERY') $$,
  '%foi excluída%', 'mídia excluída não pode ser vinculada');

-- Despublicado, o produto volta a aceitar a remoção.
update public.products set status = 'REVIEWED' where id = 'eeeeeeee-0000-4000-8000-000000000002';
select lives_ok(
  $$ delete from public.product_media where product_id = 'eeeeeeee-0000-4000-8000-000000000002' and slot = 'MAIN' $$,
  'produto despublicado pode remover a imagem principal');

-- =============================================================================
-- L3 · Exclusão de categoria e família
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';

select throws_like(
  $$ update public.categories set deleted_at = now() where id = 'cccccccc-0000-4000-8000-000000000001' $$,
  '%categoria tem famílias ou produtos ativos%', 'não exclui categoria com filhos ativos');
select throws_like(
  $$ update public.product_families set deleted_at = now() where id = 'dddddddd-0000-4000-8000-000000000001' $$,
  '%família tem produtos ativos%', 'não exclui família com produtos ativos');
select lives_ok(
  $$ update public.categories set is_active = false where id = 'cccccccc-0000-4000-8000-000000000001' $$,
  'desativar categoria com produtos é permitido');
select lives_ok(
  $$ update public.product_families set deleted_at = now() where id = 'dddddddd-0000-4000-8000-000000000002' $$,
  'família sem produtos pode ser excluída');
select lives_ok(
  $$ update public.categories set deleted_at = now() where id = 'cccccccc-0000-4000-8000-000000000002' $$,
  'categoria sem filhos ativos pode ser excluída');

reset role;
set local request.jwt.claims to '';

select * from finish();
rollback;
