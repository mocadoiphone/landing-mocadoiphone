-- =============================================================================
-- SEED — SOMENTE DESENVOLVIMENTO LOCAL
-- Executado por `supabase db reset` no banco local. Nunca roda no projeto
-- remoto (`supabase db push` não aplica seed).
-- Sem catálogo real e sem preços: produtos de teste usam "Consulte valores".
--
-- Usuários locais (senha de desenvolvimento, só existem em 127.0.0.1):
--   dono@local.test       / Moca-Dev-2026  → perfil OWNER
--   conteudo@local.test   / Moca-Dev-2026  → perfil CONTENT_EDITOR (testes E2E de papel)
--   visitante@local.test  / Moca-Dev-2026  → autenticado SEM perfil administrativo
-- =============================================================================

select set_config('app.audit_source', 'seed', false);

-- -----------------------------------------------------------------------------
-- Usuários de desenvolvimento (auth.users + identidade de e-mail).
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('Moca-Dev-2026', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', '', '', '', '', ''
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'dono@local.test'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'visitante@local.test'),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'conteudo@local.test')
) as u (id, email);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email in ('dono@local.test', 'visitante@local.test', 'conteudo@local.test');

-- Primeiro OWNER pelo mesmo caminho documentado para o projeto remoto.
select app.bootstrap_first_owner('dono@local.test', 'Dono (desenvolvimento)');

-- Editor de conteúdo: só a biblioteca de mídia nesta etapa (Brain §23).
insert into public.admin_profiles (user_id, display_name, role)
values ('00000000-0000-4000-a000-000000000003', 'Editor de conteúdo (desenvolvimento)', 'CONTENT_EDITOR');

-- -----------------------------------------------------------------------------
-- Categorias do Brain (§6, §7.4).
-- -----------------------------------------------------------------------------
insert into public.categories (name, slug, sort_order, is_active)
values
  ('iPhone', 'iphone', 10, true),
  ('Mac', 'mac', 20, true),
  ('iPad', 'ipad', 30, true),
  ('Apple Watch', 'apple-watch', 40, true),
  ('AirPods', 'airpods', 50, true),
  ('Vision Pro', 'vision-pro', 60, true),
  ('TV e Casa', 'tv-e-casa', 70, true),
  ('Acessórios', 'acessorios', 80, true);

-- -----------------------------------------------------------------------------
-- Produtos de teste (fictícios).
-- -----------------------------------------------------------------------------
insert into public.product_families (category_id, name, slug, sort_order)
select id, 'Família de teste', 'familia-de-teste', 10 from public.categories where slug = 'iphone';

insert into public.products (category_id, family_id, name, slug, short_description, sort_order)
select f.category_id, f.id, p.name, p.slug, p.short_description, p.sort_order
from public.product_families f
cross join (values
  ('Produto de teste', 'produto-de-teste', 'Produto fictício em rascunho.', 10),
  ('Produto de teste publicado', 'produto-de-teste-publicado', 'Produto fictício publicado.', 20)
) as p (name, slug, short_description, sort_order)
where f.slug = 'familia-de-teste';

insert into public.product_variants (product_id, storage, color_name, color_hex, price_on_request, availability, is_default)
select id, '128 GB', 'Cinza', '#8E8E93', true, 'ON_REQUEST', true
from public.products where slug in ('produto-de-teste', 'produto-de-teste-publicado');

-- Metadados de imagem fictícia (o arquivo não existe no Storage local).
insert into public.media_assets (storage_path, kind, mime_type, size_bytes, width, height, alt_text)
values ('products/seed/produto-de-teste.webp', 'IMAGE', 'image/webp', 1024, 1200, 1200, 'Imagem ilustrativa do produto de teste');

insert into public.product_media (product_id, media_asset_id, slot)
select p.id, a.id, 'MAIN'
from public.products p, public.media_assets a
where p.slug = 'produto-de-teste-publicado' and a.storage_path = 'products/seed/produto-de-teste.webp';

update public.products set status = 'PUBLISHED' where slug = 'produto-de-teste-publicado';

-- Produto com capacidades, cores e preços (seletor de variante da Etapa 05), em
-- outra categoria para não alterar a página de iPhone usada nos testes.
insert into public.product_families (category_id, name, slug, sort_order)
select id, 'Família de teste Mac', 'familia-de-teste-mac', 10 from public.categories where slug = 'mac';

insert into public.products (category_id, family_id, name, slug, short_description, badge, is_launch, is_featured, sort_order)
select f.category_id, f.id, 'Produto com variantes', 'produto-com-variantes', 'Produto fictício com capacidades e cores.', 'Novo', true, true, 10
from public.product_families f where f.slug = 'familia-de-teste-mac';

-- A primeira variante inserida vira a padrão (trigger ensure_default_variant).
insert into public.product_variants (product_id, storage, color_name, color_hex, price_cash, price_installment, installments, price_on_request, availability, sort_order)
select id, '256 GB', 'Preto', '#1D1D1F', 899900, 54990, 18, false, 'AVAILABLE', 10
from public.products where slug = 'produto-com-variantes';

insert into public.product_variants (product_id, storage, color_name, color_hex, price_cash, price_installment, installments, price_on_request, availability, sort_order)
select p.id, o.storage, o.color_name, o.color_hex, o.price_cash, o.price_installment, 18, false, o.availability::public.availability_status, o.sort_order
from public.products p
cross join (values
  ('256 GB', 'Branco', '#F5F5F7', 899900, 54990, 'AVAILABLE', 20),
  ('512 GB', 'Preto', '#1D1D1F', 1049900, 64160, 'PRE_ORDER', 30)
) as o (storage, color_name, color_hex, price_cash, price_installment, availability, sort_order)
where p.slug = 'produto-com-variantes';

insert into public.product_media (product_id, media_asset_id, slot)
select p.id, a.id, 'MAIN'
from public.products p, public.media_assets a
where p.slug = 'produto-com-variantes' and a.storage_path = 'products/seed/produto-de-teste.webp';

insert into public.product_specs (product_id, group_name, label, value, sort_order)
select p.id, s.group_name, s.label, s.value, s.sort_order
from public.products p
cross join (values
  ('Tela', 'Tamanho', '14 polegadas (fictício)', 10),
  ('Bateria', 'Duração', 'Até 18 horas (fictício)', 20)
) as s (group_name, label, value, sort_order)
where p.slug = 'produto-com-variantes';

update public.products set status = 'PUBLISHED' where slug = 'produto-com-variantes';

-- -----------------------------------------------------------------------------
-- Contato e configurações fictícios (DDD 00 não existe: número inválido de propósito).
-- -----------------------------------------------------------------------------
insert into public.contacts (name, whatsapp, role, is_default, sort_order)
values ('Atendimento (teste)', '5500000000000', 'Contato fictício', true, 10);

insert into public.site_settings (key, value_json)
values
  ('whatsapp', '{"message_template": "Olá! Vi no site da Moça do iPhone o {produto} {variante} e gostaria de consultar disponibilidade e valor.", "lead_origin": "Site", "general_message": "Olá! Vim pelo site da Moça do iPhone e gostaria de atendimento."}'),
  ('media', '{"video_upload_enabled": false}'),
  ('store', '{"name": "Loja de teste", "description": "Loja fictícia do ambiente local.", "address_line": "Rua Fictícia, 100", "district": "Centro", "city": "Cidade Exemplo — SP", "postal_code": "00000-000", "hours": [{"label": "Segunda a sábado", "value": "10h às 22h"}, {"label": "Domingo", "value": "14h às 20h"}], "map_url": "https://maps.apple.com/?q=loja-de-teste", "photo_ids": [], "cta_label": "Fale com a loja"}'),
  ('footer', '{"about": "Ambiente local de desenvolvimento.", "social_links": [{"network": "INSTAGRAM", "url": "https://instagram.com/exemplo"}], "legal_name": "Empresa Fictícia LTDA", "legal_id": "00.000.000/0000-00", "legal_notice": "Texto legal fictício do ambiente local.", "copyright": null}');

-- -----------------------------------------------------------------------------
-- Home de teste (Etapa 05): um bloco de cada família de layout, todos ativos.
-- -----------------------------------------------------------------------------
insert into public.homepage_sections (type, title, subtitle, content, product_id, category_id, theme, settings_json, sort_order, is_active)
select b.type::public.content_block_type, b.title, b.subtitle, b.content,
       case when b.with_product then (select id from public.products where slug = 'produto-com-variantes') end,
       null, b.theme::public.section_theme, b.settings::jsonb, b.sort_order, true
from (values
  ('HERO_PRODUCT', 'Hero de teste', 'Subtítulo fictício do hero.', null, true, 'DARK',
   '{"eyebrow": "Novo", "primaryCta": {"label": "Ver opções", "target": "PRODUCT"}, "secondaryCta": {"label": "Falar no WhatsApp", "target": "WHATSAPP"}}', 10),
  ('PRODUCT_GRID', 'Lançamentos de teste', null, null, false, 'LIGHT',
   '{"source": "LAUNCH", "limit": 8, "primaryCta": {"label": "Ver lançamentos", "target": "LAUNCHES"}}', 20),
  ('CATEGORY_GRID', 'Linhas Apple', null, null, false, 'LIGHT', '{}', 30),
  ('FEATURES', 'Benefícios de teste', null, null, false, 'DARK',
   '{"items": [{"title": "Retirada em loja", "text": "Texto fictício."}, {"title": "Parcelamento", "text": "Texto fictício."}]}', 40),
  ('STORE', 'Visite a loja de teste', null, null, false, 'LIGHT', '{}', 50),
  ('CTA', 'Chamada de teste', 'Fale com a gente.', null, false, 'LIGHT',
   '{"primaryCta": {"label": "Falar no WhatsApp", "target": "WHATSAPP"}}', 60)
) as b (type, title, subtitle, content, with_product, theme, settings, sort_order);

select set_config('app.audit_source', '', false);
