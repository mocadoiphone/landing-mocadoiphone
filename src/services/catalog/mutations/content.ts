import "server-only";

import { type CatalogResult, notFound, success } from "@/lib/catalog/result";
import {
  type IdInput,
  type ProductMediaLinkInput,
  type ProductMediaUpdateInput,
  type ReorderProductMediaInput,
  type ReorderSpecsInput,
  type SpecCreateInput,
  type SpecUpdateInput,
} from "@/lib/catalog/schemas";

import {
  applyReorder,
  type CatalogClient,
  dbFailure,
  definedOnly,
  isEmpty,
  nextOrder,
  nothingToUpdate,
} from "./shared";

/**
 * Conteúdo filho do produto: especificações e vínculos de mídia (Brain §17,
 * abas Conteúdo e Mídia). Exclusão física, sempre auditada (MDI-D010).
 */

// -----------------------------------------------------------------------------
// Especificações
// -----------------------------------------------------------------------------
type SavedSpec = { id: string; product_id: string };

export async function createSpec(
  client: CatalogClient,
  input: SpecCreateInput,
): Promise<CatalogResult<SavedSpec>> {
  const last = await client
    .from("product_specs")
    .select("sort_order")
    .eq("product_id", input.productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("product_specs")
    .insert({
      product_id: input.productId,
      group_name: input.groupName ?? null,
      label: input.label,
      value: input.value,
      sort_order: nextOrder(last.data),
    })
    .select("id, product_id")
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

export async function updateSpec(
  client: CatalogClient,
  input: SpecUpdateInput,
): Promise<CatalogResult<SavedSpec>> {
  const values = definedOnly({
    group_name: input.groupName,
    label: input.label,
    value: input.value,
  });
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("product_specs")
    .update(values)
    .eq("id", input.id)
    .select("id, product_id")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function deleteSpec(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedSpec>> {
  const { data, error } = await client
    .from("product_specs")
    .delete()
    .eq("id", input.id)
    .select("id, product_id")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function reorderSpecs(
  client: CatalogClient,
  input: ReorderSpecsInput,
): Promise<CatalogResult<{ updated: number }>> {
  const current = await client
    .from("product_specs")
    .select("id, sort_order")
    .eq("product_id", input.productId);
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("product_specs")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .eq("product_id", input.productId)
      .select("id")
      .maybeSingle(),
  );
}

// -----------------------------------------------------------------------------
// Vínculos de mídia (o arquivo vem da biblioteca `media_assets`)
// -----------------------------------------------------------------------------
type SavedProductMedia = { id: string; product_id: string; slot: string };

const MEDIA_RETURNING = "id, product_id, slot";

/**
 * Vincula uma mídia da biblioteca ao produto (ou a uma variante dele).
 * O banco garante: uma principal e uma mobile por produto/variante, slot
 * compatível com o tipo e mídia não excluída.
 */
export async function linkProductMedia(
  client: CatalogClient,
  input: ProductMediaLinkInput,
): Promise<CatalogResult<SavedProductMedia>> {
  const variantId = input.variantId ?? null;
  let lastQuery = client
    .from("product_media")
    .select("sort_order")
    .eq("product_id", input.productId)
    .eq("slot", input.slot);
  lastQuery =
    variantId === null
      ? lastQuery.is("variant_id", null)
      : lastQuery.eq("variant_id", variantId);
  const last = await lastQuery
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("product_media")
    .insert({
      product_id: input.productId,
      media_asset_id: input.mediaAssetId,
      slot: input.slot,
      variant_id: variantId,
      alt_text: input.altText ?? null,
      sort_order: nextOrder(last.data),
    })
    .select(MEDIA_RETURNING)
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

/** Troca o arquivo de uma posição (ex.: nova imagem principal) e/ou o alt próprio. */
export async function updateProductMedia(
  client: CatalogClient,
  input: ProductMediaUpdateInput,
): Promise<CatalogResult<SavedProductMedia>> {
  const values = definedOnly({
    media_asset_id: input.mediaAssetId,
    alt_text: input.altText,
  });
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("product_media")
    .update(values)
    .eq("id", input.id)
    .select(MEDIA_RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Remove o vínculo (o arquivo continua na biblioteca). */
export async function unlinkProductMedia(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedProductMedia>> {
  const { data, error } = await client
    .from("product_media")
    .delete()
    .eq("id", input.id)
    .select(MEDIA_RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function reorderProductMedia(
  client: CatalogClient,
  input: ReorderProductMediaInput,
): Promise<CatalogResult<{ updated: number }>> {
  const variantId = input.variantId ?? null;
  let currentQuery = client
    .from("product_media")
    .select("id, sort_order")
    .eq("product_id", input.productId)
    .eq("slot", input.slot);
  currentQuery =
    variantId === null
      ? currentQuery.is("variant_id", null)
      : currentQuery.eq("variant_id", variantId);
  const current = await currentQuery;
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("product_media")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .eq("product_id", input.productId)
      .select("id")
      .maybeSingle(),
  );
}
