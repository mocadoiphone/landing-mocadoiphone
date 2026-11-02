import { SiteImage } from "@/components/media/site-image";
import { SceneController } from "@/components/motion/scene-controller";
import { Eyebrow } from "@/components/ui/section";
import { type HomeBlockView } from "@/lib/home/types";

import { BlockCtas, BlockPrice, BlockText, headingId } from "./block-parts";

/**
 * PRODUCT_STORY (Brain §7.2, §7.6): produto em seção ampla com destaques.
 * A sequência animada ao scroll fica para a Etapa 06; aqui a composição já é a
 * definitiva e funciona sem animação (Brain §29).
 */
export function ProductStorySection({
  block,
  priority,
}: {
  block: HomeBlockView;
  priority: boolean;
}) {
  const id = headingId(block) ?? `bloco-${block.id}`;
  const product = block.product;
  if (!product) return null;
  const mediaEnd = block.layout === "MEDIA_END";

  return (
    <section
      data-theme={block.theme}
      data-motion-scene="story"
      aria-labelledby={id}
      className="py-section"
    >
      <div
        data-motion-story-stage
        className="mx-auto grid w-full max-w-wide items-center gap-10 px-gutter lg:min-h-[calc(100svh-var(--spacing-header))] lg:grid-cols-12 lg:gap-16"
      >
        <div
          data-motion-story-media
          className={`relative flex aspect-square items-center justify-center rounded-media bg-surface p-6 sm:aspect-[4/3] lg:col-span-7 lg:aspect-square ${mediaEnd ? "lg:order-last" : ""}`}
        >
          {block.media ? (
            <SiteImage
              media={block.media}
              sizes="(min-width: 1024px) 58vw, 100vw"
              preload={priority}
              className="h-full w-full object-contain"
            />
          ) : null}
        </div>

        <div
          data-motion-story-copy
          className="flex flex-col gap-6 lg:col-span-5"
        >
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          <h2 id={id} className="text-display-md font-semibold text-balance">
            {block.title ?? product.name}
          </h2>
          {block.subtitle ? (
            <p className="text-lead text-pretty text-muted">{block.subtitle}</p>
          ) : null}
          <BlockText text={block.content} />

          {block.items.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6">
              {block.items.map((item) => (
                <div
                  key={`${item.title}-${item.text}`}
                  data-motion-story-item
                  className="flex flex-col gap-1"
                >
                  <dt className="text-heading font-semibold">{item.title}</dt>
                  {item.text ? (
                    <dd className="text-caption text-muted">{item.text}</dd>
                  ) : null}
                </div>
              ))}
            </dl>
          ) : null}

          <BlockPrice block={block} />
          <BlockCtas ctas={block.ctas} />
        </div>
      </div>
      <SceneController scene="story" />
    </section>
  );
}
