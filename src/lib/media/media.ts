import { type Database } from "@/types/database";

/**
 * Regras de mídia (Brain §20; MDI-D007). Espelham as constraints de
 * `media_assets` e `product_media` para dar mensagens claras antes do banco,
 * que continua sendo a garantia.
 */
export type MediaKind = Database["public"]["Enums"]["media_kind"];

export const MEDIA_BUCKET = "media";

export const MEDIA_FOLDERS = [
  "products",
  "categories",
  "home",
  "banners",
  "store",
  "seo",
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const MEDIA_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  VIDEO: ["video/mp4"],
} as const satisfies Record<MediaKind, readonly string[]>;

export const MEDIA_MAX_BYTES: Record<MediaKind, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
};

export const PRODUCT_MEDIA_SLOTS = [
  "MAIN",
  "GALLERY",
  "MOBILE",
  "VIDEO",
] as const;
export type ProductMediaSlot = (typeof PRODUCT_MEDIA_SLOTS)[number];

export const PRODUCT_MEDIA_SLOT_LABELS: Record<ProductMediaSlot, string> = {
  MAIN: "Imagem principal",
  GALLERY: "Galeria",
  MOBILE: "Imagem mobile",
  VIDEO: "Vídeo",
};

const STORAGE_PATH_PATTERN = new RegExp(
  `^(${MEDIA_FOLDERS.join("|")})/[A-Za-z0-9._/-]+$`,
);

/** Mesmo formato da CHECK `media_assets_storage_path_format`. */
export function isValidStoragePath(path: string): boolean {
  return STORAGE_PATH_PATTERN.test(path) && !path.includes("..");
}

export function isAllowedMimeType(kind: MediaKind, mimeType: string): boolean {
  return (MEDIA_MIME_TYPES[kind] as readonly string[]).includes(mimeType);
}

/** VIDEO só aceita vídeo; os demais slots só aceitam imagem. */
export function slotAcceptsKind(
  slot: ProductMediaSlot,
  kind: MediaKind,
): boolean {
  return (slot === "VIDEO") === (kind === "VIDEO");
}

/** O alt do vínculo sobrepõe o da biblioteca quando o contexto pede outro texto. */
export function effectiveAlt(
  override: string | null | undefined,
  libraryAlt: string,
): string {
  return override?.trim() ? override.trim() : libraryAlt;
}

/** URL pública do arquivo no bucket `media` (bucket público, MDI-D018). */
export function publicMediaUrl(
  supabaseUrl: string,
  storagePath: string,
): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const path = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}
