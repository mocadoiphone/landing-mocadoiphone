-- Auditoria (Brain §24; MDI-D010): eventos críticos registrados pelo banco, com autor e diferença.
begin;
\ir _fixtures.psql
select * from no_plan();

-- Ações executadas por um ADMIN (aaaa…02).
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000002", "role": "authenticated"}';

insert into public.categories (id, name, slug)
values ('cccccccc-0000-4000-8000-000000000020', 'Auditada', 't-auditada');
update public.product_variants set price_cash = 949900 where id = 'ffffffff-0000-4000-8000-000000000002';
update public.product_variants set availability = 'PRE_ORDER' where id = 'ffffffff-0000-4000-8000-000000000002';
update public.products set status = 'DRAFT' where id = 'eeeeeeee-0000-4000-8000-000000000002';
update public.products set status = 'PUBLISHED' where id = 'eeeeeeee-0000-4000-8000-000000000002';
update public.products set deleted_at = now() where id = 'eeeeeeee-0000-4000-8000-000000000001';
update public.products set deleted_at = null where id = 'eeeeeeee-0000-4000-8000-000000000001';
update public.site_settings set value_json = '{"site_name": "Auditado"}' where key = 'seo';

reset role;
set local request.jwt.claims to '';

-- Criação
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'categories' and entity_id = 'cccccccc-0000-4000-8000-000000000020'
    and operation = 'INSERT' and actor_user_id = 'aaaaaaaa-0000-4000-8000-000000000002'
    and actor_role = 'ADMIN' and source = 'admin'
    and new_value ->> 'slug' = 't-auditada'
), 'criação registra autor, papel, origem e valores');

-- Preço
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'product_variants' and entity_id = 'ffffffff-0000-4000-8000-000000000002'
    and operation = 'UPDATE' and changed_fields = '{price_cash}'
    and old_value ->> 'price_cash' = '899900' and new_value ->> 'price_cash' = '949900'
), 'alteração de preço registra valor anterior e novo');

-- Recalculo do price_from também fica registrado, com o mesmo autor.
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'products' and entity_id = 'eeeeeeee-0000-4000-8000-000000000002'
    and 'price_from' = any (changed_fields) and new_value ->> 'price_from' = '949900'
    and actor_user_id = 'aaaaaaaa-0000-4000-8000-000000000002'
), 'recálculo de price_from é auditado com o autor da alteração');

-- Disponibilidade
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'product_variants' and entity_id = 'ffffffff-0000-4000-8000-000000000002'
    and changed_fields = '{availability}'
    and old_value ->> 'availability' = 'AVAILABLE' and new_value ->> 'availability' = 'PRE_ORDER'
), 'alteração de disponibilidade é registrada');

-- Publicação e despublicação
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'products' and entity_id = 'eeeeeeee-0000-4000-8000-000000000002' and operation = 'UNPUBLISH'
), 'despublicação é registrada como UNPUBLISH');
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'products' and entity_id = 'eeeeeeee-0000-4000-8000-000000000002' and operation = 'PUBLISH'
    and actor_user_id = 'aaaaaaaa-0000-4000-8000-000000000002'
), 'publicação é registrada como PUBLISH');

-- Exclusão lógica e restauração
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'products' and entity_id = 'eeeeeeee-0000-4000-8000-000000000001' and operation = 'SOFT_DELETE'
    and new_value ->> 'deleted_by' = 'aaaaaaaa-0000-4000-8000-000000000002'
), 'exclusão lógica é registrada como SOFT_DELETE');
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'products' and entity_id = 'eeeeeeee-0000-4000-8000-000000000001' and operation = 'RESTORE'
), 'restauração é registrada como RESTORE');

-- Configurações usam a chave como identificador.
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'site_settings' and entity_id = 'seo' and operation = 'UPDATE'
), 'alteração de configuração é registrada pela chave');

-- Só os campos alterados são guardados; metadados de atualização ficam fora.
select ok(not exists (
  select 1 from public.audit_logs
  where operation = 'UPDATE' and ('updated_at' = any (changed_fields) or new_value ? 'updated_at')
), 'UPDATE não registra updated_at/updated_by como mudança');

-- Atualização sem mudança real não gera ruído.
select is(
  (select count(*)::int from (
     select 1 from public.audit_logs where entity_id = 'cccccccc-0000-4000-8000-000000000020') t),
  1, 'antes do no-op existe um registro da categoria');
update public.categories set name = name where id = 'cccccccc-0000-4000-8000-000000000020';
select is(
  (select count(*)::int from public.audit_logs where entity_id = 'cccccccc-0000-4000-8000-000000000020'),
  1, 'UPDATE sem mudança não gera registro');

-- Ação sem usuário (sistema) é marcada como tal.
update public.contacts set role = 'Atualizado pelo sistema' where id = '88888888-0000-4000-8000-000000000002';
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'contacts' and entity_id = '88888888-0000-4000-8000-000000000002'
    and operation = 'UPDATE' and changed_fields = '{role}'
    and source = 'system' and actor_user_id is null
), 'alteração sem usuário é registrada com origem system');

-- A auditoria é imutável via API, mesmo para OWNER.
set local role authenticated;
set local request.jwt.claims to '{"sub": "aaaaaaaa-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.audit_logs (source, entity_type, entity_id, operation) values ('admin', 'x', 'x', 'INSERT') $$,
  '42501', null, 'OWNER não insere na auditoria');
select throws_ok(
  $$ update public.audit_logs set entity_type = 'adulterado' $$,
  '42501', null, 'OWNER não altera a auditoria');
select throws_ok(
  $$ delete from public.audit_logs $$,
  '42501', null, 'OWNER não apaga a auditoria');

-- Mudança de papel feita pelo OWNER é auditada com o id do usuário afetado.
update public.admin_profiles set role = 'CONTENT_EDITOR' where user_id = 'aaaaaaaa-0000-4000-8000-000000000003';
reset role;
set local request.jwt.claims to '';
select ok(exists (
  select 1 from public.audit_logs
  where entity_type = 'admin_profiles' and entity_id = 'aaaaaaaa-0000-4000-8000-000000000003'
    and old_value ->> 'role' = 'CATALOG_MANAGER' and new_value ->> 'role' = 'CONTENT_EDITOR'
    and actor_role = 'OWNER'
), 'mudança de papel é auditada');

select * from finish();
rollback;
