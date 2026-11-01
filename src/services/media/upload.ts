import "server-only";

import {
  type MediaUploadFinalizeInput,
  type MediaUploadPrepareInput,
} from "@/lib/admin/schemas";
import { type CatalogResult, failure, success } from "@/lib/catalog/result";
import {
  isAllowedMimeType,
  MEDIA_BUCKET,
  MEDIA_MAX_BYTES,
  publicMediaUrl,
} from "@/lib/media/media";
import {
  detectMimeType,
  extensionForMime,
  kindForMime,
  SIGNATURE_BYTES,
} from "@/lib/media/signature";
import { type CatalogClient } from "@/services/catalog/mutations/shared";

import { registerMediaAsset } from "./mutations";

/**
 * Envio de mídia (MDI-D026): o arquivo vai do navegador direto ao Storage por uma
 * URL temporária; o servidor prepara o caminho e, no fim, confere o arquivo REAL
 * (existência, tamanho, tipo pelos primeiros bytes) antes de registrá-lo. Se a
 * conferência ou o registro falhar, o arquivo enviado é apagado.
 */

type StorageErrorLike = { message?: string; statusCode?: string | number };

function storageFailure<T>(error: StorageErrorLike): CatalogResult<T> {
  const status = String(error.statusCode ?? "");
  const forbidden =
    status === "403" ||
    /row-level security|unauthorized/i.test(error.message ?? "");
  return failure(
    forbidden
      ? {
          code: "forbidden",
          message: "Você não tem permissão para enviar arquivos.",
        }
      : {
          code: "unexpected",
          message: "Não foi possível falar com o armazenamento. Tente de novo.",
        },
  );
}

async function isVideoUploadEnabled(client: CatalogClient): Promise<boolean> {
  const { data } = await client
    .from("site_settings")
    .select("value_json")
    .eq("key", "media")
    .maybeSingle();
  const value = data?.value_json;
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    value.video_upload_enabled === true
  );
}

const VIDEO_DISABLED = {
  code: "rule" as const,
  field: "file",
  message: "O envio de vídeo está desativado. Ative em Configurações → Mídia.",
};

export async function prepareMediaUpload(
  client: CatalogClient,
  input: MediaUploadPrepareInput,
): Promise<CatalogResult<{ path: string; token: string }>> {
  const kind = kindForMime(input.mimeType);
  const extension = extensionForMime(input.mimeType);
  if (!kind || !extension) {
    return failure({
      code: "validation",
      field: "file",
      message: "Formato não aceito.",
    });
  }
  if (input.sizeBytes > MEDIA_MAX_BYTES[kind]) {
    return failure({
      code: "validation",
      field: "file",
      message:
        kind === "IMAGE"
          ? "Imagem acima de 10 MB. Reduza o arquivo e tente de novo."
          : "Vídeo acima de 50 MB. Reduza o arquivo e tente de novo.",
    });
  }
  if (kind === "VIDEO" && !(await isVideoUploadEnabled(client))) {
    return failure(VIDEO_DISABLED);
  }

  const path = `${input.folder}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await client.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(path);
  if (error) return storageFailure(error);
  return success({ path: data.path, token: data.token });
}

/**
 * Lê só o começo do arquivo (Range), para conferir a assinatura do formato.
 * A resposta 206 tem só os bytes pedidos; o corpo é lido inteiro (sem cancelar o
 * stream, que dentro do Next pode ficar esperando a cópia interna da resposta).
 */
async function readFileHead(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: { Range: `bytes=0-${SIGNATURE_BYTES - 1}` },
    cache: "no-store",
  });
  if (!response.ok) return new Uint8Array();
  const bytes = new Uint8Array(await response.arrayBuffer());
  return bytes.subarray(0, SIGNATURE_BYTES);
}

export async function finalizeMediaUpload(
  client: CatalogClient,
  supabaseUrl: string,
  input: MediaUploadFinalizeInput,
): Promise<CatalogResult<{ id: string; storage_path: string }>> {
  const bucket = client.storage.from(MEDIA_BUCKET);
  const discard = async <T>(
    error: Parameters<typeof failure>[0],
  ): Promise<CatalogResult<T>> => {
    await bucket.remove([input.storagePath]);
    return failure(error);
  };

  const info = await bucket.info(input.storagePath);
  if (info.error) {
    return failure({
      code: "not_found",
      field: "file",
      message: "O arquivo não chegou ao armazenamento. Envie de novo.",
    });
  }

  const declaredMime = info.data.contentType ?? "";
  const size = info.data.size ?? 0;
  const kind = kindForMime(declaredMime);
  const expectedExtension = input.storagePath.split(".").pop();
  if (
    !kind ||
    !isAllowedMimeType(kind, declaredMime) ||
    extensionForMime(declaredMime) !== expectedExtension
  ) {
    return discard({
      code: "validation",
      field: "file",
      message: "Formato não aceito.",
    });
  }
  if (size <= 0 || size > MEDIA_MAX_BYTES[kind]) {
    return discard({
      code: "validation",
      field: "file",
      message: "Arquivo vazio ou acima do tamanho permitido.",
    });
  }
  if (kind === "VIDEO" && !(await isVideoUploadEnabled(client))) {
    return discard(VIDEO_DISABLED);
  }

  const detected = detectMimeType(
    await readFileHead(publicMediaUrl(supabaseUrl, input.storagePath)),
  );
  if (detected !== declaredMime) {
    return discard({
      code: "validation",
      field: "file",
      message:
        "O conteúdo do arquivo não corresponde ao formato informado. Envie uma imagem ou vídeo válido.",
    });
  }
  if (kind === "IMAGE" && (!input.width || !input.height)) {
    return discard({
      code: "validation",
      field: "file",
      message: "Não foi possível ler as dimensões da imagem. Envie de novo.",
    });
  }

  const registered = await registerMediaAsset(client, {
    storagePath: input.storagePath,
    kind,
    mimeType: detected,
    sizeBytes: size,
    width: kind === "IMAGE" ? (input.width ?? null) : null,
    height: kind === "IMAGE" ? (input.height ?? null) : null,
    altText: input.altText,
  });
  if (!registered.ok) {
    await bucket.remove([input.storagePath]);
  }
  return registered;
}
