import "server-only";

import { z } from "zod";

import {
  type CategoryPage,
  type CategorySummary,
  type ProductCard,
  type ProductDetail,
  type ProductShowcase,
} from "@/lib/catalog/types";
import { RELATED_PRODUCTS_MAX } from "@/lib/catalog/related";
import { publicMediaUrl } from "@/lib/media/media";
import { type SitemapSource } from "@/lib/seo/sitemap";
import { type WhatsAppConfig } from "@/lib/whatsapp/whatsapp";

import {
  toCategoryPage,
  toCategorySummary,
  toProductCard,
  toProductDetail,
} from "./mappers";
import { type CatalogClient } from "./mutations/shared";

/**
 * Núcleo das consultas públicas (MDI-D011, MDI-D024). Recebem o cliente, para
 * rodar tanto na página (cliente público, cacheado) quanto nos testes de
 * integração. Sempre usar o cliente PÚBLICO: o filtro do que é publicado é da RLS.
 */

export const MEDIA_ASSET = "storage_path, alt_text, width, height, kind";
const VARIANT_FIELDS =
  "id, sku, storage, color_name, color_hex, sort_order, is_default, availability, price_cash, price_old, price_installment, installments, installment_text, price_on_request";

export const PRODUCT_CARD_SELECT = `id, slug, name, badge, short_description, is_launch, is_promotion, is_featured, category:categories(slug, name), family:product_families(id, slug, name, sort_order), variants:product_variants(${VARIANT_FIELDS}), media:product_media(slot, variant_id, alt_text, sort_order, asset:media_assets(${MEDIA_ASSET}))`;

const PRODUCT_DETAIL_SELECT = `${PRODUCT_CARD_SELECT}, description, meta_title, meta_description, canonical_url, published_at, updated_at, og_image:media_assets(${MEDIA_ASSET}), related:related_product_id(${PRODUCT_CARD_SELECT}), specs:product_specs(group_name, label, value, sort_order)`;

const SHOWCASE_COLUMNS = {
  launch: "is_launch",
  promotion: "is_promotion",
  featured: "is_featured",
} as const satisfies Record<ProductShowcase, string>;

// O painel grava `null` em campo vazio: `nullish`, para um campo vazio não
// invalidar a configuração inteira.
const whatsappSettingsSchema = z.object({
  message_template: z.string().nullish(),
  lead_origin: z.string().nullish(),
  general_message: z.string().nullish(),
});

/** Configuração do WhatsApp + telefone do contato padrão (rodapé, loja). */
export type PublicWhatsAppConfig = WhatsAppConfig & {
  contactPhone: string | null;
};

/** Falha de leitura vira exceção: a página mostra o estado de erro e nada é cacheado. */
function fail(context: string, cause: unknown): never {
  throw new Error(`Falha ao consultar o catálogo (${context}).`, { cause });
}

export async function listPublicCategories(
  client: CatalogClient,
  supabaseUrl: string,
): Promise<CategorySummary[]> {
  const { data, error } = await client
    .from("categories")
    .select(`id, name, slug, description, image:media_assets(${MEDIA_ASSET})`)
    .order("sort_order")
    .order("name");
  if (error) fail("categorias", error);
  return data.map((row) => toCategorySummary(supabaseUrl, row));
}

export async function getPublicCategoryPage(
  client: CatalogClient,
  supabaseUrl: string,
  slug: string,
): Promise<CategoryPage | null> {
  const { data: category, error } = await client
    .from("categories")
    .select(`id, name, slug, description, image:media_assets(${MEDIA_ASSET})`)
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("categoria", error);
  if (!category) return null;

  const { data: products, error: productsError } = await client
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("category_id", category.id)
    .order("sort_order")
    .order("name");
  if (productsError) fail("produtos da categoria", productsError);

  return toCategoryPage(supabaseUrl, category, products);
}

export async function getPublicProduct(
  client: CatalogClient,
  supabaseUrl: string,
  slug: string,
): Promise<ProductDetail | null> {
  const [product, whatsapp] = await Promise.all([
    client
      .from("products")
      .select(PRODUCT_DETAIL_SELECT)
      .eq("slug", slug)
      .maybeSingle(),
    getPublicWhatsAppConfig(client),
  ]);
  if (product.error) fail("produto", product.error);
  if (!product.data) return null;

  const familyId = product.data.family?.id;
  const siblings = familyId
    ? await client
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("family_id", familyId)
        .neq("id", product.data.id)
        .order("sort_order")
        .order("name")
        .limit(RELATED_PRODUCTS_MAX)
    : null;
  if (siblings?.error) fail("produtos da família", siblings.error);

  return toProductDetail(
    supabaseUrl,
    product.data,
    whatsapp,
    siblings?.data ?? [],
  );
}

/** Vitrines: lançamentos (§7.3), promoções (/ofertas) e destaques. */
export async function listPublicShowcase(
  client: CatalogClient,
  supabaseUrl: string,
  showcase: ProductShowcase,
  limit = 24,
): Promise<ProductCard[]> {
  const { data, error } = await client
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq(SHOWCASE_COLUMNS[showcase], true)
    .order("sort_order")
    .order("name")
    .limit(limit);
  if (error) fail("vitrine", error);
  return data.map((row) => toProductCard(supabaseUrl, row));
}

/** Contato padrão + template da mensagem (MDI-D012). */
export async function getPublicWhatsAppConfig(
  client: CatalogClient,
): Promise<PublicWhatsAppConfig> {
  const [contact, setting] = await Promise.all([
    client
      .from("contacts")
      .select("whatsapp, phone")
      .eq("is_default", true)
      .maybeSingle(),
    client
      .from("site_settings")
      .select("value_json")
      .eq("key", "whatsapp")
      .maybeSingle(),
  ]);
  if (contact.error) fail("contato padrão", contact.error);
  if (setting.error) fail("configuração do WhatsApp", setting.error);

  const parsed = whatsappSettingsSchema.safeParse(setting.data?.value_json);
  return {
    phone: contact.data?.whatsapp ?? null,
    template: parsed.success ? (parsed.data.message_template ?? null) : null,
    origin: parsed.success ? (parsed.data.lead_origin ?? null) : null,
    generalMessage: parsed.success
      ? (parsed.data.general_message ?? null)
      : null,
    contactPhone: contact.data?.phone ?? null,
  };
}

/** Slugs publicados, para pré-gerar as páginas no build (MDI-D034). */
export async function listPublishedProductSlugs(
  client: CatalogClient,
): Promise<string[]> {
  const { data, error } = await client.from("products").select("slug");
  if (error) fail("slugs de produto", error);
  return data.map((row) => row.slug);
}

/** Slugs das categorias ativas, para pré-gerar as páginas no build (MDI-D034). */
export async function listActiveCategorySlugs(
  client: CatalogClient,
): Promise<string[]> {
  const { data, error } = await client.from("categories").select("slug");
  if (error) fail("slugs de categoria", error);
  return data.map((row) => row.slug);
}

/** URLs públicas e datas reais usadas pelo sitemap dinâmico. */
export async function listPublicSitemapEntries(
  client: CatalogClient,
  supabaseUrl: string,
): Promise<SitemapSource> {
  const [categories, products] = await Promise.all([
    client.from("categories").select("slug, updated_at").order("slug"),
    client
      .from("products")
      .select(
        `slug, updated_at, media:product_media(slot, variant_id, sort_order, asset:media_assets(${MEDIA_ASSET}))`,
      )
      .order("slug"),
  ]);
  if (categories.error) fail("sitemap de categorias", categories.error);
  if (products.error) fail("sitemap de produtos", products.error);

  return {
    categories: categories.data.map((category) => ({
      slug: category.slug,
      updatedAt: category.updated_at,
    })),
    products: products.data.map((product) => {
      const main = product.media
        .filter(
          (media) =>
            media.slot === "MAIN" &&
            media.variant_id === null &&
            media.asset?.kind === "IMAGE",
        )
        .sort((a, b) => a.sort_order - b.sort_order)[0];
      return {
        slug: product.slug,
        updatedAt: product.updated_at,
        imageUrl: main?.asset
          ? publicMediaUrl(supabaseUrl, main.asset.storage_path)
          : null,
      };
    }),
  };
}
