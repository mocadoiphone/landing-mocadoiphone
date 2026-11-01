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

-- Funções (MDI-D023): nenhuma função interna executável por PUBLIC.
select is_empty(
  $$ select p.oid::regprocedure::text
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
     cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
     where n.nspname = 'app' and a.privilege_type = 'EXECUTE' and a.grantee = 0 $$,
  'app: nenhuma função com EXECUTE para PUBLIC'
);

-- Funções novas do postgres nascem fechadas (padrão global, não só por schema).
create function public.t_nova_funcao() returns integer language sql as 'select 1';
select is_empty(
  $$ select 1
     from aclexplode(coalesce(
       (select proacl from pg_proc where oid = 'public.t_nova_funcao()'::regprocedure),
       acldefault('f', 'postgres'::regrole))) a
     where a.privilege_type = 'EXECUTE'
       and a.grantee in (0, 'anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole) $$,
  'função nova do postgres nasce sem EXECUTE para PUBLIC e para os papéis da API'
);

-- RPC pública do catálogo: só usuários autenticados (a RLS decide o resto).
select function_privs_are('public', 'set_default_variant', array['uuid'], 'authenticated', array['EXECUTE'],
  'authenticated executa set_default_variant');
select function_privs_are('public', 'set_default_variant', array['uuid'], r, array[]::text[],
  r || ' não executa set_default_variant')
from unnest(array['anon', 'service_role']) as r;

-- Funções do painel (MDI-D027): só autenticados; cada uma confere o papel.
select function_privs_are('public', f.name, f.args, 'authenticated', array['EXECUTE'],
  'authenticated executa ' || f.name)
from (values
  ('list_admin_users', array[]::text[]),
  ('grant_admin_profile', array['text', 'text', 'admin_role']),
  ('set_default_contact', array['uuid'])
) as f (name, args);
select function_privs_are('public', f.name, f.args, r, array[]::text[],
  r || ' não executa ' || f.name)
from (values
  ('list_admin_users', array[]::text[]),
  ('grant_admin_profile', array['text', 'text', 'admin_role']),
  ('set_default_contact', array['uuid'])
) as f (name, args)
cross join unnest(array['anon', 'service_role']) as r;

select * from finish();
rollback;
