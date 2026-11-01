import "server-only";

import {
  type BlockItem,
  type BlockLayout,
  type BlockType,
  type CtaSetting,
  type GridSource,
  parseBlockSettings,
  type SectionTheme,
} from "@/lib/home/blocks";
import { type MediaKind } from "@/lib/media/media";
import { type CatalogClient } from "@/services/catalog/mutations/shared";

/**
 * Leituras do painel da Home (MDI-D030), com a sessão do administrador: a RLS
 * mostra ao staff os blocos inativos e os vínculos com rascunhos.
 */

function fail(context: string, cause: unknown): never {
  throw new Error(`Falha ao carregar ${context}.`, { cause });
}

export type HomeBlockMedia = {
  id: string;
  storagePath: string;
  altText: string;
  kind: MediaKind;
  width: number | null;
  height: number | null;
};

export type AdminHomeBlock = {
  id: string;
  type: BlockType;
  theme: SectionTheme;
  isActive: boolean;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  productId: string | null;
  categoryId: string | null;
  mediaAssetId: string | null;
  videoAssetId: string | null;
  layout: BlockLayout;
  source: GridSource | null;
  limit: number;
  primaryCta: CtaSetting | null;
  secondaryCta: CtaSetting | null;
  items: BlockItem[];
  productName: string | null;
  categoryName: string | null;
  media: HomeBlockMedia | null;
  video: HomeBlockMedia | null;
  /** Por que o bloco não aparece (ou aparece incompleto) no site. */
  warnings: string[];
};

export type HomeProductOption = {
  id: string;
  name: string;
  isPublished: boolean;
};

export type HomeCategoryOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type MediaRow = {
  id: string;
  storage_path: string;
  alt_text: string;
  kind: MediaKind;
  width: number | null;
  height: number | null;
  deleted_at: string | null;
};

const MEDIA_FIELDS =
  "id, storage_path, alt_text, kind, width, height, deleted_at";

function toMedia(row: MediaRow | null): HomeBlockMedia | null {
  return row && row.deleted_at === null
    ? {
        id: row.id,
        storagePath: row.storage_path,
        altText: row.alt_text,
        kind: row.kind,
        width: row.width,
        height: row.height,
      }
    : null;
}

export async function listAdminHomeBlocks(
  client: CatalogClient,
): Promise<AdminHomeBlock[]> {
  const { data, error } = await client
    .from("homepage_sections")
    .select(
      `id, type, title, subtitle, content, theme, is_active, settings_json, product_id, category_id, media_asset_id, video_asset_id, product:products(name, status, deleted_at), category:categories(name, is_active, deleted_at), media:media_assets!homepage_sections_media_asset_id_fkey(${MEDIA_FIELDS}), video:media_assets!homepage_sections_video_asset_id_fkey(${MEDIA_FIELDS})`,
    )
    .order("sort_order")
    .order("created_at");
  if (error) fail("os blocos da Home", error);

  return data.map((row) => {
    const settings = parseBlockSettings(row.type, row.settings_json);
    const warnings: string[] = [];
    if (
      row.product &&
      (row.product.status !== "PUBLISHED" || row.product.deleted_at)
    ) {
      warnings.push(
        "O produto vinculado não está publicado: ele não aparece no site.",
      );
    }
    if (row.category && (!row.category.is_active || row.category.deleted_at)) {
      warnings.push(
        "A categoria vinculada está inativa: ela não aparece no site.",
      );
    }
    if (row.media?.deleted_at || row.video?.deleted_at) {
      warnings.push("Uma mídia do bloco foi excluída: escolha outra.");
    }
    return {
      id: row.id,
      type: row.type,
      theme: row.theme,
      isActive: row.is_active,
      eyebrow: settings.eyebrow,
      title: row.title,
      subtitle: row.subtitle,
      content: row.content,
      productId: row.product_id,
      categoryId: row.category_id,
      mediaAssetId: row.media_asset_id,
      videoAssetId: row.video_asset_id,
      layout: settings.layout,
      source: settings.source,
      limit: settings.limit,
      primaryCta: settings.primaryCta,
      secondaryCta: settings.secondaryCta,
      items: settings.items,
      productName: row.product?.name ?? null,
      categoryName: row.category?.name ?? null,
      media: toMedia(row.media),
      video: toMedia(row.video),
      warnings,
    };
  });
}

/** Produtos que podem ser vinculados (não excluídos), com o status de publicação. */
export async function listHomeProductOptions(
  client: CatalogClient,
): Promise<HomeProductOption[]> {
  const { data, error } = await client
    .from("products")
    .select("id, name, status")
    .is("deleted_at", null)
    .order("name");
  if (error) fail("os produtos", error);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    isPublished: row.status === "PUBLISHED",
  }));
}

export async function listHomeCategoryOptions(
  client: CatalogClient,
): Promise<HomeCategoryOption[]> {
  const { data, error } = await client
    .from("categories")
    .select("id, name, is_active")
    .is("deleted_at", null)
    .order("sort_order")
    .order("name");
  if (error) fail("as categorias", error);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
  }));
}
