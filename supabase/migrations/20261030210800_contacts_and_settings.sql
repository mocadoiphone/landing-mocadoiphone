-- =============================================================================
-- 09 · Contatos e configurações (Brain §13, §14, §21; MDI-D012)
-- Reversão: drop table public.site_settings, public.contacts cascade.
-- =============================================================================

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  -- Telefones só com dígitos, com DDI (ex.: 5511999999999). Dados comerciais públicos.
  phone text check (phone ~ '^[1-9][0-9]{9,14}$'),
  whatsapp text not null check (whatsapp ~ '^[1-9][0-9]{9,14}$'),
  role text check (char_length(role) <= 80),
  avatar_asset_id uuid references public.media_assets (id) on delete restrict,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,

  -- O contato padrão precisa estar ativo e não excluído (escolha outro antes de removê-lo).
  constraint contacts_default_is_available check (not is_default or (is_active and deleted_at is null))
);
alter table public.contacts enable row level security;

-- Um único contato padrão (MDI-D012).
create unique index contacts_single_default on public.contacts ((true))
  where is_default and deleted_at is null;
create index contacts_public_idx on public.contacts (sort_order)
  where is_active and deleted_at is null;

create trigger set_row_metadata before insert or update on public.contacts
  for each row execute function app.set_row_metadata();
create trigger set_soft_delete_metadata before insert or update on public.contacts
  for each row execute function app.set_soft_delete_metadata();

-- -----------------------------------------------------------------------------
-- Configurações do site. Chaves permitidas e visibilidade pública são definidas
-- AQUI, por migration — o painel edita valores, nunca a visibilidade.
--   whatsapp → público (template da mensagem, origem do lead)
--   store    → público (endereço, horários, mapa, fotos da loja)
--   footer   → público
--   seo      → público (padrões de título/descrição/OG)
--   media    → privado (regras internas de upload)
-- Nunca armazenar segredo em site_settings.
-- -----------------------------------------------------------------------------
create table public.site_settings (
  key text primary key check (key in ('whatsapp', 'store', 'footer', 'seo', 'media')),
  value_json jsonb not null default '{}'::jsonb check (jsonb_typeof(value_json) = 'object'),
  is_public boolean generated always as (key in ('whatsapp', 'store', 'footer', 'seo')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.site_settings enable row level security;

create trigger set_row_metadata before insert or update on public.site_settings
  for each row execute function app.set_row_metadata();
