import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { requireSupabaseEnv } from "@/config/env";
import {
  type CategoryPage,
  type CategorySummary,
  type ProductCard,
  type ProductDetail,
  type ProductShowcase,
} from "@/lib/catalog/types";
import { isValidSlug, SLUG_MAX_LENGTH } from "@/lib/slug/slug";
import { createSupabasePublicClient } from "@/lib/supabase/public";

import {
  getPublicCategoryPage,
  getPublicProduct,
  listPublicCategories,
  listPublicShowcase,
} from "./public-queries";
import { CACHE_TAGS } from "./tags";

/**
 * Consultas públicas cacheadas (MDI-D020): `use cache` + tag, invalidadas pelas
 * Server Actions do painel. `cacheLife("hours")` é a rede de segurança caso uma
 * alteração não passe pelas actions.
 */

export async function getCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);
  return listPublicCategories(
    createSupabasePublicClient(),
    requireSupabaseEnv().url,
  );
}

export async function getCategoryPage(
  slug: string,
): Promise<CategoryPage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);
  if (!isValidSlug(slug, SLUG_MAX_LENGTH.category)) return null;
  return getPublicCategoryPage(
    createSupabasePublicClient(),
    requireSupabaseEnv().url,
    slug,
  );
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog, CACHE_TAGS.settings);
  if (!isValidSlug(slug, SLUG_MAX_LENGTH.product)) return null;
  return getPublicProduct(
    createSupabasePublicClient(),
    requireSupabaseEnv().url,
    slug,
  );
}

export async function getShowcase(
  showcase: ProductShowcase,
): Promise<ProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);
  return listPublicShowcase(
    createSupabasePublicClient(),
    requireSupabaseEnv().url,
    showcase,
  );
}
