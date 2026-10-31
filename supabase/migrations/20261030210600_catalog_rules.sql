-- =============================================================================
-- 07 · Regras do catálogo (MDI-D005, MDI-D006)
-- - price_from derivado das variantes, somente leitura para o cliente;
-- - published_at controlado pelo banco;
-- - publicação exige pré-requisitos;
-- - definição única de "público" usada pelas políticas RLS.
-- Reversão: drop dos triggers e funções app.* criados aqui.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Visibilidade pública (fonte única para RLS e para regras de mídia).
-- -----------------------------------------------------------------------------
create function app.is_category_public(p_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.categories c
    where c.id = p_category_id and c.is_active and c.deleted_at is null
  )
$$;

create function app.is_product_public(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    join public.product_families f on f.id = p.family_id
    where p.id = p_product_id
      and p.status = 'PUBLISHED'
      and p.published_at <= now()
      and p.deleted_at is null
      and f.deleted_at is null
      and app.is_category_public(p.category_id)
  )
$$;

create function app.is_variant_public(p_variant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.product_variants v
    where v.id = p_variant_id
      and v.deleted_at is null
      and v.availability <> 'HIDDEN'
      and app.is_product_public(v.product_id)
  )
$$;

revoke all on function app.is_category_public(uuid), app.is_product_public(uuid), app.is_variant_public(uuid) from public;
grant execute on function app.is_category_public(uuid), app.is_product_public(uuid), app.is_variant_public(uuid)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Pré-requisitos de publicação (validados também no servidor, com mensagem amigável).
-- -----------------------------------------------------------------------------
create function app.assert_product_publishable(p_product_id uuid, p_category_id uuid, p_family_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app.is_category_public(p_category_id) then
    raise exception 'Produto não pode ser publicado: a categoria está inativa ou excluída.'
      using errcode = 'P0001', hint = 'publish:category_inactive';
  end if;

  if not exists (
    select 1 from public.product_families f where f.id = p_family_id and f.deleted_at is null
  ) then
    raise exception 'Produto não pode ser publicado: a família foi excluída.'
      using errcode = 'P0001', hint = 'publish:family_deleted';
  end if;

  if not exists (
    select 1 from public.product_variants v
    where v.product_id = p_product_id and v.deleted_at is null and v.availability <> 'HIDDEN'
  ) then
    raise exception 'Produto não pode ser publicado: cadastre ao menos uma variante visível.'
      using errcode = 'P0001', hint = 'publish:no_visible_variant';
  end if;

  if not exists (
    select 1
    from public.product_media m
    join public.media_assets a on a.id = m.media_asset_id
    where m.product_id = p_product_id
      and m.variant_id is null
      and m.slot = 'MAIN'
      and a.deleted_at is null
  ) then
    raise exception 'Produto não pode ser publicado: defina a imagem principal.'
      using errcode = 'P0001', hint = 'publish:no_main_image';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Trigger de escrita em products: protege price_from e published_at.
-- -----------------------------------------------------------------------------
create function app.products_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.price_from := null;
    new.published_at := null;
    if new.status = 'PUBLISHED' then
      perform app.assert_product_publishable(new.id, new.category_id, new.family_id);
    end if;
    return new;
  end if;

  -- price_from só muda pelo recálculo interno (disparado das variantes, profundidade > 1).
  if pg_trigger_depth() <= 1 then
    new.price_from := old.price_from;
  end if;

  -- published_at registra a primeira publicação e não aceita valor do cliente.
  new.published_at := old.published_at;
  if new.status = 'PUBLISHED' and old.status <> 'PUBLISHED' then
    perform app.assert_product_publishable(new.id, new.category_id, new.family_id);
    new.published_at := coalesce(old.published_at, now());
  end if;

  return new;
end;
$$;

create trigger products_before_write
  before insert or update on public.products
  for each row execute function app.products_before_write();

-- -----------------------------------------------------------------------------
-- Recalcula price_from = menor preço à vista entre variantes vendáveis.
-- Fora do cálculo: excluídas, HIDDEN, DISCONTINUED, "consulte valores" e sem preço.
-- -----------------------------------------------------------------------------
create function app.refresh_product_price_from(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  lowest_price integer;
begin
  select min(v.price_cash) into lowest_price
  from public.product_variants v
  where v.product_id = p_product_id
    and v.deleted_at is null
    and v.availability not in ('HIDDEN', 'DISCONTINUED')
    and not v.price_on_request
    and v.price_cash is not null;

  update public.products
  set price_from = lowest_price
  where id = p_product_id
    and price_from is distinct from lowest_price;
end;
$$;

create function app.on_variant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.refresh_product_price_from(coalesce(new.product_id, old.product_id));
  return null;
end;
$$;

create trigger refresh_product_price_from
  after insert or update or delete on public.product_variants
  for each row execute function app.on_variant_change();

-- -----------------------------------------------------------------------------
-- Slot de mídia compatível com o tipo do arquivo (VIDEO ↔ vídeo; demais ↔ imagem).
-- -----------------------------------------------------------------------------
create function app.check_product_media_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset_kind public.media_kind;
begin
  select a.kind into asset_kind from public.media_assets a where a.id = new.media_asset_id;

  if (new.slot = 'VIDEO') <> (asset_kind = 'VIDEO') then
    raise exception 'O slot % não aceita mídia do tipo %.', new.slot, asset_kind
      using errcode = 'P0001', hint = 'media:slot_kind_mismatch';
  end if;
  return new;
end;
$$;

create trigger check_product_media_kind
  before insert or update on public.product_media
  for each row execute function app.check_product_media_kind();
