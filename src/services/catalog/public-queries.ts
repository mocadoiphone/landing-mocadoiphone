import "server-only";

import { z } from "zod";

import {
  type CategoryPage,
  type CategorySummary,
  type ProductCard,
  type ProductDetail,
  type ProductShowcase,
} from "@/lib/catalog/types";
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

const MEDIA_ASSET = "storage_path, alt_text, width, height, kind";
const VARIANT_FIELDS =
  "id, sku, storage, color_name, color_hex, sort_order, is_default, availability, price_cash, price_old, price_installment, installments, installment_text, price_on_request";

const PRODUCT_CARD_SELECT = `id, slug, name, badge, short_description, is_launch, is_promotion, is_featured, category:categories(slug, name), family:product_families(id, slug, name, sort_order), variants:product_variants(${VARIANT_FIELDS}), media:product_media(slot, variant_id, alt_text, sort_order, asset:media_assets(${MEDIA_ASSET}))`;

const PRODUCT_DETAIL_SELECT = `${PRODUCT_CARD_SELECT}, description, related:related_product_id(slug, name), specs:product_specs(group_name, label, value, sort_order)`;

const SHOWCASE_COLUMNS = {
  launch: "is_launch",
  promotion: "is_promotion",
  featured: "is_featured",
} as const satisfies Record<ProductShowcase, string>;

const whatsappSettingsSchema = z.object({
  message_template: z.string().optional(),
  lead_origin: z.string().optional(),
});

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
  return toProductDetail(supabaseUrl, product.data, whatsapp);
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
): Promise<WhatsAppConfig> {
  const [contact, setting] = await Promise.all([
    client
      .from("contacts")
      .select("whatsapp")
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
  };
}
