import { SiteImage, SiteVideo } from "@/components/media/site-image";
import { Eyebrow } from "@/components/ui/section";
import { type HomeBlockView } from "@/lib/home/types";

import { BlockCtas, BlockPrice, headingId } from "./block-parts";

/**
 * HERO_PRODUCT (Brain §7.1): tipografia grande e centrada, produto abaixo como
 * protagonista. No celular, o texto vem primeiro e os botões ocupam a largura.
 */
export function HeroSection({
  block,
  priority,
}: {
  block: HomeBlockView;
  priority: boolean;
}) {
  const id = headingId(block);
  const Heading = priority ? "h1" : "h2";
  return (
    <section
      data-theme={block.theme}
      aria-labelledby={id}
      className="overflow-hidden"
    >
      <div className="mx-auto flex min-h-[calc(85svh-var(--spacing-header))] w-full max-w-wide flex-col items-center gap-10 px-gutter pt-section-tight pb-10 text-center md:gap-14">
        <div className="flex max-w-narrow flex-col items-center gap-5">
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          <Heading
            id={id}
            className="text-display-xl font-semibold text-balance"
          >
            {block.title}
          </Heading>
          {block.subtitle ? (
            <p className="max-w-text text-lead text-pretty text-muted">
              {block.subtitle}
            </p>
          ) : null}
          <BlockPrice block={block} />
          <BlockCtas ctas={block.ctas} align="center" />
        </div>

        {block.video ? (
          <SiteVideo
            video={block.video}
            poster={block.media}
            className="aspect-video w-full max-w-content rounded-media bg-surface object-cover"
          />
        ) : block.media ? (
          <div className="flex w-full max-w-content flex-1 items-end justify-center">
            <SiteImage
              media={block.media}
              sizes="(min-width: 1216px) 1216px, 100vw"
              preload={priority}
              className="h-auto max-h-[60svh] w-auto max-w-full object-contain"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
