import { SiteImage, SiteVideo } from "@/components/media/site-image";
import { SceneController } from "@/components/motion/scene-controller";
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
      data-motion-scene="hero"
      aria-labelledby={id}
      className="overflow-hidden"
    >
      <div className="mx-auto flex min-h-[calc(85svh-var(--spacing-header))] w-full max-w-wide flex-col items-center gap-10 px-gutter pt-section-tight pb-10 text-center md:gap-14">
        <div
          data-motion-hero-copy
          className="flex max-w-narrow flex-col items-center gap-5"
        >
          {block.eyebrow ? (
            <div data-motion-entry>
              <Eyebrow>{block.eyebrow}</Eyebrow>
            </div>
          ) : null}
          <Heading
            id={id}
            className="text-display-xl font-semibold text-balance"
          >
            <span className="sr-only">{block.title}</span>
            <span aria-hidden="true">
              {block.title?.split(/\s+/).map((word, index, words) => (
                <span key={`${word}-${index}`}>
                  <span data-motion-text-part className="inline-block">
                    {word}
                  </span>
                  {index < words.length - 1 ? " " : null}
                </span>
              ))}
            </span>
          </Heading>
          {block.subtitle ? (
            <p
              data-motion-entry
              className="max-w-text text-lead text-pretty text-muted"
            >
              {block.subtitle}
            </p>
          ) : null}
          <div data-motion-entry>
            <BlockPrice block={block} />
          </div>
          <div data-motion-entry>
            <BlockCtas ctas={block.ctas} align="center" />
          </div>
        </div>

        {block.video ? (
          <div data-motion-hero-media className="w-full max-w-content">
            <SiteVideo
              video={block.video}
              poster={block.media}
              className="aspect-video w-full rounded-media bg-surface object-cover"
            />
          </div>
        ) : block.media ? (
          <div
            data-motion-hero-media
            className="flex w-full max-w-content flex-1 items-end justify-center"
          >
            <SiteImage
              media={block.media}
              sizes="(min-width: 1216px) 1216px, 100vw"
              preload={priority}
              className="h-auto max-h-[60svh] w-auto max-w-full object-contain"
            />
          </div>
        ) : null}
      </div>
      <SceneController scene="hero" />
    </section>
  );
}
