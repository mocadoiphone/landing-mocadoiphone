-- =============================================================================
-- 03 · Biblioteca de mídia (Brain §20, MDI-D007)
-- Fonte única de metadados dos arquivos do bucket `media`. As demais tabelas
-- referenciam mídia por FK, nunca por URL solta.
-- Reversão: drop table public.media_assets cascade.
-- =============================================================================

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'media' check (bucket_id = 'media'),
  -- Pastas do Brain §20. Caminho relativo ao bucket, sem "..".
  storage_path text not null unique
    constraint media_assets_storage_path_format check (
      storage_path ~ '^(products|categories|home|banners|store|seo)/[A-Za-z0-9._/-]+$'
      and storage_path !~ '\.\.'
    ),
  kind public.media_kind not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  width integer check (width > 0),
  height integer check (height > 0),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null,

  constraint media_assets_mime_matches_kind check (
    (kind = 'IMAGE' and mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif'))
    or (kind = 'VIDEO' and mime_type = 'video/mp4')
  ),
  -- Dimensões obrigatórias em imagens evitam layout shift (Brain §27).
  constraint media_assets_image_dimensions check (
    kind <> 'IMAGE' or (width is not null and height is not null)
  ),
  -- Limites iniciais: imagem 10 MB, vídeo 50 MB (ajustáveis por migration).
  constraint media_assets_size_limit check (
    (kind = 'IMAGE' and size_bytes <= 10485760)
    or (kind = 'VIDEO' and size_bytes <= 52428800)
  )
);
alter table public.media_assets enable row level security;
comment on table public.media_assets is 'Metadados dos arquivos do bucket media (alt obrigatório, tipo, tamanho, dimensões).';

create trigger set_row_metadata
  before insert or update on public.media_assets
  for each row execute function app.set_row_metadata();

create trigger set_soft_delete_metadata
  before insert or update on public.media_assets
  for each row execute function app.set_soft_delete_metadata();
