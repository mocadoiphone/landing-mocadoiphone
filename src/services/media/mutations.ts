import "server-only";

import { type CatalogResult, notFound, success } from "@/lib/catalog/result";
import {
  type IdInput,
  type MediaAltUpdateInput,
  type MediaAssetRegisterInput,
} from "@/lib/catalog/schemas";
import {
  type CatalogClient,
  dbFailure,
} from "@/services/catalog/mutations/shared";

/**
 * Biblioteca de mídia (Brain §20; MDI-D007). Nesta etapa só os metadados: o
 * envio do arquivo ao Storage entra na Etapa 04, com a tela de mídia.
 */
type SavedMedia = { id: string; storage_path: string };

const RETURNING = "id, storage_path";

export async function registerMediaAsset(
  client: CatalogClient,
  input: MediaAssetRegisterInput,
): Promise<CatalogResult<SavedMedia>> {
  const { data, error } = await client
    .from("media_assets")
    .insert({
      storage_path: input.storagePath,
      kind: input.kind,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      alt_text: input.altText,
    })
    .select(RETURNING)
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

export async function updateMediaAlt(
  client: CatalogClient,
  input: MediaAltUpdateInput,
): Promise<CatalogResult<SavedMedia>> {
  const { data, error } = await client
    .from("media_assets")
    .update({ alt_text: input.altText })
    .eq("id", input.id)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Bloqueada pelo banco enquanto a mídia estiver em uso (Brain §20). */
export async function softDeleteMedia(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedMedia>> {
  const { data, error } = await client
    .from("media_assets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function restoreMedia(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedMedia>> {
  const { data, error } = await client
    .from("media_assets")
    .update({ deleted_at: null })
    .eq("id", input.id)
    .not("deleted_at", "is", null)
    .select(RETURNING)
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}
