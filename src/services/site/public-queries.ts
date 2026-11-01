import "server-only";

import { siteConfig } from "@/config/site";
import { type MediaView } from "@/lib/catalog/types";
import { formatPhone } from "@/lib/contacts/phone";
import {
  copyrightLine,
  parseFooterSettings,
  parseStoreSettings,
  storeAddressLines,
} from "@/lib/site/settings";
import { type SiteChrome, type StoreView } from "@/lib/site/types";
import {
  generalWhatsAppLink,
  type WhatsAppConfig,
} from "@/lib/whatsapp/whatsapp";
import { toMediaView } from "@/services/catalog/mappers";
import { type CatalogClient } from "@/services/catalog/mutations/shared";
import {
  getPublicWhatsAppConfig,
  listPublicCategories,
  MEDIA_ASSET,
  type PublicWhatsAppConfig,
} from "@/services/catalog/public-queries";

/**
 * Leituras públicas do conteúdo institucional (MDI-D031): cabeçalho, rodapé e
 * loja física. Sempre com o cliente PÚBLICO: `site_settings` só expõe as chaves
 * públicas (MDI-D016) e a mídia só aparece se estiver em uso público (RLS).
 */

function fail(context: string, cause: unknown): never {
  throw new Error(`Falha ao consultar o site (${context}).`, { cause });
}

async function readSetting(
  client: CatalogClient,
  key: "store" | "footer",
): Promise<unknown> {
  const { data, error } = await client
    .from("site_settings")
    .select("value_json")
    .eq("key", key)
    .maybeSingle();
  if (error) fail(`configuração ${key}`, error);
  return data?.value_json ?? null;
}

/** Fotos na ordem escolhida no painel; mídia excluída ou não pública some. */
async function loadPhotos(
  client: CatalogClient,
  supabaseUrl: string,
  ids: readonly string[],
): Promise<MediaView[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from("media_assets")
    .select(`id, ${MEDIA_ASSET}`)
    .in("id", [...ids])
    .eq("kind", "IMAGE");
  if (error) fail("fotos da loja", error);
  const byId = new Map(data.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [toMediaView(supabaseUrl, row)] : [];
  });
}

export async function getPublicStore(
  client: CatalogClient,
  supabaseUrl: string,
  whatsapp?: WhatsAppConfig,
): Promise<StoreView> {
  const [raw, config] = await Promise.all([
    readSetting(client, "store"),
    whatsapp ?? getPublicWhatsAppConfig(client),
  ]);
  const store = parseStoreSettings(raw);
  return {
    name: store.name,
    description: store.description,
    addressLines: storeAddressLines(store),
    hours: store.hours,
    mapUrl: store.mapUrl,
    photos: await loadPhotos(client, supabaseUrl, store.photoIds),
    ctaLabel: store.ctaLabel,
    whatsappUrl: generalWhatsAppLink(config),
  };
}

async function hasShowcase(
  client: CatalogClient,
  column: "is_launch" | "is_promotion",
): Promise<boolean> {
  const { count, error } = await client
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq(column, true);
  if (error) fail("vitrine", error);
  return (count ?? 0) > 0;
}

function contactView(config: PublicWhatsAppConfig): SiteChrome["contact"] {
  return {
    phoneLabel: config.contactPhone ? formatPhone(config.contactPhone) : null,
    phoneHref: config.contactPhone ? `tel:+${config.contactPhone}` : null,
    whatsappLabel: config.phone ? formatPhone(config.phone) : null,
    whatsappUrl: generalWhatsAppLink(config),
  };
}

/**
 * Tudo o que o cabeçalho e o rodapé exibem, numa leitura só. `year` vem de quem
 * chama (a consulta cacheada), para o copyright acompanhar o ano.
 */
export async function loadSiteChrome(
  client: CatalogClient,
  supabaseUrl: string,
  year: number,
): Promise<SiteChrome> {
  const whatsapp = await getPublicWhatsAppConfig(client);
  const [categories, hasLaunches, hasOffers, store, footerRaw] =
    await Promise.all([
      listPublicCategories(client, supabaseUrl),
      hasShowcase(client, "is_launch"),
      hasShowcase(client, "is_promotion"),
      getPublicStore(client, supabaseUrl, whatsapp),
      readSetting(client, "footer"),
    ]);
  const footer = parseFooterSettings(footerRaw);

  return {
    siteName: siteConfig.name,
    categories,
    hasLaunches,
    hasOffers,
    contact: contactView(whatsapp),
    store,
    footer: {
      ...footer,
      copyrightLine: copyrightLine(footer.copyright, year, siteConfig.name),
    },
  };
}
