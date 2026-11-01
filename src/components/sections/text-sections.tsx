import { SectionHeading } from "@/components/ui/section";
import { type HomeBlockView } from "@/lib/home/types";

import { BlockCtas, headingId } from "./block-parts";

/** FEATURES (Brain §7.5): benefícios comerciais em grade. */
export function FeaturesSection({ block }: { block: HomeBlockView }) {
  const id = headingId(block);
  return (
    <section
      data-theme={block.theme}
      aria-labelledby={id}
      aria-label={id ? undefined : "Benefícios"}
      className="py-section"
    >
      <div className="mx-auto flex w-full max-w-wide flex-col gap-12 px-gutter">
        <SectionHeading
          id={id}
          eyebrow={block.eyebrow}
          title={block.title}
          subtitle={block.subtitle}
        />
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => (
            <li
              key={`${item.title}-${item.text}`}
              className="flex flex-col gap-2 border-t border-border pt-6"
            >
              <h3 className="text-lead font-semibold">{item.title}</h3>
              {item.text ? (
                <p className="text-body text-pretty text-muted">{item.text}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** REVIEWS: depoimentos cadastrados no painel (texto de quem autorizou o uso). */
export function ReviewsSection({ block }: { block: HomeBlockView }) {
  const id = headingId(block);
  return (
    <section
      data-theme={block.theme}
      aria-labelledby={id}
      aria-label={id ? undefined : "Depoimentos"}
      className="py-section"
    >
      <div className="mx-auto flex w-full max-w-wide flex-col gap-12 px-gutter">
        <SectionHeading id={id} eyebrow={block.eyebrow} title={block.title} />
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => (
            <li key={`${item.title}-${item.text}`}>
              <figure className="flex h-full flex-col justify-between gap-6 rounded-card bg-surface p-6 sm:p-8">
                <blockquote className="text-lead text-pretty">
                  <p>“{item.text}”</p>
                </blockquote>
                <figcaption className="flex flex-col text-caption">
                  {item.title ? (
                    <span className="font-semibold">{item.title}</span>
                  ) : null}
                  {item.detail ? (
                    <span className="text-muted">{item.detail}</span>
                  ) : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** CTA: fechamento com título centrado e até dois botões. */
export function CtaSection({ block }: { block: HomeBlockView }) {
  const id = headingId(block);
  return (
    <section
      data-theme={block.theme}
      aria-labelledby={id}
      className="py-section"
    >
      <div className="mx-auto flex w-full max-w-narrow flex-col items-center gap-8 px-gutter text-center">
        <SectionHeading
          id={id}
          eyebrow={block.eyebrow}
          title={block.title}
          subtitle={block.subtitle}
          align="center"
        />
        <BlockCtas ctas={block.ctas} align="center" />
      </div>
    </section>
  );
}
