import "server-only";

import { type CatalogResult, notFound, success } from "@/lib/catalog/result";
import {
  type IdInput,
  type ReorderVariantsInput,
  type VariantCreateInput,
  type VariantUpdateInput,
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

type SavedVariant = { id: string; product_id: string; is_default: boolean };

const RETURNING = "id, product_id, is_default";

function variantColumns(input: Omit<VariantUpdateInput, "id">) {
  return definedOnly({
    sku: input.sku,
    storage: input.storage,
    color_name: input.colorName,
    color_hex: input.colorHex,
    price_cash: input.priceCash,
    price_old: input.priceOld,
    price_installment: input.priceInstallment,
    installments: input.installments,
    installment_text: input.installmentText,
    price_on_request: input.priceOnRequest,
    availability: input.availability,
  });
}

/** A primeira variante visível vira a padrão automaticamente (MDI-D022). */
export async function createVariant(
  client: CatalogClient,
  input: VariantCreateInput,
): Promise<CatalogResult<SavedVariant>> {
  const last = await client
    .from("product_variants")
    .select("sort_order")
    .eq("product_id", input.productId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("product_variants")
    .insert({
      ...variantColumns(input),
      product_id: input.productId,
      sort_order: nextOrder(last.data),
    })
    .select(RETURNING)
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

/**
 * Preço e disponibilidade (Brain §11, §12). Ocultar a última variante visível de
 * produto publicado é bloqueado pelo banco (MDI-D022).
 */
export async function updateVariant(
  client: CatalogClient,
  input: VariantUpdateInput,
): Promise<CatalogResult<SavedVariant>> {
  const values = variantColumns(input);
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("product_variants")
    .update(values)
    .eq("id", input.id)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Troca atômica da variante padrão (função do banco, com RLS). */
export async function setDefaultVariant(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<{ id: string }>> {
  const { error } = await client.rpc("set_default_variant", {
    p_variant_id: input.id,
  });
  if (error) return dbFailure(error);
  return success({ id: input.id });
}

export async function softDeleteVariant(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedVariant>> {
  const { data, error } = await client
    .from("product_variants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function restoreVariant(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedVariant>> {
  const { data, error } = await client
    .from("product_variants")
    .update({ deleted_at: null })
    .eq("id", input.id)
    .not("deleted_at", "is", null)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function reorderVariants(
  client: CatalogClient,
  input: ReorderVariantsInput,
): Promise<CatalogResult<{ updated: number }>> {
  const current = await client
    .from("product_variants")
    .select("id, sort_order")
    .eq("product_id", input.productId)
    .is("deleted_at", null);
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("product_variants")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .eq("product_id", input.productId)
      .select("id")
      .maybeSingle(),
  );
}
