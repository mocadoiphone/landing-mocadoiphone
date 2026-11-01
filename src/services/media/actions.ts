"use server";

import {
  mediaUploadFinalizeInput,
  mediaUploadPrepareInput,
} from "@/lib/admin/schemas";
import { idInput, mediaAltUpdateInput } from "@/lib/catalog/schemas";
import { requireSupabaseEnv } from "@/config/env";
import { runCatalogAction } from "@/services/catalog/action-runner";
import { MEDIA_WRITE_ROLES } from "@/services/catalog/authorization";
import { CACHE_TAGS } from "@/services/catalog/tags";

import { restoreMedia, softDeleteMedia, updateMediaAlt } from "./mutations";
import { finalizeMediaUpload, prepareMediaUpload } from "./upload";

/**
 * Server Actions da biblioteca de mídia (MDI-D007, MDI-D024, MDI-D026). O editor
 * de conteúdo também pode usá-las. O alt aparece no site, então invalida o catálogo.
 * Registro de mídia só pelo envio verificado (preparar → enviar → finalizar):
 * não existe action que registre um caminho sem conferir o arquivo.
 */
const media = {
  roles: MEDIA_WRITE_ROLES,
  tags: [CACHE_TAGS.catalog],
} as const;

/** 1º passo do envio: valida e devolve a URL temporária (não altera dados). */
export async function prepareMediaUploadAction(input: unknown) {
  return runCatalogAction({
    roles: MEDIA_WRITE_ROLES,
    tags: [],
    refresh: false,
    schema: mediaUploadPrepareInput,
    input,
    run: prepareMediaUpload,
  });
}

/** 3º passo: confere o arquivo enviado e registra na biblioteca (ou apaga). */
export async function finalizeMediaUploadAction(input: unknown) {
  return runCatalogAction({
    roles: MEDIA_WRITE_ROLES,
    tags: [],
    schema: mediaUploadFinalizeInput,
    input,
    run: (client, data) =>
      finalizeMediaUpload(client, requireSupabaseEnv().url, data),
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
