-- =============================================================================
-- 11 · Regras de mídia (Brain §20; MDI-D007)
-- Depende de todas as tabelas que referenciam media_assets.
-- Reversão: drop do trigger guard_media_soft_delete e das funções app.*media*.
-- =============================================================================

-- Quantas referências um arquivo possui (inclui registros excluídos logicamente,
-- porque podem ser restaurados).
create function app.media_reference_count(p_asset_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select (
      (select count(*) from public.product_media m where m.media_asset_id = p_asset_id)
    + (select count(*) from public.categories c where c.image_asset_id = p_asset_id)
    + (select count(*) from public.products p where p.og_image_asset_id = p_asset_id)
    + (select count(*) from public.homepage_sections s
        where s.media_asset_id = p_asset_id or s.video_asset_id = p_asset_id)
    + (select count(*) from public.contacts ct where ct.avatar_asset_id = p_asset_id)
    + (select count(*) from public.site_settings st
        where st.value_json::text like '%' || p_asset_id::text || '%')
  )::integer
$$;

-- Mídia é pública somente se usada por conteúdo público.
create function app.is_media_public(p_asset_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.product_media m
      where m.media_asset_id = p_asset_id
        and app.is_product_public(m.product_id)
        and (m.variant_id is null or app.is_variant_public(m.variant_id))
    )
    or exists (
      select 1 from public.categories c
      where c.image_asset_id = p_asset_id and c.is_active and c.deleted_at is null
    )
    or exists (
      select 1 from public.products p
      where p.og_image_asset_id = p_asset_id and app.is_product_public(p.id)
    )
    or exists (
      select 1 from public.homepage_sections s
      where s.is_active and (s.media_asset_id = p_asset_id or s.video_asset_id = p_asset_id)
    )
    or exists (
      select 1 from public.contacts ct
      where ct.avatar_asset_id = p_asset_id and ct.is_active and ct.deleted_at is null
    )
    or exists (
      select 1 from public.site_settings st
      where st.is_public and st.value_json::text like '%' || p_asset_id::text || '%'
    )
$$;

grant execute on function app.is_media_public(uuid) to anon, authenticated;

-- Excluir (logicamente) só mídia sem referências.
create function app.guard_media_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null
     and app.media_reference_count(old.id) > 0 then
    raise exception 'Esta mídia está em uso e não pode ser excluída.'
      using errcode = 'P0001', hint = 'media:in_use';
  end if;
  return new;
end;
$$;

create trigger guard_media_soft_delete
  before update on public.media_assets
  for each row execute function app.guard_media_soft_delete();

-- Arquivo do Storage só pode ser apagado se não houver mídia ativa apontando para ele.
create function app.is_storage_object_deletable(p_bucket_id text, p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.media_assets a
    where a.bucket_id = p_bucket_id and a.storage_path = p_name and a.deleted_at is null
  )
$$;

grant execute on function app.is_storage_object_deletable(text, text) to authenticated;
