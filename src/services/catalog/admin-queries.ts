import "server-only";

import { type PublicationAggregate } from "@/lib/catalog/publication";

import { type CatalogClient } from "./mutations/shared";

/**
 * Leituras com a sessão do administrador usadas pelas regras de escrita.
 * A RLS dá ao staff a visão completa (inclui rascunhos e excluídos).
 */
export async function getPublicationAggregate(
  client: CatalogClient,
  productId: string,
): Promise<
  | { ok: true; data: PublicationAggregate | null }
  | { ok: false; error: { code?: string; message?: string } }
> {
  const { data, error } = await client
    .from("products")
    .select(
      "id, category:categories(is_active, deleted_at), family:product_families(deleted_at), variants:product_variants(availability, deleted_at), media:product_media(slot, variant_id, asset:media_assets(deleted_at))",
    )
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return { ok: false, error };
  if (!data) return { ok: true, data: null };

  const main = data.media.find(
    (item) => item.slot === "MAIN" && item.variant_id === null,
  );
  return {
    ok: true,
    data: {
      category: {
        isActive: data.category?.is_active ?? false,
        isDeleted: data.category?.deleted_at != null,
      },
      family: { isDeleted: data.family?.deleted_at != null },
      variants: data.variants.map((variant) => ({
        availability: variant.availability,
        isDeleted: variant.deleted_at !== null,
      })),
      mainImage: main ? { assetDeleted: main.asset?.deleted_at != null } : null,
    },
  };
}
