import { SiteImage, SiteVideo } from "@/components/media/site-image";
import { SceneController } from "@/components/motion/scene-controller";
import { Eyebrow, SectionHeading } from "@/components/ui/section";
import { type HomeBlockView } from "@/lib/home/types";

import { BlockCtas, BlockPrice, BlockText, headingId } from "./block-parts";

/**
 * FULLSCREEN_MEDIA: mídia de borda a borda. O texto fica acima da mídia (nunca
 * sobre ela), para manter o contraste e não cobrir os controles do vídeo.
 * Celular em retrato 4:5; tela larga 16:9.
 */
export function FullscreenMediaSection({
  block,
  priority,
}: {
  block: HomeBlockView;
  priority: boolean;
}) {
  const id = headingId(block);
  const hasText = Boolean(block.title || block.subtitle || block.eyebrow);
  return (
    <section
      data-theme={block.theme}
      data-motion-scene="media"
      aria-labelledby={id}
      aria-label={id ? undefined : (block.media?.alt ?? block.video?.alt)}
      className="flex flex-col gap-10 py-section"
    >
      {hasText || block.ctas.length > 0 ? (
        <div
          data-motion-entry
          className="mx-auto flex w-full max-w-wide flex-col gap-6 px-gutter"
        >
          <SectionHeading
            id={id}
            eyebrow={block.eyebrow}
            title={block.title}
            subtitle={block.subtitle}
          />
          <BlockCtas ctas={block.ctas} />
        </div>
      ) : null}
      {block.video ? (
        <div data-motion-parallax className="w-full overflow-hidden">
          <SiteVideo
            video={block.video}
            poster={block.media}
            className="aspect-[4/5] w-full bg-surface object-cover md:aspect-video"
          />
        </div>
      ) : block.media ? (
        <div
          data-motion-parallax
          className="relative aspect-[4/5] w-full overflow-hidden bg-surface md:aspect-video"
        >
          <SiteImage
            media={block.media}
            sizes="100vw"
            fill
            preload={priority}
            className="object-cover"
          />
        </div>
      ) : null}
      <SceneController scene="media" />
    </section>
  );
}

/** TEXT_AND_MEDIA: texto ao lado da imagem; no celular, imagem antes do texto. */
export function TextAndMediaSection({ block }: { block: HomeBlockView }) {
  const id = headingId(block);
  const mediaEnd = block.layout === "MEDIA_END";
  return (
    <section
      data-theme={block.theme}
      data-motion-scene="text-media"
      aria-labelledby={id}
      className="py-section"
    >
      <div className="mx-auto grid w-full max-w-wide items-center gap-10 px-gutter md:grid-cols-2 lg:gap-16">
        {block.media ? (
          <div data-motion-parallax className={mediaEnd ? "md:order-last" : ""}>
            <SiteImage
              media={block.media}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-auto w-full rounded-media object-cover"
            />
          </div>
        ) : null}
        <div data-motion-text className="flex flex-col gap-6">
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          <h2 id={id} className="text-display-md font-semibold text-balance">
            {block.title}
          </h2>
          <BlockText text={block.content} />
          <BlockCtas ctas={block.ctas} />
        </div>
      </div>
      <SceneController scene="text-media" />
    </section>
  );
}

/** PROMO_BANNER: faixa de campanha em cartão, com imagem opcional. */
export function PromoBannerSection({ block }: { block: HomeBlockView }) {
  const id = headingId(block);
  return (
    <section
      data-theme={block.theme}
      aria-labelledby={id}
      className="py-section-tight"
    >
      <div className="mx-auto w-full max-w-wide px-gutter">
        <div className="grid items-center gap-8 overflow-hidden rounded-media bg-surface p-8 sm:p-12 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
            <h2 id={id} className="text-display-md font-semibold text-balance">
              {block.title}
            </h2>
            {block.subtitle ? (
              <p className="text-lead text-pretty text-muted">
                {block.subtitle}
              </p>
            ) : null}
            <BlockPrice block={block} />
            <BlockCtas ctas={block.ctas} />
          </div>
          {block.media ? (
            <SiteImage
              media={block.media}
              sizes="(min-width: 768px) 45vw, 90vw"
              className="h-auto max-h-96 w-full object-contain"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
