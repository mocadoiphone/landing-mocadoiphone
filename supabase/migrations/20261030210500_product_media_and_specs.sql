-- =============================================================================
-- 06 · Mídia e especificações do produto (Brain §9, §17, §20, §21; MDI-D007)
-- Reversão: drop table public.product_specs, public.product_media cascade.
-- =============================================================================

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid,
  media_asset_id uuid not null references public.media_assets (id) on delete restrict,
  -- Aba Mídia (§17): imagem principal, galeria, imagem mobile, vídeo.
  slot text not null check (slot in ('MAIN', 'GALLERY', 'MOBILE', 'VIDEO')),
  -- Opcional: sobrepõe o alt da biblioteca quando o contexto pede outro texto.
  alt_text text check (alt_text is null or char_length(btrim(alt_text)) between 1 and 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,

  -- Se houver variante, ela pertence ao mesmo produto.
  constraint product_media_variant_belongs_to_product
    foreign key (variant_id, product_id)
    references public.product_variants (id, product_id) on delete restrict
);
alter table public.product_media enable row level security;

-- Uma imagem principal e uma mobile por produto (ou por variante).
create unique index product_media_one_main on public.product_media (product_id, variant_id)
  nulls not distinct where slot = 'MAIN';
create unique index product_media_one_mobile on public.product_media (product_id, variant_id)
  nulls not distinct where slot = 'MOBILE';
-- Página de produto: mídias por slot e ordem.
create index product_media_product_idx on public.product_media (product_id, slot, sort_order);
-- Verificação de referências antes de excluir mídia.
create index product_media_asset_idx on public.product_media (media_asset_id);

create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  group_name text check (char_length(btrim(group_name)) between 1 and 80),
  label text not null check (char_length(btrim(label)) between 1 and 120),
  value text not null check (char_length(btrim(value)) between 1 and 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.product_specs enable row level security;

create index product_specs_product_idx on public.product_specs (product_id, group_name, sort_order);

create trigger set_row_metadata before insert or update on public.product_media
  for each row execute function app.set_row_metadata();
create trigger prevent_product_change before update on public.product_media
  for each row execute function app.prevent_product_change();

create trigger set_row_metadata before insert or update on public.product_specs
  for each row execute function app.set_row_metadata();
create trigger prevent_product_change before update on public.product_specs
  for each row execute function app.prevent_product_change();
