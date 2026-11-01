import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { requireSupabaseEnv } from "@/config/env";
import { type HomeView } from "@/lib/home/types";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { CACHE_TAGS } from "@/services/catalog/tags";

import { loadPublicHome } from "./public-queries";

/**
 * Home cacheada (MDI-D020). Os blocos mostram produtos, categorias e a loja, então
 * a página depende das três tags: qualquer alteração no painel a atualiza.
 */
export async function getHome(): Promise<HomeView> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home, CACHE_TAGS.catalog, CACHE_TAGS.settings);
  return loadPublicHome(createSupabasePublicClient(), requireSupabaseEnv().url);
}
