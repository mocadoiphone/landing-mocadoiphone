import "server-only";

import {
  describePublicationIssues,
  getPublicationIssues,
  PUBLICATION_ISSUE_MESSAGES,
} from "@/lib/catalog/publication";
import {
  type CatalogResult,
  failure,
  notFound,
  success,
} from "@/lib/catalog/result";
import {
  type IdInput,
  type ProductCreateInput,
  type ProductStatusInput,
  type ProductUpdateInput,
  type ReorderProductsInput,
} from "@/lib/catalog/schemas";
import { SLUG_MAX_LENGTH, slugify } from "@/lib/slug/slug";

import { getPublicationAggregate } from "../admin-queries";
import {
  applyReorder,
  type CatalogClient,
  dbFailure,
  definedOnly,
  isEmpty,
  nextOrder,
  nothingToUpdate,
} from "./shared";

type SavedProduct = { id: string; slug: string; status: string };

const RETURNING = "id, slug, status";

function productColumns(
  input: Omit<ProductUpdateInput, "id" | "categoryId" | "familyId">,
) {
  return definedOnly({
    name: input.name,
    slug: input.slug,
    short_description: input.shortDescription,
    description: input.description,
    badge: input.badge,
    is_featured: input.isFeatured,
    is_launch: input.isLaunch,
    is_promotion: input.isPromotion,
    related_product_id: input.relatedProductId,
    meta_title: input.metaTitle,
    meta_description: input.metaDescription,
    og_image_asset_id: input.ogImageAssetId,
    canonical_url: input.canonicalUrl,
  });
}

/** Todo produto nasce rascunho (Brain §35): nada é publicado automaticamente. */
export async function createProduct(
  client: CatalogClient,
  input: ProductCreateInput,
): Promise<CatalogResult<SavedProduct>> {
  const slug = input.slug ?? slugify(input.name, SLUG_MAX_LENGTH.product);
  if (!slug) {
    return failure({
      code: "validation",
      field: "slug",
      message:
        "Informe um endereço (slug): o nome não gera um endereço válido.",
    });
  }

  const last = await client
    .from("products")
    .select("sort_order")
    .eq("category_id", input.categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("products")
    .insert({
      ...productColumns(input),
      name: input.name,
      slug,
      category_id: input.categoryId,
      family_id: input.familyId,
      status: "DRAFT",
      sort_order: nextOrder(last.data),
    })
    .select(RETURNING)
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

/** Edição dos dados do produto. O status muda só por `setProductStatus`. */
export async function updateProduct(
  client: CatalogClient,
  input: ProductUpdateInput,
): Promise<CatalogResult<SavedProduct>> {
  const values = {
    ...productColumns(input),
    ...definedOnly({
      category_id: input.categoryId,
      family_id: input.familyId,
    }),
  };
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("products")
    .update(values)
    .eq("id", input.id)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/**
 * Publicar, revisar ou voltar a rascunho (MDI-D006). Publicar confere antes
 * todas as pendências, para uma mensagem completa; o banco continua garantindo.
 */
export async function setProductStatus(
  client: CatalogClient,
  input: ProductStatusInput,
): Promise<CatalogResult<SavedProduct>> {
  if (input.status === "PUBLISHED") {
    const aggregate = await getPublicationAggregate(client, input.id);
    if (!aggregate.ok) return dbFailure(aggregate.error);
    if (!aggregate.data) return notFound();

    const issues = getPublicationIssues(aggregate.data);
    if (issues.length > 0) {
      return failure({
        code: "rule",
        message: describePublicationIssues(issues),
        fieldErrors: {
          status: issues.map((issue) => PUBLICATION_ISSUE_MESSAGES[issue]),
        },
      });
    }
  }

  const { data, error } = await client
    .from("products")
    .update({ status: input.status })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function softDeleteProduct(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedProduct>> {
  const { data, error } = await client
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function restoreProduct(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedProduct>> {
  const { data, error } = await client
    .from("products")
    .update({ deleted_at: null })
    .eq("id", input.id)
    .not("deleted_at", "is", null)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Ordem dos produtos dentro da categoria (vale também para as vitrines). */
export async function reorderProducts(
  client: CatalogClient,
  input: ReorderProductsInput,
): Promise<CatalogResult<{ updated: number }>> {
  const current = await client
    .from("products")
    .select("id, sort_order")
    .eq("category_id", input.categoryId)
    .is("deleted_at", null);
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("products")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .eq("category_id", input.categoryId)
      .select("id")
      .maybeSingle(),
  );
}
