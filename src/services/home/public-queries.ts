import "server-only";

import {
  type CategorySummary,
  type ProductCard,
  type ProductShowcase,
} from "@/lib/catalog/types";
import {
  GRID_LIMIT,
  type GridSource,
  parseBlockSettings,
} from "@/lib/home/blocks";
import { isBlockRenderable } from "@/lib/home/render";
import { type HomeView } from "@/lib/home/types";
import { type StoreView } from "@/lib/site/types";
import { toProductCard } from "@/services/catalog/mappers";
import { type CatalogClient } from "@/services/catalog/mutations/shared";
import {
  getPublicWhatsAppConfig,
  listPublicCategories,
  listPublicShowcase,
  MEDIA_ASSET,
  PRODUCT_CARD_SELECT,
} from "@/services/catalog/public-queries";
import { getPublicStore } from "@/services/site/public-queries";

import { type HomeBlockRow, toHomeBlockView } from "./mappers";

/**
 * Montagem pública da Home (Brain §7, §19; MDI-D009, MDI-D030). Cliente PÚBLICO:
 * a RLS entrega só blocos ativos, produtos publicados, categorias ativas e mídia
 * em uso público. Bloco sem o essencial não é renderizado.
 */

const HOME_BLOCK_SELECT = `id, type, title, subtitle, content, theme, settings_json, product:products(${PRODUCT_CARD_SELECT}), category:categories(id, name, slug, description, image:media_assets(${MEDIA_ASSET})), media:media_assets!homepage_sections_media_asset_id_fkey(${MEDIA_ASSET}), video:media_assets!homepage_sections_video_asset_id_fkey(${MEDIA_ASSET})`;

const SHOWCASE_BY_SOURCE: Record<
  Exclude<GridSource, "CATEGORY">,
  ProductShowcase
> = {
  LAUNCH: "launch",
  PROMOTION: "promotion",
  FEATURED: "featured",
};

function fail(context: string, cause: unknown): never {
  throw new Error(`Falha ao consultar a Home (${context}).`, { cause });
}

/** Composição padrão enquanto o painel não tiver nenhum bloco válido ativo. */
const FALLBACK_BLOCKS: HomeBlockRow[] = [
  {
    id: "padrao-linhas",
    type: "CATEGORY_GRID",
    title: "Linhas Apple",
    subtitle: null,
    content: null,
    theme: "LIGHT",
    settings_json: {},
    product: null,
    category: null,
    media: null,
    video: null,
  },
  {
    id: "padrao-lancamentos",
    type: "PRODUCT_GRID",
    title: "Lançamentos",
    subtitle: null,
    content: null,
    theme: "LIGHT",
    settings_json: {
      source: "LAUNCH",
      primaryCta: { label: "Ver lançamentos", target: "LAUNCHES" },
    },
    product: null,
    category: null,
    media: null,
    video: null,
  },
  {
    id: "padrao-loja",
    type: "STORE",
    title: "Visite a loja",
    subtitle: null,
    content: null,
    theme: "DARK",
    settings_json: {},
    product: null,
    category: null,
    media: null,
    video: null,
  },
];

async function gridProducts(
  client: CatalogClient,
  supabaseUrl: string,
  row: HomeBlockRow,
): Promise<ProductCard[]> {
  const settings = parseBlockSettings(row.type, row.settings_json);
  const limit = settings.limit ?? GRID_LIMIT.default;
  if (!settings.source) return [];
  if (settings.source !== "CATEGORY") {
    return listPublicShowcase(
      client,
      supabaseUrl,
      SHOWCASE_BY_SOURCE[settings.source],
      limit,
    );
  }
  if (!row.category) return [];
  const { data, error } = await client
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("category_id", row.category.id)
    .order("sort_order")
    .order("name")
    .limit(limit);
  if (error) fail("produtos da categoria", error);
  return data.map((product) => toProductCard(supabaseUrl, product));
}

async function buildViews(
  client: CatalogClient,
  supabaseUrl: string,
  rows: readonly HomeBlockRow[],
) {
  const needs = (type: HomeBlockRow["type"]) =>
    rows.some((row) => row.type === type);

  const whatsapp = await getPublicWhatsAppConfig(client);
  const [categories, store, grids] = await Promise.all([
    needs("CATEGORY_GRID")
      ? listPublicCategories(client, supabaseUrl)
      : Promise.resolve<CategorySummary[]>([]),
    needs("STORE")
      ? getPublicStore(client, supabaseUrl, whatsapp)
      : Promise.resolve<StoreView | null>(null),
    Promise.all(
      rows.map((row) =>
        row.type === "PRODUCT_GRID"
          ? gridProducts(client, supabaseUrl, row)
          : Promise.resolve<ProductCard[]>([]),
      ),
    ),
  ]);

  // O bloco da loja só aparece com endereço ou horário cadastrado.
  const storeView =
    store && (store.addressLines.length > 0 || store.hours.length > 0)
      ? store
      : null;

  return rows
    .map((row, index) =>
      toHomeBlockView(row, {
        supabaseUrl,
        whatsapp,
        products: grids[index] ?? [],
        categories,
        store: storeView,
      }),
    )
    .filter(isBlockRenderable);
}

export async function loadPublicHome(
  client: CatalogClient,
  supabaseUrl: string,
): Promise<HomeView> {
  const { data, error } = await client
    .from("homepage_sections")
    .select(HOME_BLOCK_SELECT)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");
  if (error) fail("blocos", error);

  const blocks = await buildViews(client, supabaseUrl, data);
  if (blocks.length > 0) return { blocks, isFallback: false };

  return {
    blocks: await buildViews(client, supabaseUrl, FALLBACK_BLOCKS),
    isFallback: true,
  };
}
