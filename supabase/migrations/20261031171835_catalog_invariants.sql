-- =============================================================================
-- 15 · Invariantes do catálogo e privilégios de funções (MDI-D022, MDI-D023)
-- L1 Variante padrão: a primeira variante visível vira padrão; a troca é
--    atômica por public.set_default_variant (RLS vale: SECURITY INVOKER).
-- L2 Produto publicado mantém variante visível e imagem principal (a D006 só
--    era verificada na transição para PUBLISHED). Mídia excluída não é vinculada.
-- L3 Categoria e família só são excluídas sem filhos ativos.
-- L4 Funções de `app` sem EXECUTE para PUBLIC: o `alter default privileges ...
--    in schema app` da migration 01 não remove o padrão global do PostgreSQL.
-- Reversão: drop dos triggers e das funções criados aqui; restaurar
--   app.check_product_media_kind da migration 07; drop function
--   public.set_default_variant(uuid); alter default privileges for role postgres
--   grant execute on functions to public.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- L1 · Variante padrão
-- -----------------------------------------------------------------------------
create function app.ensure_default_variant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_default
     and new.availability <> 'HIDDEN'
     and not exists (
       select 1 from public.product_variants v
       where v.product_id = new.product_id and v.is_default and v.deleted_at is null
     ) then
    new.is_default := true;
  end if;
  return new;
end;
$$;

create trigger ensure_default_variant
  before insert on public.product_variants
  for each row execute function app.ensure_default_variant();

-- Troca a variante padrão em uma única transação. SECURITY INVOKER: só quem pode
-- editar variantes pela RLS consegue trocar; auth.uid() chega à auditoria.
create function public.set_default_variant(p_variant_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_product_id uuid;
begin
  select v.product_id into target_product_id
  from public.product_variants v
  where v.id = p_variant_id and v.deleted_at is null and v.availability <> 'HIDDEN';

  if target_product_id is null then
    raise exception 'Só uma variante visível e não excluída pode ser a padrão.'
      using errcode = 'P0001', hint = 'variant:default_unavailable';
  end if;

  update public.product_variants
  set is_default = false
  where product_id = target_product_id and is_default and id <> p_variant_id;

  update public.product_variants
  set is_default = true
  where id = p_variant_id and not is_default;

  -- A RLS não gera erro em UPDATE: só filtra. Sem permissão, nada muda.
  if not exists (
    select 1 from public.product_variants v where v.id = p_variant_id and v.is_default
  ) then
    raise exception 'Sem permissão para alterar a variante padrão.'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.set_default_variant(uuid) from public, anon, service_role;
grant execute on function public.set_default_variant(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- L2 · Produto publicado mantém os pré-requisitos de publicação
-- -----------------------------------------------------------------------------
create function app.guard_published_variant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.deleted_at is null
     and old.availability <> 'HIDDEN'
     and (
       (new.deleted_at is not null)
       or (new.availability = 'HIDDEN')
     )
     and exists (
       select 1 from public.products p
       where p.id = old.product_id and p.status = 'PUBLISHED' and p.deleted_at is null
     )
     and not exists (
       select 1 from public.product_variants v
       where v.product_id = old.product_id
         and v.id <> old.id
         and v.deleted_at is null
         and v.availability <> 'HIDDEN'
     ) then
    raise exception 'Produto publicado precisa de ao menos uma variante visível. Despublique o produto antes de ocultar ou excluir a última variante.'
      using errcode = 'P0001', hint = 'publish:last_visible_variant';
  end if;
  return new;
end;
$$;

create trigger guard_published_variant
  before update on public.product_variants
  for each row execute function app.guard_published_variant();

create function app.guard_published_main_image()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.slot = 'MAIN'
     and old.variant_id is null
     and (tg_op = 'DELETE' or new.slot <> 'MAIN' or new.variant_id is not null)
     and exists (
       select 1 from public.products p
       where p.id = old.product_id and p.status = 'PUBLISHED' and p.deleted_at is null
     ) then
    raise exception 'Produto publicado precisa de imagem principal. Troque a imagem em vez de removê-la, ou despublique o produto antes.'
      using errcode = 'P0001', hint = 'publish:last_main_image';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger guard_published_main_image
  before update or delete on public.product_media
  for each row execute function app.guard_published_main_image();

-- Slot compatível com o tipo do arquivo e mídia não excluída (substitui a versão da migration 07).
create or replace function app.check_product_media_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset_kind public.media_kind;
  asset_deleted boolean;
begin
  select a.kind, a.deleted_at is not null into asset_kind, asset_deleted
  from public.media_assets a
  where a.id = new.media_asset_id;

  if asset_deleted then
    raise exception 'Esta mídia foi excluída e não pode ser vinculada.'
      using errcode = 'P0001', hint = 'media:deleted';
  end if;

  if (new.slot = 'VIDEO') <> (asset_kind = 'VIDEO') then
    raise exception 'O slot % não aceita mídia do tipo %.', new.slot, asset_kind
      using errcode = 'P0001', hint = 'media:slot_kind_mismatch';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- L3 · Categoria e família só são excluídas sem filhos ativos
-- -----------------------------------------------------------------------------
create function app.guard_category_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null
     and (
       exists (
         select 1 from public.product_families f
         where f.category_id = old.id and f.deleted_at is null
       )
       or exists (
         select 1 from public.products p
         where p.category_id = old.id and p.deleted_at is null
       )
     ) then
    raise exception 'A categoria tem famílias ou produtos ativos. Mova ou exclua esses itens antes de excluir a categoria.'
      using errcode = 'P0001', hint = 'catalog:category_not_empty';
  end if;
  return new;
end;
$$;

create trigger guard_category_soft_delete
  before update on public.categories
  for each row execute function app.guard_category_soft_delete();

create function app.guard_family_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null
     and exists (
       select 1 from public.products p
       where p.family_id = old.id and p.deleted_at is null
     ) then
    raise exception 'A família tem produtos ativos. Mova ou exclua esses produtos antes de excluir a família.'
      using errcode = 'P0001', hint = 'catalog:family_not_empty';
  end if;
  return new;
end;
$$;

create trigger guard_family_soft_delete
  before update on public.product_families
  for each row execute function app.guard_family_soft_delete();

-- -----------------------------------------------------------------------------
-- L4 · Funções nascem e permanecem sem EXECUTE para PUBLIC
-- -----------------------------------------------------------------------------
-- Padrão global (sem IN SCHEMA): só ele remove o EXECUTE implícito de PUBLIC.
alter default privileges for role postgres revoke execute on functions from public;

-- Funções já existentes em `app` (inclui as criadas acima). Os grants explícitos
-- a anon/authenticated das funções usadas pela RLS continuam valendo.
revoke execute on all functions in schema app from public;
