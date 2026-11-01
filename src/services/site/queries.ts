import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { requireSupabaseEnv } from "@/config/env";
import { type SiteChrome, type StoreView } from "@/lib/site/types";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { CACHE_TAGS } from "@/services/catalog/tags";

import { getPublicStore, loadSiteChrome } from "./public-queries";

/**
 * Consultas cacheadas do conteúdo institucional (MDI-D020, MDI-D031). O painel
 * invalida `settings` (loja, rodapé, WhatsApp) e `catalog` (categorias).
 */

export async function getSiteChrome(): Promise<SiteChrome> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.settings);
  return loadSiteChrome(
    createSupabasePublicClient(),
    requireSupabaseEnv().url,
    new Date().getFullYear(),
  );
}

export async function getStore(): Promise<StoreView> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return getPublicStore(createSupabasePublicClient(), requireSupabaseEnv().url);
}
