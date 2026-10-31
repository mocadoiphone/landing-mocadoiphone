-- =============================================================================
-- 12 · Permissões e RLS (Brain §22, §23; MDI-D008)
-- O banco é a fronteira de segurança: nada aqui depende do front-end.
--
-- Papéis com escrita:
--   catálogo (categorias, famílias, produtos, variantes, specs, mídia do produto)
--       → OWNER, ADMIN, CATALOG_MANAGER
--   biblioteca de mídia → OWNER, ADMIN, CATALOG_MANAGER, CONTENT_EDITOR
--   Home → OWNER, ADMIN, CONTENT_EDITOR
--   contatos e configurações → OWNER, ADMIN
--   perfis administrativos → OWNER
--   auditoria → leitura OWNER, ADMIN; escrita só pelo trigger
-- Leitura pública: apenas conteúdo publicado/ativo e não excluído.
-- Staff (qualquer perfil ativo) lê também rascunhos e excluídos.
-- Reversão: drop das políticas abaixo e re-grant padrão do Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Privilégios de tabela: começa do zero e concede só o necessário.
-- -----------------------------------------------------------------------------
revoke all on table
  public.admin_profiles, public.media_assets, public.categories, public.product_families,
  public.products, public.product_variants, public.product_media, public.product_specs,
  public.homepage_sections, public.contacts, public.site_settings, public.audit_logs
from anon, authenticated;

grant select on table
  public.media_assets, public.categories, public.product_families, public.products,
  public.product_variants, public.product_media, public.product_specs,
  public.homepage_sections, public.contacts, public.site_settings
to anon, authenticated;

grant select on table public.admin_profiles, public.audit_logs to authenticated;

grant insert, update on table
  public.admin_profiles, public.media_assets, public.categories, public.product_families,
  public.products, public.product_variants, public.product_media, public.product_specs,
  public.homepage_sections, public.contacts, public.site_settings
to authenticated;

-- Exclusão física só onde ela é o comportamento normal. Nas demais tabelas
-- "excluir" é soft delete (UPDATE de deleted_at) e DELETE não é concedido.
grant delete on table
  public.admin_profiles, public.product_media, public.product_specs, public.homepage_sections
to authenticated;

-- -----------------------------------------------------------------------------
-- admin_profiles
-- -----------------------------------------------------------------------------
create policy admin_profiles_select on public.admin_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select app.has_role('OWNER', 'ADMIN')));

create policy admin_profiles_insert on public.admin_profiles
  for insert to authenticated
  with check ((select app.has_role('OWNER')));

create policy admin_profiles_update on public.admin_profiles
  for update to authenticated
  using ((select app.has_role('OWNER')))
  with check ((select app.has_role('OWNER')));

create policy admin_profiles_delete on public.admin_profiles
  for delete to authenticated
  using ((select app.has_role('OWNER')));

-- -----------------------------------------------------------------------------
-- media_assets
-- -----------------------------------------------------------------------------
create policy media_assets_select on public.media_assets
  for select to anon, authenticated
  using ((deleted_at is null and app.is_media_public(id)) or (select app.is_staff()));

create policy media_assets_insert on public.media_assets
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR')));

create policy media_assets_update on public.media_assets
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR')));

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create policy categories_select on public.categories
  for select to anon, authenticated
  using ((is_active and deleted_at is null) or (select app.is_staff()));

create policy categories_insert on public.categories
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy categories_update on public.categories
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

-- -----------------------------------------------------------------------------
-- product_families ("publicável" = não excluída e de categoria pública)
-- -----------------------------------------------------------------------------
create policy product_families_select on public.product_families
  for select to anon, authenticated
  using ((deleted_at is null and app.is_category_public(category_id)) or (select app.is_staff()));

create policy product_families_insert on public.product_families
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy product_families_update on public.product_families
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create policy products_select on public.products
  for select to anon, authenticated
  using (
    (status = 'PUBLISHED' and deleted_at is null and app.is_product_public(id))
    or (select app.is_staff())
  );

create policy products_insert on public.products
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy products_update on public.products
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

-- -----------------------------------------------------------------------------
-- product_variants
-- -----------------------------------------------------------------------------
create policy product_variants_select on public.product_variants
  for select to anon, authenticated
  using (
    (deleted_at is null and availability <> 'HIDDEN' and app.is_product_public(product_id))
    or (select app.is_staff())
  );

create policy product_variants_insert on public.product_variants
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy product_variants_update on public.product_variants
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

-- -----------------------------------------------------------------------------
-- product_media
-- -----------------------------------------------------------------------------
create policy product_media_select on public.product_media
  for select to anon, authenticated
  using (
    (app.is_product_public(product_id) and (variant_id is null or app.is_variant_public(variant_id)))
    or (select app.is_staff())
  );

create policy product_media_insert on public.product_media
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy product_media_update on public.product_media
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy product_media_delete on public.product_media
  for delete to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

-- -----------------------------------------------------------------------------
-- product_specs
-- -----------------------------------------------------------------------------
create policy product_specs_select on public.product_specs
  for select to anon, authenticated
  using (app.is_product_public(product_id) or (select app.is_staff()));

create policy product_specs_insert on public.product_specs
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy product_specs_update on public.product_specs
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

create policy product_specs_delete on public.product_specs
  for delete to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CATALOG_MANAGER')));

-- -----------------------------------------------------------------------------
-- homepage_sections
-- -----------------------------------------------------------------------------
create policy homepage_sections_select on public.homepage_sections
  for select to anon, authenticated
  using (is_active or (select app.is_staff()));

create policy homepage_sections_insert on public.homepage_sections
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN', 'CONTENT_EDITOR')));

create policy homepage_sections_update on public.homepage_sections
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CONTENT_EDITOR')))
  with check ((select app.has_role('OWNER', 'ADMIN', 'CONTENT_EDITOR')));

create policy homepage_sections_delete on public.homepage_sections
  for delete to authenticated
  using ((select app.has_role('OWNER', 'ADMIN', 'CONTENT_EDITOR')));

-- -----------------------------------------------------------------------------
-- contacts
-- -----------------------------------------------------------------------------
create policy contacts_select on public.contacts
  for select to anon, authenticated
  using ((is_active and deleted_at is null) or (select app.is_staff()));

create policy contacts_insert on public.contacts
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN')));

create policy contacts_update on public.contacts
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN')))
  with check ((select app.has_role('OWNER', 'ADMIN')));

-- -----------------------------------------------------------------------------
-- site_settings (público só o que a migration marcou como público)
-- -----------------------------------------------------------------------------
create policy site_settings_select on public.site_settings
  for select to anon, authenticated
  using (is_public or (select app.is_staff()));

create policy site_settings_insert on public.site_settings
  for insert to authenticated
  with check ((select app.has_role('OWNER', 'ADMIN')));

create policy site_settings_update on public.site_settings
  for update to authenticated
  using ((select app.has_role('OWNER', 'ADMIN')))
  with check ((select app.has_role('OWNER', 'ADMIN')));

-- -----------------------------------------------------------------------------
-- audit_logs (somente leitura; sem políticas de escrita = ninguém escreve via API)
-- -----------------------------------------------------------------------------
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using ((select app.has_role('OWNER', 'ADMIN')));
