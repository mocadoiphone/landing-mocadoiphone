-- =============================================================================
-- 14 · Privilégios explícitos, independentes do ambiente (MDI-D019)
-- O projeto remoto concede por padrão ALL em tabelas novas de `public` a anon,
-- authenticated e service_role (e SELECT/UPDATE/USAGE em sequences, EXECUTE
-- em funções). O Supabase local mais novo não concede. A migration 12 já zera
-- anon e authenticated nas tabelas; aqui service_role e a sequence da
-- auditoria deixam de depender do ambiente, e objetos futuros em `public`
-- nascem sem privilégios para os papéis da API nos dois ambientes.
-- Reversão: grant all on table <tabelas> to service_role;
--   grant select, update, usage on sequence public.audit_logs_id_seq to anon, authenticated, service_role;
--   alter default privileges for role postgres in schema public grant ... (padrão anterior).
-- =============================================================================

-- A aplicação não usa service_role (MDI-D017). Se uma etapa futura precisar
-- (ex.: importação da Etapa 08), concede o mínimo em migration própria.
revoke all on table
  public.admin_profiles, public.media_assets, public.categories, public.product_families,
  public.products, public.product_variants, public.product_media, public.product_specs,
  public.homepage_sections, public.contacts, public.site_settings, public.audit_logs
from service_role;

-- A auditoria grava pelo trigger SECURITY DEFINER (dono postgres): nenhum papel
-- da API precisa da sequence.
revoke all on sequence public.audit_logs_id_seq from anon, authenticated, service_role;

-- Objetos futuros: cada migration concede explicitamente (docs/CONVENCOES.md).
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;
