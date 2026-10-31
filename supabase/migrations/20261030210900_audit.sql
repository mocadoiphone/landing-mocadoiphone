-- =============================================================================
-- 10 · Auditoria (Brain §24; MDI-D010)
-- Registro append-only gravado por trigger no banco: não depende do front-end.
-- Operações: INSERT, UPDATE, DELETE, SOFT_DELETE, RESTORE, PUBLISH, UNPUBLISH.
-- Alteração de preço/disponibilidade = UPDATE com o campo em `changed_fields`
-- (ex.: changed_fields && '{price_cash,availability}').
-- Reversão: drop table public.audit_logs; drop function app.audit_row_change() cascade.
-- =============================================================================

create table public.audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- Sem FK: o histórico permanece mesmo se o usuário for removido.
  actor_user_id uuid,
  actor_role public.admin_role,
  source text not null check (source in ('admin', 'system', 'seed', 'bootstrap', 'migration')),
  entity_type text not null,
  entity_id text not null,
  operation public.audit_operation not null,
  changed_fields text[],
  old_value jsonb,
  new_value jsonb
);
alter table public.audit_logs enable row level security;
comment on table public.audit_logs is
  'Auditoria append-only. Em UPDATE guarda só os campos alterados. Escrita exclusiva do trigger app.audit_row_change.';

-- Histórico de um registro, "alterações recentes" do dashboard e ações por usuário.
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc)
  where actor_user_id is not null;

-- Argumento do trigger: nome da coluna de chave primária da tabela auditada.
create function app.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  changed text[];
  operation public.audit_operation;
  actor uuid := auth.uid();
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into changed
    from jsonb_each(new_row) n
    where n.value is distinct from old_row -> n.key
      and n.key not in ('updated_at', 'updated_by');

    -- Nada relevante mudou: não gera ruído no histórico.
    if changed is null then
      return null;
    end if;

    operation := case
      when old_row ? 'deleted_at' and old_row ->> 'deleted_at' is null and new_row ->> 'deleted_at' is not null
        then 'SOFT_DELETE'
      when old_row ? 'deleted_at' and old_row ->> 'deleted_at' is not null and new_row ->> 'deleted_at' is null
        then 'RESTORE'
      when tg_table_name = 'products' and old_row ->> 'status' <> 'PUBLISHED' and new_row ->> 'status' = 'PUBLISHED'
        then 'PUBLISH'
      when tg_table_name = 'products' and old_row ->> 'status' = 'PUBLISHED' and new_row ->> 'status' <> 'PUBLISHED'
        then 'UNPUBLISH'
      else 'UPDATE'
    end::public.audit_operation;

    -- Guarda apenas os campos alterados (antes e depois).
    select jsonb_object_agg(k, old_row -> k), jsonb_object_agg(k, new_row -> k)
    into old_row, new_row
    from unnest(changed) as k;
  else
    operation := tg_op::public.audit_operation;
  end if;

  insert into public.audit_logs (
    actor_user_id, actor_role, source, entity_type, entity_id,
    operation, changed_fields, old_value, new_value
  )
  values (
    actor,
    (select p.role from public.admin_profiles p where p.user_id = actor),
    coalesce(
      nullif(current_setting('app.audit_source', true), ''),
      case when actor is null then 'system' else 'admin' end
    ),
    tg_table_name,
    coalesce(to_jsonb(new), to_jsonb(old)) ->> tg_argv[0],
    operation,
    changed,
    old_row,
    new_row
  );

  return null;
end;
$$;

-- Tabelas auditadas.
create trigger audit_row_change after insert or update or delete on public.admin_profiles
  for each row execute function app.audit_row_change('user_id');
create trigger audit_row_change after insert or update or delete on public.media_assets
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.categories
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.product_families
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.products
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.product_variants
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.product_media
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.product_specs
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.homepage_sections
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.contacts
  for each row execute function app.audit_row_change('id');
create trigger audit_row_change after insert or update or delete on public.site_settings
  for each row execute function app.audit_row_change('key');
