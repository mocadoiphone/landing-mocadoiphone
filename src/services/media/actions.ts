"use server";

import {
  idInput,
  mediaAltUpdateInput,
  mediaAssetRegisterInput,
} from "@/lib/catalog/schemas";
import { runCatalogAction } from "@/services/catalog/action-runner";
import { MEDIA_WRITE_ROLES } from "@/services/catalog/authorization";
import { CACHE_TAGS } from "@/services/catalog/tags";

import {
  registerMediaAsset,
  restoreMedia,
  softDeleteMedia,
  updateMediaAlt,
} from "./mutations";

/**
 * Server Actions da biblioteca de mídia (MDI-D007, MDI-D024). O editor de
 * conteúdo também pode usá-las. O alt aparece no site, então invalida o catálogo.
 */
const media = {
  roles: MEDIA_WRITE_ROLES,
  tags: [CACHE_TAGS.catalog],
} as const;

export async function registerMediaAssetAction(input: unknown) {
  return runCatalogAction({
    ...media,
    schema: mediaAssetRegisterInput,
    input,
    run: registerMediaAsset,
  });
}
export async function updateMediaAltAction(input: unknown) {
  return runCatalogAction({
    ...media,
    schema: mediaAltUpdateInput,
    input,
    run: updateMediaAlt,
  });
}
export async function deleteMediaAction(input: unknown) {
  return runCatalogAction({
    ...media,
    schema: idInput,
    input,
    run: softDeleteMedia,
  });
}
export async function restoreMediaAction(input: unknown) {
  return runCatalogAction({
    ...media,
    schema: idInput,
    input,
    run: restoreMedia,
  });
}
