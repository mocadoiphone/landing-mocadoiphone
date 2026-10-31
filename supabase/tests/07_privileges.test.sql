-- Privilégios explícitos (MDI-D019): a matriz de grants não pode depender dos
-- privilégios padrão do ambiente (o remoto e o local têm padrões diferentes).
begin;
select * from no_plan();

-- anon: só leitura do conteúdo público (o filtro fino é da RLS).
select table_privs_are('public', t, 'anon', array['SELECT'], 'anon: só SELECT em ' || t)
from unnest(array[
  'media_assets', 'categories', 'product_families', 'products', 'product_variants',
  'product_media', 'product_specs', 'homepage_sections', 'contacts', 'site_settings'
]) as t;
select table_privs_are('public', t, 'anon', array[]::text[], 'anon: nada em ' || t)
from unnest(array['admin_profiles', 'audit_logs']) as t;

-- authenticated: soft delete onde há deleted_at (sem DELETE); exclusão física só nas demais.
select table_privs_are('public', t, 'authenticated', array['SELECT', 'INSERT', 'UPDATE'],
  'authenticated: SELECT/INSERT/UPDATE em ' || t)
from unnest(array[
  'media_assets', 'categories', 'product_families', 'products', 'product_variants',
  'contacts', 'site_settings'
]) as t;
select table_privs_are('public', t, 'authenticated', array['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  'authenticated: SELECT/INSERT/UPDATE/DELETE em ' || t)
from unnest(array['admin_profiles', 'product_media', 'product_specs', 'homepage_sections']) as t;
select table_privs_are('public', 'audit_logs', 'authenticated', array['SELECT'],
  'authenticated: só SELECT na auditoria');

-- service_role não é usada pela aplicação (MDI-D017).
select table_privs_are('public', t, 'service_role', array[]::text[], 'service_role: nada em ' || t)
from unnest(array[
  'admin_profiles', 'media_assets', 'categories', 'product_families', 'products',
  'product_variants', 'product_media', 'product_specs', 'homepage_sections',
  'contacts', 'site_settings', 'audit_logs'
]) as t;

select sequence_privs_are('public', 'audit_logs_id_seq', r, array[]::text[],
  r || ': nada na sequence da auditoria')
from unnest(array['anon', 'authenticated', 'service_role']) as r;

-- Objetos futuros em public nascem sem privilégios para os papéis da API.
select is_empty(
  $$ select d.defaclobjtype, pg_get_userbyid(a.grantee)
     from pg_default_acl d
     join pg_namespace n on n.oid = d.defaclnamespace
     cross join lateral aclexplode(d.defaclacl) a
     where n.nspname = 'public'
       and d.defaclrole = 'postgres'::regrole
       and a.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole) $$,
  'public: sem privilégios padrão para anon/authenticated/service_role'
);

select * from finish();
rollback;
