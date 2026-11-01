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

-- -----------------------------------------------------------------------------
-- Contato e configurações fictícios (DDD 00 não existe: número inválido de propósito).
-- -----------------------------------------------------------------------------
insert into public.contacts (name, whatsapp, role, is_default, sort_order)
values ('Atendimento (teste)', '5500000000000', 'Contato fictício', true, 10);

insert into public.site_settings (key, value_json)
values
  ('whatsapp', '{"message_template": "Olá! Vi no site da Moça do iPhone o {produto} {variante} e gostaria de consultar disponibilidade e valor.", "lead_origin": "Site"}'),
  ('media', '{"video_upload_enabled": false}');

select set_config('app.audit_source', '', false);
