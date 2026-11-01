import { requireSupabaseEnv } from "@/config/env";
import { type MediaView } from "@/lib/catalog/types";
import { type MediaKind, publicMediaUrl } from "@/lib/media/media";

/** Mídia como chega às telas do painel (serializável, sem dados internos). */
export type PanelMedia = {
  id: string;
  storagePath: string;
  altText: string;
  kind: MediaKind;
  width: number | null;
  height: number | null;
};

export function toMediaView(
  media: PanelMedia,
  altOverride?: string | null,
): MediaView {
  return {
    url: publicMediaUrl(requireSupabaseEnv().url, media.storagePath),
    alt: altOverride?.trim() ? altOverride.trim() : media.altText,
    kind: media.kind,
    width: media.width,
    height: media.height,
  };
}

const sizeFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormat.format(bytes / 1024)} KB`;
  return `${sizeFormat.format(bytes / (1024 * 1024))} MB`;
}
