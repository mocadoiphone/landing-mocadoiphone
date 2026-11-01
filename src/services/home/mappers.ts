import "server-only";

import { type CategorySummary, type ProductCard } from "@/lib/catalog/types";
import {
  type BlockType,
  parseBlockSettings,
  type SectionTheme,
} from "@/lib/home/blocks";
import { type HomeCta, resolveCta } from "@/lib/home/cta";
import { type HomeBlockView } from "@/lib/home/types";
import { type StoreView } from "@/lib/site/types";
import {
  generalWhatsAppLink,
  type WhatsAppConfig,
  whatsAppLinkFor,
} from "@/lib/whatsapp/whatsapp";
import {
  type CategoryRow,
  type MediaAssetRow,
  type ProductCardRow,
  toCategorySummary,
  toMediaView,
  toProductCard,
} from "@/services/catalog/mappers";

/** Linha de `homepage_sections` como a consulta pública devolve (vínculos já filtrados pela RLS). */
export type HomeBlockRow = {
  id: string;
  type: BlockType;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  theme: SectionTheme;
  settings_json: unknown;
  product: ProductCardRow | null;
  category: CategoryRow | null;
  media: MediaAssetRow | null;
  video: MediaAssetRow | null;
};

export type HomeBlockDeps = {
  supabaseUrl: string;
  whatsapp: WhatsAppConfig;
  /** Produtos da grade (PRODUCT_GRID), já resolvidos pela origem. */
  products: ProductCard[];
  categories: CategorySummary[];
  store: StoreView | null;
};

export function toHomeBlockView(
  row: HomeBlockRow,
  deps: HomeBlockDeps,
): HomeBlockView {
  const settings = parseBlockSettings(row.type, row.settings_json);
  const product = row.product
    ? toProductCard(deps.supabaseUrl, row.product)
    : null;
  const category = row.category
    ? toCategorySummary(deps.supabaseUrl, row.category)
    : null;

  const ctaContext = {
    productSlug: product?.slug ?? null,
    categorySlug: category?.slug ?? product?.category.slug ?? null,
    whatsappUrl: product
      ? whatsAppLinkFor(deps.whatsapp, { productName: product.name })
      : generalWhatsAppLink(deps.whatsapp),
  };
  const ctas = [settings.primaryCta, settings.secondaryCta]
    .map((cta) => resolveCta(cta, ctaContext))
    .filter((cta): cta is HomeCta => cta !== null);

  // A imagem do bloco tem prioridade; sem ela, a imagem principal do produto.
  const media = row.media
    ? toMediaView(deps.supabaseUrl, row.media)
    : (product?.image ?? null);

  return {
    id: row.id,
    type: row.type,
    theme: row.theme === "DARK" ? "dark" : "light",
    eyebrow: settings.eyebrow,
    title: row.title?.trim() || null,
    subtitle: row.subtitle?.trim() || null,
    content: row.content?.trim() || null,
    media,
    video: row.video ? toMediaView(deps.supabaseUrl, row.video) : null,
    product,
    category,
    layout: settings.layout,
    ctas,
    items: settings.items,
    products: row.type === "PRODUCT_GRID" ? deps.products : [],
    categories: row.type === "CATEGORY_GRID" ? deps.categories : [],
    store: row.type === "STORE" ? deps.store : null,
  };
}
