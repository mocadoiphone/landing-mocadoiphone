-- =============================================================================
-- 13 · Storage (Brain §20; MDI-D007)
-- Um bucket `media` com as pastas do Brain: products, categories, home,
-- banners, store, seo.
-- - Leitura: bucket público (URL direta via CDN). Caminhos usam UUID e o
--   anônimo não lista objetos; metadados de mídia não publicada ficam
--   ocultos pela RLS de media_assets.
-- - Escrita: só perfis administrativos autorizados, só nas pastas permitidas.
-- - Exclusão de arquivo: só se nenhuma mídia ativa apontar para ele.
-- Reversão: drop das políticas media_objects_*; delete from storage.buckets where id = 'media'.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50 MB (vídeo); imagens limitadas a 10 MB em media_assets
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Listar/consultar objetos via API: só staff (o público acessa pela URL pública).
create policy media_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select app.is_staff()));

create policy media_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in ('products', 'categories', 'home', 'banners', 'store', 'seo')
    and (select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR'))
  );

create policy media_objects_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and (select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR'))
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] in ('products', 'categories', 'home', 'banners', 'store', 'seo')
    and (select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR'))
  );

create policy media_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR'))
    and app.is_storage_object_deletable(bucket_id, name)
  );
