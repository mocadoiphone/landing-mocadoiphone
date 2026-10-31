import "server-only";

import {
  type CatalogResult,
  failure,
  notFound,
  success,
} from "@/lib/catalog/result";
import {
  type CategoryCreateInput,
  type CategoryUpdateInput,
  type FamilyCreateInput,
  type FamilyUpdateInput,
  type IdInput,
  type ReorderCategoriesInput,
  type ReorderFamiliesInput,
} from "@/lib/catalog/schemas";
import { SLUG_MAX_LENGTH, slugify } from "@/lib/slug/slug";

import {
  applyReorder,
  type CatalogClient,
  dbFailure,
  definedOnly,
  isEmpty,
  nextOrder,
  nothingToUpdate,
} from "./shared";

type Saved = { id: string; slug: string };

function missingSlug<T>(): CatalogResult<T> {
  return failure({
    code: "validation",
    field: "slug",
    message: "Informe um endereço (slug): o nome não gera um endereço válido.",
  });
}

// -----------------------------------------------------------------------------
// Categorias (Brain §8; nascem inativas, MDI-D018)
// -----------------------------------------------------------------------------
export async function createCategory(
  client: CatalogClient,
  input: CategoryCreateInput,
): Promise<CatalogResult<Saved>> {
  const slug = input.slug ?? slugify(input.name, SLUG_MAX_LENGTH.category);
  if (!slug) return missingSlug();

  const last = await client
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("categories")
    .insert({
      name: input.name,
      slug,
      description: input.description ?? null,
      image_asset_id: input.imageAssetId ?? null,
      is_active: input.isActive ?? false,
      sort_order: nextOrder(last.data),
    })
    .select("id, slug")
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

export async function updateCategory(
  client: CatalogClient,
  input: CategoryUpdateInput,
): Promise<CatalogResult<Saved>> {
  const values = definedOnly({
    name: input.name,
    slug: input.slug,
    description: input.description,
    image_asset_id: input.imageAssetId,
    is_active: input.isActive,
  });
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("categories")
    .update(values)
    .eq("id", input.id)
    .select("id, slug")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Bloqueada pelo banco se houver famílias ou produtos ativos (MDI-D022). */
export async function softDeleteCategory(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<Saved>> {
  const { data, error } = await client
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select("id, slug")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function restoreCategory(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<Saved>> {
  const { data, error } = await client
    .from("categories")
    .update({ deleted_at: null })
    .eq("id", input.id)
    .not("deleted_at", "is", null)
    .select("id, slug")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function reorderCategories(
  client: CatalogClient,
  input: ReorderCategoriesInput,
): Promise<CatalogResult<{ updated: number }>> {
  const current = await client
    .from("categories")
    .select("id, sort_order")
    .is("deleted_at", null);
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("categories")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .select("id")
      .maybeSingle(),
  );
}

// -----------------------------------------------------------------------------
// Famílias (Brain §8; slug único dentro da categoria)
// -----------------------------------------------------------------------------
export async function createFamily(
  client: CatalogClient,
  input: FamilyCreateInput,
): Promise<CatalogResult<Saved>> {
  const slug = input.slug ?? slugify(input.name, SLUG_MAX_LENGTH.family);
  if (!slug) return missingSlug();

  const last = await client
    .from("product_families")
    .select("sort_order")
    .eq("category_id", input.categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("product_families")
    .insert({
      category_id: input.categoryId,
      name: input.name,
      slug,
      sort_order: nextOrder(last.data),
    })
    .select("id, slug")
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

export async function updateFamily(
  client: CatalogClient,
  input: FamilyUpdateInput,
): Promise<CatalogResult<Saved>> {
  const values = definedOnly({ name: input.name, slug: input.slug });
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("product_families")
    .update(values)
    .eq("id", input.id)
    .select("id, slug")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Bloqueada pelo banco se houver produtos ativos (MDI-D022). */
export async function softDeleteFamily(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<Saved>> {
  const { data, error } = await client
    .from("product_families")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select("id, slug")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function restoreFamily(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<Saved>> {
  const { data, error } = await client
    .from("product_families")
    .update({ deleted_at: null })
    .eq("id", input.id)
    .not("deleted_at", "is", null)
    .select("id, slug")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function reorderFamilies(
  client: CatalogClient,
  input: ReorderFamiliesInput,
): Promise<CatalogResult<{ updated: number }>> {
  const current = await client
    .from("product_families")
    .select("id, sort_order")
    .eq("category_id", input.categoryId)
    .is("deleted_at", null);
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("product_families")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .eq("category_id", input.categoryId)
      .select("id")
      .maybeSingle(),
  );
}
