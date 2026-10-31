-- =============================================================================
-- 05 · Variantes (Brain §10, §11, §12; MDI-D005/D006)
-- Preço e disponibilidade vivem SOMENTE aqui. Valores em centavos (integer).
-- Reversão: drop table public.product_variants cascade.
-- =============================================================================

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  sku text check (sku ~ '^[A-Za-z0-9._-]{1,64}$'),
  storage text check (char_length(btrim(storage)) between 1 and 40),
  color_name text check (char_length(btrim(color_name)) between 1 and 60),
  color_hex text check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- Preços em centavos: R$ 8.999,00 = 899900.
  price_cash integer check (price_cash >= 0),
  price_old integer check (price_old >= 0),
  price_installment integer check (price_installment > 0),
  installments smallint check (installments between 1 and 36),
  installment_text text check (char_length(installment_text) <= 120),
  -- Exibe "Consulte valores" no lugar do preço (Brain §11).
  price_on_request boolean not null default false,
  availability public.availability_status not null default 'ON_REQUEST',
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,

  -- Alvo da FK composta de product_media (mídia de variante do mesmo produto).
  constraint product_variants_id_product_key unique (id, product_id),
  -- Preço "de" só faz sentido acima do preço à vista.
  constraint product_variants_old_price_above_cash check (
    price_old is null or price_cash is null or price_old > price_cash
  ),
  -- Parcela e quantidade de parcelas andam juntas.
  constraint product_variants_installment_pair check (
    (price_installment is null) = (installments is null)
  )
);
alter table public.product_variants enable row level security;

create unique index product_variants_sku_key on public.product_variants (sku)
  where sku is not null and deleted_at is null;
-- No máximo uma variante padrão por produto.
create unique index product_variants_one_default on public.product_variants (product_id)
  where is_default and deleted_at is null;
-- Sem combinação capacidade × cor repetida no mesmo produto (também atende buscas por product_id).
create unique index product_variants_combination_key
  on public.product_variants (product_id, storage, color_name) nulls not distinct
  where deleted_at is null;

create trigger set_row_metadata before insert or update on public.product_variants
  for each row execute function app.set_row_metadata();
create trigger set_soft_delete_metadata before insert or update on public.product_variants
  for each row execute function app.set_soft_delete_metadata();
create trigger prevent_product_change before update on public.product_variants
  for each row execute function app.prevent_product_change();
