-- =============================================================================
-- 16 · Painel administrativo (MDI-D027)
-- Funções que o painel precisa e que a API não oferece com segurança sozinha:
-- - list_admin_users: perfis + e-mail e último acesso (auth.users), só OWNER/ADMIN;
-- - grant_admin_profile: o OWNER concede perfil a um login já criado no
--   Dashboard (sem service_role, sem convite por e-mail);
-- - set_default_contact: troca atômica do contato padrão (índice único parcial).
-- Funções novas (sem `or replace`): se já existirem, é drift e o push deve falhar.
-- Reversão: drop function public.list_admin_users(),
--   public.grant_admin_profile(text, text, public.admin_role),
--   public.set_default_contact(uuid).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Administradores com e-mail (dado pessoal: só OWNER e ADMIN veem)
-- -----------------------------------------------------------------------------
create function public.list_admin_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  role public.admin_role,
  is_active boolean,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app.has_role('OWNER', 'ADMIN') then
    raise exception 'Sem permissão para listar administradores.'
      using errcode = '42501';
  end if;

  return query
    select p.user_id, u.email::text, p.display_name, p.role, p.is_active,
           u.last_sign_in_at, p.created_at
    from public.admin_profiles p
    join auth.users u on u.id = p.user_id
    order by p.is_active desc, p.display_name;
end;
$$;

revoke all on function public.list_admin_users() from public, anon, service_role;
grant execute on function public.list_admin_users() to authenticated;

-- -----------------------------------------------------------------------------
-- Conceder perfil a um login existente (só OWNER)
-- O login é criado pelo responsável em Authentication → Users. Trocar papel ou
-- desativar continua pela edição normal (RLS + travas de admin_profiles).
-- -----------------------------------------------------------------------------
create function public.grant_admin_profile(
  p_email text,
  p_display_name text,
  p_role public.admin_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  is_confirmed boolean;
begin
  if not app.has_role('OWNER') then
    raise exception 'Só o proprietário (OWNER) pode conceder acesso ao painel.'
      using errcode = '42501';
  end if;

  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 120 then
    raise exception 'Informe o nome de exibição (até 120 caracteres).'
      using errcode = 'P0001', hint = 'admin:invalid_name';
  end if;

  select u.id, u.email_confirmed_at is not null
  into target_user_id, is_confirmed
  from auth.users u
  where lower(u.email) = lower(btrim(p_email)) and u.deleted_at is null;

  if target_user_id is null then
    raise exception 'Não existe login com este e-mail. Crie o usuário em Authentication → Users e tente de novo.'
      using errcode = 'P0001', hint = 'admin:user_not_found';
  end if;

  if not is_confirmed then
    raise exception 'O login deste e-mail ainda não foi confirmado. Confirme o usuário no Dashboard e tente de novo.'
      using errcode = 'P0001', hint = 'admin:user_not_confirmed';
  end if;

  if exists (select 1 from public.admin_profiles p where p.user_id = target_user_id) then
    raise exception 'Este usuário já tem perfil no painel. Altere o papel na lista de usuários.'
      using errcode = 'P0001', hint = 'admin:profile_exists';
  end if;

  -- Autoria e auditoria vêm de auth.uid() (o OWNER que concedeu).
  insert into public.admin_profiles (user_id, display_name, role)
  values (target_user_id, btrim(p_display_name), p_role);

  return target_user_id;
end;
$$;

revoke all on function public.grant_admin_profile(text, text, public.admin_role) from public, anon, service_role;
grant execute on function public.grant_admin_profile(text, text, public.admin_role) to authenticated;

-- -----------------------------------------------------------------------------
-- Contato padrão (MDI-D012): troca atômica. SECURITY INVOKER: a RLS de
-- contacts (OWNER/ADMIN) decide quem pode trocar.
-- -----------------------------------------------------------------------------
create function public.set_default_contact(p_contact_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.contacts c
    where c.id = p_contact_id and c.is_active and c.deleted_at is null
  ) then
    raise exception 'Só um contato ativo pode ser o padrão.'
      using errcode = 'P0001', hint = 'contact:default_unavailable';
  end if;

  update public.contacts
  set is_default = false
  where is_default and id <> p_contact_id;

  update public.contacts
  set is_default = true
  where id = p_contact_id and not is_default;

  -- A RLS não gera erro em UPDATE: só filtra. Sem permissão, nada muda.
  if not exists (
    select 1 from public.contacts c where c.id = p_contact_id and c.is_default
  ) then
    raise exception 'Sem permissão para alterar o contato padrão.'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.set_default_contact(uuid) from public, anon, service_role;
grant execute on function public.set_default_contact(uuid) to authenticated;
