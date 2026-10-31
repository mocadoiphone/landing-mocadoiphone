-- =============================================================================
-- 08 · Home administrável por blocos (Brain §7, §18, §19; MDI-D009)
-- O administrador escolhe tipo, conteúdo e tema; o layout é do sistema.
-- `settings_json` é validado por tipo na aplicação (Zod); aqui só garantimos objeto.
-- Banners = blocos PROMO_BANNER / FULLSCREEN_MEDIA (sem tabela própria).
-- Coleções (MDI-D009) entram na Etapa 05, com a coluna collection_id.
-- Reversão: drop table public.homepage_sections cascade.
-- =============================================================================

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  type public.content_block_type not null,
  -- Texto puro (sem HTML), com limites para não quebrar o layout.
  title text check (char_length(title) <= 160),
  subtitle text check (char_length(subtitle) <= 300),
  content text check (char_length(content) <= 2000),
  product_id uuid references public.products (id) on delete restrict,
  category_id uuid references public.categories (id) on delete restrict,
  media_asset_id uuid references public.media_assets (id) on delete restrict,
  video_asset_id uuid references public.media_assets (id) on delete restrict,
  theme public.section_theme not null default 'LIGHT',
  settings_json jsonb not null default '{}'::jsonb check (jsonb_typeof(settings_json) = 'object'),
  sort_order integer not null default 0,
  -- Nasce desativada: entra na Home só por ação explícita.
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.homepage_sections enable row level security;

-- Montagem da Home: blocos ativos em ordem.
create index homepage_sections_public_idx on public.homepage_sections (sort_order) where is_active;

create trigger set_row_metadata before insert or update on public.homepage_sections
  for each row execute function app.set_row_metadata();
