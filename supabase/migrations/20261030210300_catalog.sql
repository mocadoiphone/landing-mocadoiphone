-- =============================================================================
-- 04 · Catálogo: categorias, famílias e produtos (Brain §8, §9, §21; MDI-D003/D004)
-- Hierarquia: Categoria → Família → Produto → Variante.
-- Reversão: drop table public.products, public.product_families, public.categories cascade.
-- =============================================================================

-- Slug: minúsculas, números e hífens (ex.: iphone-17-pro-max).
-- Unicidade sempre parcial (WHERE deleted_at IS NULL): um slug de registro
-- excluído logicamente pode ser reutilizado; restaurar o antigo exige renomear.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  slug text not null
    constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80)
    -- Slugs que colidiriam com rotas fixas do site (MDI-D003).
    constraint categories_slug_not_reserved check (
      slug not in ('admin', 'api', 'produto', 'ofertas', 'lancamentos', 'loja', 'contato')
    ),
  description text check (char_length(description) <= 500),
  image_asset_id uuid references public.media_assets (id) on delete restrict,
  sort_order integer not null default 0,
  -- Nasce inativa: nada fica público sem ação explícita.
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null
);
alter table public.categories enable row level security;

create unique index categories_slug_key on public.categories (slug) where deleted_at is null;
-- Menu e grade de categorias públicas.
create index categories_public_order_idx on public.categories (sort_order)
  where is_active and deleted_at is null;

create table public.product_families (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null
    constraint product_families_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,
  -- Alvo da FK composta de products (garante família da mesma categoria).
  constraint product_families_id_category_key unique (id, category_id)
);
alter table public.product_families enable row level security;

-- Slug único dentro da categoria (famílias não têm rota própria).
create unique index product_families_slug_key on public.product_families (category_id, slug)
  where deleted_at is null;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  family_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  -- Slug global: a URL pública é /produto/[slug] (MDI-D003).
  slug text not null
    constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  short_description text check (char_length(short_description) <= 300),
  description text check (char_length(description) <= 10000),
  status public.publication_status not null default 'DRAFT',
  badge text check (char_length(badge) <= 40),
  -- Derivado das variantes por trigger; somente leitura para o cliente (MDI-D005).
  price_from integer check (price_from >= 0),
  is_featured boolean not null default false,
  is_launch boolean not null default false,
  is_promotion boolean not null default false,
  -- Controlado pelo banco na primeira publicação.
  published_at timestamptz,
  sort_order integer not null default 0,
  related_product_id uuid references public.products (id) on delete set null,
  meta_title text check (char_length(meta_title) <= 120),
  meta_description text check (char_length(meta_description) <= 320),
  og_image_asset_id uuid references public.media_assets (id) on delete restrict,
  canonical_url text check (canonical_url ~ '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,

  constraint products_family_matches_category
    foreign key (family_id, category_id)
    references public.product_families (id, category_id) on delete restrict,
  constraint products_not_related_to_self check (related_product_id is null or related_product_id <> id),
  constraint products_published_has_date check (status <> 'PUBLISHED' or published_at is not null)
);
alter table public.products enable row level security;

create unique index products_slug_key on public.products (slug) where deleted_at is null;
-- Página de categoria: produtos publicados por ordem.
create index products_public_category_idx on public.products (category_id, sort_order)
  where status = 'PUBLISHED' and deleted_at is null;
-- FK composta / listagem por família.
create index products_family_idx on public.products (family_id);
-- Vitrines (Home, /lancamentos, /ofertas).
create index products_public_launch_idx on public.products (sort_order)
  where is_launch and status = 'PUBLISHED' and deleted_at is null;
create index products_public_promotion_idx on public.products (sort_order)
  where is_promotion and status = 'PUBLISHED' and deleted_at is null;
create index products_public_featured_idx on public.products (sort_order)
  where is_featured and status = 'PUBLISHED' and deleted_at is null;
-- Painel: filtro por status e "alterações recentes".
create index products_admin_status_idx on public.products (status, updated_at desc)
  where deleted_at is null;

-- Metadados e soft delete.
create trigger set_row_metadata before insert or update on public.categories
  for each row execute function app.set_row_metadata();
create trigger set_soft_delete_metadata before insert or update on public.categories
  for each row execute function app.set_soft_delete_metadata();

create trigger set_row_metadata before insert or update on public.product_families
  for each row execute function app.set_row_metadata();
create trigger set_soft_delete_metadata before insert or update on public.product_families
  for each row execute function app.set_soft_delete_metadata();

create trigger set_row_metadata before insert or update on public.products
  for each row execute function app.set_row_metadata();
create trigger set_soft_delete_metadata before insert or update on public.products
  for each row execute function app.set_soft_delete_metadata();
