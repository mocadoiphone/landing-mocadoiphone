-- =============================================================================
-- 01 · Fundação: schema privado, enums e triggers utilitários
-- Reversão: drop schema app cascade; drop type <enums> (sem dados ainda).
-- =============================================================================

-- Schema interno para funções de RLS e triggers. Não está em `api.schemas`,
-- então não é exposto pela API (PostgREST).
create schema if not exists app;
comment on schema app is 'Funções internas (RLS, triggers, regras). Não exposto pela API.';
revoke all on schema app from public;
grant usage on schema app to anon, authenticated, service_role;
-- Funções criadas no schema nascem sem EXECUTE para PUBLIC: cada uso é concedido explicitamente.
alter default privileges in schema app revoke execute on functions from public;

-- Enums: só para estados de domínio reaproveitados em mais de um lugar
-- ou expostos como tipos no TypeScript. Listas locais usam CHECK.
create type public.admin_role as enum ('OWNER', 'ADMIN', 'CATALOG_MANAGER', 'CONTENT_EDITOR');
comment on type public.admin_role is 'Perfis administrativos (Brain §23).';

create type public.publication_status as enum ('DRAFT', 'REVIEWED', 'PUBLISHED');
comment on type public.publication_status is 'Status de publicação do produto (Brain §35, MDI-D006).';

create type public.availability_status as enum (
  'AVAILABLE', 'PRE_ORDER', 'ON_REQUEST', 'OUT_OF_STOCK', 'DISCONTINUED', 'HIDDEN'
);
comment on type public.availability_status is 'Disponibilidade da variante (Brain §12, MDI-D006).';

create type public.media_kind as enum ('IMAGE', 'VIDEO');

create type public.content_block_type as enum (
  'HERO_PRODUCT', 'PRODUCT_STORY', 'PRODUCT_GRID', 'CATEGORY_GRID', 'FULLSCREEN_MEDIA',
  'TEXT_AND_MEDIA', 'FEATURES', 'PROMO_BANNER', 'STORE', 'REVIEWS', 'CTA'
);
comment on type public.content_block_type is 'Tipos de bloco predefinidos (Brain §19, MDI-D009).';

create type public.section_theme as enum ('LIGHT', 'DARK');

create type public.audit_operation as enum (
  'INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'PUBLISH', 'UNPUBLISH'
);

-- -----------------------------------------------------------------------------
-- Metadados de linha: datas e autoria são sempre definidas pelo banco.
-- O cliente não consegue forjar created_by/updated_by nem alterar created_at.
-- -----------------------------------------------------------------------------
create function app.set_row_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

-- Soft delete (Brain §25, MDI-D010): deleted_by e o instante da exclusão vêm do banco.
create function app.set_soft_delete_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.deleted_at := null;
    new.deleted_by := null;
  elsif new.deleted_at is not null and old.deleted_at is null then
    new.deleted_at := now();
    new.deleted_by := auth.uid();
  elsif new.deleted_at is not null then
    new.deleted_at := old.deleted_at;
    new.deleted_by := old.deleted_by;
  else
    new.deleted_by := null;
  end if;
  return new;
end;
$$;

-- Impede mover um registro filho para outro produto.
create function app.prevent_product_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.product_id is distinct from old.product_id then
    raise exception 'O produto de um registro vinculado não pode ser alterado.'
      using errcode = 'P0001', hint = 'immutable:product_id';
  end if;
  return new;
end;
$$;

revoke all on all functions in schema app from public;
