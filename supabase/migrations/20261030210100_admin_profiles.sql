-- =============================================================================
-- 02 · Perfis administrativos (Brain §21 "admins", §23; MDI-D008)
-- Autenticação = auth.users do Supabase. Esta tabela só guarda o perfil.
-- Reversão: drop table public.admin_profiles cascade; drop das funções app.*role*.
-- =============================================================================

create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  role public.admin_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.admin_profiles enable row level security;
comment on table public.admin_profiles is
  'Perfil administrativo de um usuário de auth.users. Sem linha ativa aqui, o usuário não administra nada.';

create trigger set_row_metadata
  before insert or update on public.admin_profiles
  for each row execute function app.set_row_metadata();

-- -----------------------------------------------------------------------------
-- Helpers de autorização usados pelas políticas RLS.
-- SECURITY DEFINER: leem admin_profiles sem depender da RLS da própria tabela.
-- -----------------------------------------------------------------------------
create function app.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.admin_profiles p
  where p.user_id = (select auth.uid())
    and p.is_active
$$;

create function app.has_role(variadic roles public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_admin_role() = any (roles), false)
$$;

-- "Staff" = qualquer perfil administrativo ativo (lê rascunhos, não necessariamente escreve).
create function app.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.current_admin_role() is not null
$$;

revoke all on function app.current_admin_role(), app.has_role(public.admin_role[]), app.is_staff() from public;
grant execute on function app.current_admin_role(), app.has_role(public.admin_role[]), app.is_staff()
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Travas de integridade dos perfis.
-- -----------------------------------------------------------------------------
create function app.guard_admin_profiles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_owners integer;
begin
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then
    raise exception 'O usuário de um perfil não pode ser trocado.'
      using errcode = 'P0001', hint = 'admin:immutable_user';
  end if;

  -- Ninguém altera o próprio papel nem desativa a própria conta.
  if tg_op = 'UPDATE'
     and old.user_id = (select auth.uid())
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'Não é permitido alterar o próprio papel nem desativar a própria conta.'
      using errcode = '42501', hint = 'admin:self_change';
  end if;

  -- Sempre deve restar ao menos um OWNER ativo.
  if old.role = 'OWNER' and old.is_active
     and (tg_op = 'DELETE' or new.role <> 'OWNER' or not new.is_active) then
    select count(*) into remaining_owners
    from public.admin_profiles
    where role = 'OWNER' and is_active and user_id <> old.user_id;

    if remaining_owners = 0 then
      raise exception 'É necessário manter ao menos um OWNER ativo.'
        using errcode = 'P0001', hint = 'admin:last_owner';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger guard_admin_profiles
  before update or delete on public.admin_profiles
  for each row execute function app.guard_admin_profiles();

-- -----------------------------------------------------------------------------
-- Bootstrap do primeiro OWNER (Brain §23).
-- Uso: Dashboard → SQL Editor (executa como postgres):
--   select app.bootstrap_first_owner('email@dominio', 'Nome');
-- Só funciona enquanto não existir nenhum OWNER. Não é executável por
-- anon/authenticated e o schema app não é exposto pela API.
-- -----------------------------------------------------------------------------
create function app.bootstrap_first_owner(p_email text, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  previous_source text := current_setting('app.audit_source', true);
begin
  if exists (select 1 from public.admin_profiles where role = 'OWNER') then
    raise exception 'Já existe um OWNER. Gerencie administradores pelo painel.'
      using errcode = 'P0001', hint = 'admin:owner_exists';
  end if;

  select u.id into target_user_id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email));

  if target_user_id is null then
    raise exception 'Usuário % não encontrado. Crie-o antes em Authentication → Users.', p_email
      using errcode = 'P0001', hint = 'admin:user_not_found';
  end if;

  -- Marca só esta inserção como "bootstrap" na auditoria e restaura a origem anterior.
  perform set_config('app.audit_source', 'bootstrap', true);

  insert into public.admin_profiles (user_id, display_name, role)
  values (
    target_user_id,
    coalesce(nullif(btrim(p_display_name), ''), split_part(p_email, '@', 1)),
    'OWNER'
  );

  perform set_config('app.audit_source', coalesce(previous_source, ''), true);

  return target_user_id;
end;
$$;

revoke all on function app.bootstrap_first_owner(text, text) from public, anon, authenticated, service_role;
