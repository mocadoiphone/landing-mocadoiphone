import {
  ArtDirectedImage,
  SiteImage,
  SiteVideo,
} from "@/components/media/site-image";
import { type MediaView } from "@/lib/catalog/types";

/**
 * Galeria do produto. Celular: rolagem horizontal com encaixe, uma imagem por
 * vez (com a versão mobile da principal, se houver). Tela larga: imagens
 * empilhadas ao lado das informações. Sem JavaScript.
 */
export function ProductGallery({
  images,
  mobileMain,
  videos,
  productName,
}: {
  images: MediaView[];
  mobileMain: MediaView | null;
  videos: MediaView[];
  productName: string;
}) {
  if (images.length === 0 && videos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-media bg-surface text-caption text-muted">
        Imagens de {productName} em breve
      </div>
    );
  }

  const [main, ...rest] = images;
  const count = images.length + videos.length;
  // Com uma mídia só, ela ocupa a largura; com várias, a próxima aparece na borda.
  const slide =
    count > 1 ? "w-[88%] shrink-0 snap-center md:w-full" : "w-full shrink-0";

  return (
    <div
      role="region"
      aria-label={`Imagens de ${productName}${count > 1 ? ` (${count})` : ""}`}
      tabIndex={count > 1 ? 0 : undefined}
      className="-mx-gutter overflow-x-auto px-gutter focus-visible:outline-2 focus-visible:outline-ring md:mx-0 md:overflow-visible md:px-0"
    >
      <ul className="flex snap-x snap-mandatory gap-3 md:flex-col md:gap-4">
        {main ? (
          <li className={slide}>
            <div className="flex aspect-square items-center justify-center rounded-media bg-surface p-6 md:p-10">
              <ArtDirectedImage
                desktop={main}
                mobile={mobileMain}
                sizes="(min-width: 768px) 55vw, 88vw"
                preload
                className="h-full w-full object-contain"
              />
            </div>
          </li>
        ) : null}
        {rest.map((image) => (
          <li key={image.url} className={slide}>
            <div className="flex aspect-square items-center justify-center rounded-media bg-surface p-6 md:p-10">
              <SiteImage
                media={image}
                sizes="(min-width: 768px) 55vw, 88vw"
                className="h-full w-full object-contain"
              />
            </div>
          </li>
        ))}
        {videos.map((video) => (
          <li key={video.url} className={slide}>
            <SiteVideo
              video={video}
              className="aspect-square w-full rounded-media bg-surface object-contain"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
