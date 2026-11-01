-- Funções do painel administrativo (MDI-D027): lista de administradores com
-- e-mail, concessão de perfil pelo OWNER e troca atômica do contato padrão.
-- Fixtures: …01 OWNER · …02 ADMIN · …03 CATALOG_MANAGER · …04 CONTENT_EDITOR ·
-- …05 sem perfil · contato padrão 8888…01 (ativo) · 8888…02 inativo.
begin;
\ir _fixtures.psql
select * from no_plan();

-- Logins sem perfil: um confirmado e um ainda não confirmado.
insert into auth.users (id, email, aud, role, instance_id, email_confirmed_at)
values
  ('aaaaaaaa-0000-4000-8000-000000000007', 'novo@tests.local', 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000', now()),
  ('aaaaaaaa-0000-4000-8000-000000000008', 'pendente@tests.local', 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000', null);

-- =============================================================================
-- list_admin_users
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated"}';
select results_eq(
  $$ select email, role::text from public.list_admin_users()
     where email like '%@tests.local' order by email $$,
  $$ values ('admin@tests.local', 'ADMIN'), ('catalogo@tests.local', 'CATALOG_MANAGER'),
            ('conteudo@tests.local', 'CONTENT_EDITOR'), ('inativo@tests.local', 'ADMIN'),
            ('owner@tests.local', 'OWNER') $$,
  'OWNER lista os administradores com e-mail (sem logins sem perfil)'
);
reset role;
set local request.jwt.claims to '';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
select ok((select count(*) from public.list_admin_users()) >= 5, 'ADMIN também lista');
reset role;
set local request.jwt.claims to '';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok($$ select * from public.list_admin_users() $$, '42501', null,
  'gestor de catálogo não lista administradores');
reset role;
set local request.jwt.claims to '';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok($$ select * from public.list_admin_users() $$, '42501', null,
  'usuário sem perfil não lista administradores');
reset role;
set local request.jwt.claims to '';

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok($$ select * from public.list_admin_users() $$, '42501', null,
  'anônimo não executa list_admin_users');
reset role;
set local request.jwt.claims to '';

-- =============================================================================
-- grant_admin_profile
-- =============================================================================
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok($$ select public.grant_admin_profile('novo@tests.local', 'Novo', 'ADMIN') $$,
  '42501', null, 'ADMIN não concede perfil');
reset role;
set local request.jwt.claims to '';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_like($$ select public.grant_admin_profile('naoexiste@tests.local', 'X', 'ADMIN') $$,
  '%Não existe login%', 'login inexistente é recusado com orientação');
select throws_like($$ select public.grant_admin_profile('pendente@tests.local', 'X', 'ADMIN') $$,
  '%não foi confirmado%', 'login não confirmado é recusado');
select throws_like($$ select public.grant_admin_profile('novo@tests.local', '   ', 'ADMIN') $$,
  '%nome de exibição%', 'nome vazio é recusado');
select is(public.grant_admin_profile('  NOVO@tests.local ', ' Novo Admin ', 'CATALOG_MANAGER'),
  'aaaaaaaa-0000-4000-8000-000000000007'::uuid, 'OWNER concede perfil pelo e-mail (sem diferenciar maiúsculas)');
select throws_like($$ select public.grant_admin_profile('novo@tests.local', 'Outra vez', 'ADMIN') $$,
  '%já tem perfil%', 'perfil existente não é duplicado');
reset role;
set local request.jwt.claims to '';

select results_eq(
  $$ select display_name, role::text, is_active from public.admin_profiles
     where user_id = 'aaaaaaaa-0000-4000-8000-000000000007' $$,
  $$ values ('Novo Admin', 'CATALOG_MANAGER', true) $$,
  'perfil criado com nome aparado, papel escolhido e ativo'
);
select ok(exists (
    select 1 from public.audit_logs
    where entity_type = 'admin_profiles' and entity_id = 'aaaaaaaa-0000-4000-8000-000000000007'
      and operation = 'INSERT' and actor_user_id = 'aaaaaaaa-0000-4000-8000-000000000001'
      and actor_role = 'OWNER'
  ), 'concessão auditada com o OWNER como autor');

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok($$ select public.grant_admin_profile('novo@tests.local', 'X', 'ADMIN') $$,
  '42501', null, 'anônimo não executa grant_admin_profile');
reset role;
set local request.jwt.claims to '';

-- =============================================================================
-- set_default_contact
-- =============================================================================
insert into public.contacts (id, name, whatsapp, is_active)
values ('88888888-0000-4000-8000-000000000003', 'Segundo contato', '5500000000003', true);

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
select lives_ok($$ select public.set_default_contact('88888888-0000-4000-8000-000000000003') $$,
  'ADMIN troca o contato padrão');
select throws_like($$ select public.set_default_contact('88888888-0000-4000-8000-000000000002') $$,
  '%contato ativo%', 'contato inativo não pode ser o padrão');
reset role;
set local request.jwt.claims to '';

select results_eq(
  $$ select id from public.contacts where is_default and deleted_at is null $$,
  $$ values ('88888888-0000-4000-8000-000000000003'::uuid) $$,
  'existe exatamente um contato padrão depois da troca'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';
select throws_ok($$ select public.set_default_contact('88888888-0000-4000-8000-000000000001') $$,
  '42501', null, 'gestor de catálogo não troca o contato padrão');
reset role;
set local request.jwt.claims to '';

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok($$ select public.set_default_contact('88888888-0000-4000-8000-000000000001') $$,
  '42501', null, 'anônimo não executa set_default_contact');
reset role;
set local request.jwt.claims to '';

select is((select is_default from public.contacts where id = '88888888-0000-4000-8000-000000000003'), true,
  'tentativas recusadas não alteram o contato padrão');

select * from finish();
rollback;
