-- Storage (Brain §20; MDI-D007): bucket media, pastas permitidas e escrita só por administradores.
begin;
\ir _fixtures.psql
select * from no_plan();

select is((select public from storage.buckets where id = 'media'), true,
  'bucket media existe e serve arquivos publicamente (URL direta)');
select is((select allowed_mime_types from storage.buckets where id = 'media'),
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4'],
  'bucket aceita só os tipos do Brain §20');
select is((select file_size_limit from storage.buckets where id = 'media'), 52428800::bigint,
  'bucket limita arquivos a 50 MB');

-- Arquivos existentes (como postgres): um usado por mídia ativa, um livre.
insert into storage.objects (bucket_id, name)
values ('media', 'products/t/publicado.webp'), ('media', 'products/t/livre.webp');

-- Anônimo ------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role": "anon"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'products/t/anonimo.webp') $$,
  '42501', null, 'anônimo não envia arquivo');
select is((select count(*)::int from storage.objects where bucket_id = 'media'), 0,
  'anônimo não lista arquivos do bucket');
reset role;
set local request.jwt.claims to '';

-- Autenticado sem perfil -----------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'products/t/visitante.webp') $$,
  '42501', null, 'autenticado sem perfil não envia arquivo');
reset role;
set local request.jwt.claims to '';

-- Administradores ------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000003", "role": "authenticated"}';
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'products/t/novo.webp') $$,
  'CATALOG_MANAGER envia arquivo para pasta permitida');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'privado/novo.webp') $$,
  '42501', null, 'pasta fora do Brain §20 é bloqueada');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('outro-bucket', 'products/t/novo.webp') $$,
  '42501', null, 'escrita em outro bucket é bloqueada');
select ok((select count(*)::int from storage.objects where bucket_id = 'media') >= 3,
  'staff lista arquivos do bucket');
reset role;
set local request.jwt.claims to '';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000004", "role": "authenticated"}';
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'home/t/hero.webp') $$,
  'CONTENT_EDITOR envia arquivo para a pasta da Home');
reset role;
set local request.jwt.claims to '';

-- Exclusão (simula o caminho da Storage API) ---------------------------------------
set local storage.allow_delete_query = 'true';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000005", "role": "authenticated"}';
select results_eq(
  $$ with d as (delete from storage.objects where bucket_id = 'media' and name = 'products/t/livre.webp' returning 1)
     select count(*)::int from d $$,
  $$ values (0) $$,
  'autenticado sem perfil não apaga arquivo');
reset role;
set local request.jwt.claims to '';

set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';
select results_eq(
  $$ with d as (delete from storage.objects where bucket_id = 'media' and name = 'products/t/publicado.webp' returning 1)
     select count(*)::int from d $$,
  $$ values (0) $$,
  'arquivo referenciado por mídia ativa não é apagado');
select results_eq(
  $$ with d as (delete from storage.objects where bucket_id = 'media' and name = 'products/t/livre.webp' returning 1)
     select count(*)::int from d $$,
  $$ values (1) $$,
  'ADMIN apaga arquivo sem uso');
reset role;
set local request.jwt.claims to '';

select * from finish();
rollback;
