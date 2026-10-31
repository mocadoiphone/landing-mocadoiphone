import Image from "next/image";

import { type MediaView } from "@/lib/catalog/types";

// Só para mídia antiga sem dimensões: imagens novas sempre as têm (MDI-D007).
const FALLBACK_SIZE = 1200;

/**
 * Imagem ou vídeo do catálogo. `unoptimized` até a Etapa 07 definir a estratégia
 * de imagem (loader de transformação ou otimizador do Next).
 */
export function MediaImage({
  media,
  className,
  priority = false,
}: {
  media: MediaView;
  className?: string;
  priority?: boolean;
}) {
  if (media.kind === "VIDEO") {
    return (
      <video
        className={className}
        src={media.url}
        aria-label={media.alt}
        controls
        preload="metadata"
      />
    );
  }

  return (
    <Image
      className={className}
      src={media.url}
      alt={media.alt}
      width={media.width ?? FALLBACK_SIZE}
      height={media.height ?? FALLBACK_SIZE}
      priority={priority}
      unoptimized
    />
  );
}
