import Image, { getImageProps } from "next/image";

import { type MediaView } from "@/lib/catalog/types";

// Só para mídia antiga sem dimensões: envios novos sempre as têm (MDI-D007).
const FALLBACK_SIZE = 1200;

/**
 * Imagem do site público, otimizada pelo next/image (MDI-D032): `sizes` diz ao
 * navegador qual largura baixar; fora da primeira dobra carrega sob demanda.
 * Largura e altura gravadas evitam layout shift (Brain §27).
 */
export function SiteImage({
  media,
  sizes,
  className,
  preload = false,
  fill = false,
}: {
  media: MediaView;
  sizes: string;
  className?: string;
  /** Só para a imagem principal da primeira dobra (LCP). */
  preload?: boolean;
  /** Preenche o contêiner (que precisa de `position: relative` e tamanho). */
  fill?: boolean;
}) {
  if (fill) {
    return (
      <Image
        src={media.url}
        alt={media.alt}
        fill
        sizes={sizes}
        preload={preload}
        className={className}
      />
    );
  }
  return (
    <Image
      src={media.url}
      alt={media.alt}
      width={media.width ?? FALLBACK_SIZE}
      height={media.height ?? FALLBACK_SIZE}
      sizes={sizes}
      preload={preload}
      className={className}
    />
  );
}

/**
 * Imagem com versão própria para celular (Brain §28: composição mobile, não só
 * reduzir). `<picture>` com fontes por largura de tela; uma só imagem é baixada.
 */
export function ArtDirectedImage({
  desktop,
  mobile,
  sizes,
  className,
  preload = false,
}: {
  desktop: MediaView;
  mobile: MediaView | null;
  sizes: string;
  className?: string;
  preload?: boolean;
}) {
  if (!mobile) {
    return (
      <SiteImage
        media={desktop}
        sizes={sizes}
        className={className}
        preload={preload}
      />
    );
  }

  const common = { alt: desktop.alt, sizes, preload };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    src: desktop.url,
    width: desktop.width ?? FALLBACK_SIZE,
    height: desktop.height ?? FALLBACK_SIZE,
  });
  const {
    props: { srcSet: mobileSrcSet, ...rest },
  } = getImageProps({
    ...common,
    src: mobile.url,
    width: mobile.width ?? FALLBACK_SIZE,
    height: mobile.height ?? FALLBACK_SIZE,
  });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
      {/* Art direction documentado do next/image (getImageProps + <picture>). */}
      <img {...rest} alt={desktop.alt} className={className} />
    </picture>
  );
}

/**
 * Vídeo sem reprodução automática nem pré-carregamento (Brain §27: reduzir peso
 * de vídeos). A imagem do bloco, se houver, vira o pôster.
 */
export function SiteVideo({
  video,
  poster,
  className,
}: {
  video: MediaView;
  poster?: MediaView | null;
  className?: string;
}) {
  return (
    <video
      className={className}
      src={video.url}
      poster={poster?.url}
      aria-label={video.alt}
      controls
      playsInline
      preload="none"
    />
  );
}
