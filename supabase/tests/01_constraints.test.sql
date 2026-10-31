-- Constraints de integridade: slugs, hierarquia, preço, variantes, mídia, contatos e configurações.
-- IDs: cccc…01 categoria ativa · cccc…02 inativa · dddd…01 família (ativa) · dddd…02 família (inativa)
--      eeee…01 rascunho · eeee…02 publicado · eeee…03 excluído · ffff…01 variante do rascunho
--      bbbb…03 mídia sem uso
begin;
\ir _fixtures.psql
select * from no_plan();

-- Slugs -----------------------------------------------------------------------
select throws_ok(
  $$ insert into public.categories (name, slug) values ('Duplicada', 't-ativa') $$,
  '23505', null, 'slug de categoria duplicado falha');
select throws_ok(
  $$ insert into public.categories (name, slug) values ('Inválido', 'Slug Inválido') $$,
  '23514', null, 'slug fora do formato falha');
select throws_ok(
  $$ insert into public.categories (name, slug) values ('Reservado', 'produto') $$,
  '23514', null, 'slug reservado de rota falha');
select throws_ok(
  $$ insert into public.product_families (category_id, name, slug)
     values ('cccccccc-0000-4000-8000-000000000001', 'Duplicada', 't-familia') $$,
  '23505', null, 'slug de família duplicado na mesma categoria falha');
select is(
  (select count(*)::int from public.product_families where slug = 't-familia'), 2,
  'mesmo slug de família é permitido em categorias diferentes');
select throws_ok(
  $$ insert into public.products (category_id, family_id, name, slug)
     values ('cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 'Duplicado', 't-rascunho') $$,
  '23505', null, 'slug de produto duplicado falha');
select lives_ok(
  $$ insert into public.products (category_id, family_id, name, slug)
     values ('cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 'Reuso', 't-excluido') $$,
  'slug de produto excluído logicamente pode ser reutilizado');

-- Hierarquia ------------------------------------------------------------------
select throws_ok(
  $$ insert into public.products (category_id, family_id, name, slug)
     values ('cccccccc-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000002', 'Incoerente', 't-incoerente') $$,
  '23503', null, 'família de outra categoria é rejeitada');
select throws_ok(
  $$ update public.products set related_product_id = id where id = 'eeeeeeee-0000-4000-8000-000000000001' $$,
  '23514', null, 'produto não pode ser relacionado a si mesmo');

-- Preço -----------------------------------------------------------------------
select throws_ok(
  $$ insert into public.product_variants (product_id, storage, price_cash)
     values ('eeeeeeee-0000-4000-8000-000000000001', '1 TB', -1) $$,
  '23514', null, 'preço negativo falha');
select throws_ok(
  $$ insert into public.product_variants (product_id, storage, price_cash, price_old)
     values ('eeeeeeee-0000-4000-8000-000000000001', '1 TB', 100000, 90000) $$,
  '23514', null, 'preço "de" menor que o preço à vista falha');
select throws_ok(
  $$ insert into public.product_variants (product_id, storage, price_installment)
     values ('eeeeeeee-0000-4000-8000-000000000001', '1 TB', 5000) $$,
  '23514', null, 'parcela sem quantidade de parcelas falha');
select throws_ok(
  $$ insert into public.product_variants (product_id, storage, price_installment, installments)
     values ('eeeeeeee-0000-4000-8000-000000000001', '1 TB', 5000, 48) $$,
  '23514', null, 'mais de 36 parcelas falha');
select lives_ok(
  $$ insert into public.product_variants (product_id, storage, color_name, price_cash, price_old, price_installment, installments)
     values ('eeeeeeee-0000-4000-8000-000000000001', '1 TB', 'Azul', 899900, 999900, 54990, 18) $$,
  'variante com preço, preço "de" e parcelamento válidos é aceita');

-- Variantes -------------------------------------------------------------------
select throws_ok(
  $$ insert into public.product_variants (product_id, storage, color_name, is_default)
     values ('eeeeeeee-0000-4000-8000-000000000001', '2 TB', 'Preto', true) $$,
  '23505', null, 'segunda variante padrão no mesmo produto falha');
select throws_ok(
  $$ insert into public.product_variants (product_id, storage, color_name)
     values ('eeeeeeee-0000-4000-8000-000000000001', '128 GB', 'Preto') $$,
  '23505', null, 'combinação capacidade × cor repetida falha');
select throws_ok(
  $$ insert into public.product_variants (product_id, storage, color_hex)
     values ('eeeeeeee-0000-4000-8000-000000000001', '64 GB', 'preto') $$,
  '23514', null, 'cor hexadecimal inválida falha');
select throws_ok(
  $$ update public.product_variants set product_id = 'eeeeeeee-0000-4000-8000-000000000002'
     where id = 'ffffffff-0000-4000-8000-000000000001' $$,
  'P0001', null, 'variante não pode trocar de produto');

-- Mídia -----------------------------------------------------------------------
select throws_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
     values ('products/t/x.webp', 'IMAGE', 'image/webp', 10, 10, 10, '   ') $$,
  '23514', null, 'alt text vazio falha');
select throws_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
     values ('products/t/x.gif', 'IMAGE', 'image/gif', 10, 10, 10, 'GIF') $$,
  '23514', null, 'tipo de arquivo fora do Brain §20 falha');
select throws_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
     values ('outra-pasta/x.webp', 'IMAGE', 'image/webp', 10, 10, 10, 'Pasta') $$,
  '23514', null, 'pasta fora do Brain §20 falha');
select throws_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, alt_text)
     values ('products/t/sem-dimensao.webp', 'IMAGE', 'image/webp', 10, 'Sem dimensões') $$,
  '23514', null, 'imagem sem largura/altura falha');
select throws_ok(
  $$ insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
     values ('products/t/enorme.webp', 'IMAGE', 'image/webp', 20000000, 10, 10, 'Grande') $$,
  '23514', null, 'imagem acima de 10 MB falha');
select throws_ok(
  $$ insert into public.product_media (product_id, media_asset_id, slot)
     values ('eeeeeeee-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000003', 'MAIN') $$,
  '23505', null, 'segunda imagem principal no mesmo produto falha');
select throws_ok(
  $$ insert into public.product_media (product_id, media_asset_id, slot)
     values ('eeeeeeee-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000003', 'VIDEO') $$,
  'P0001', null, 'slot de vídeo com arquivo de imagem falha');
select throws_ok(
  $$ insert into public.product_media (product_id, variant_id, media_asset_id, slot)
     values ('eeeeeeee-0000-4000-8000-000000000001', 'ffffffff-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000003', 'GALLERY') $$,
  '23503', null, 'mídia não pode apontar para variante de outro produto');

-- Contatos e configurações ----------------------------------------------------
select throws_ok(
  $$ insert into public.contacts (name, whatsapp, is_default) values ('Outro padrão', '5500000000003', true) $$,
  '23505', null, 'segundo contato padrão falha');
select throws_ok(
  $$ insert into public.contacts (name, whatsapp) values ('Formato', '+55 11 9999') $$,
  '23514', null, 'WhatsApp fora do formato falha');
select throws_ok(
  $$ update public.contacts set is_active = false where id = '88888888-0000-4000-8000-000000000001' $$,
  '23514', null, 'contato padrão não pode ser desativado');
select throws_ok(
  $$ insert into public.site_settings (key, value_json) values ('segredo', '{}') $$,
  '23514', null, 'chave de configuração não prevista falha');
select is(
  (select is_public from public.site_settings where key = 'media'), false,
  'configuração media é privada');
select throws_ok(
  $$ update public.site_settings set is_public = true where key = 'media' $$,
  '428C9', null, 'visibilidade de configuração não é editável');

select * from finish();
rollback;
