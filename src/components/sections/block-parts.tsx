import { PriceBlock } from "@/components/catalog/price-block";
import { CtaLink } from "@/components/ui/cta-link";
import { type HomeCta } from "@/lib/home/cta";
import { type HomeBlockView } from "@/lib/home/types";

/** Botões do bloco: o primeiro é o principal; no celular ocupam a largura. */
export function BlockCtas({
  ctas,
  align = "start",
}: {
  ctas: HomeCta[];
  align?: "start" | "center";
}) {
  if (ctas.length === 0) return null;
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${align === "center" ? "sm:justify-center" : ""}`}
    >
      {ctas.map((cta, index) => (
        <CtaLink
          key={`${cta.target}-${cta.label}`}
          href={cta.href}
          external={cta.external}
          variant={index === 0 ? "primary" : "secondary"}
          className="w-full sm:w-auto"
        >
          {cta.label}
        </CtaLink>
      ))}
    </div>
  );
}

/** Preço do produto vinculado ao bloco, quando houver. */
export function BlockPrice({ block }: { block: HomeBlockView }) {
  if (!block.product) return null;
  return <PriceBlock price={block.product.price} size="sm" />;
}

/** Id estável para `aria-labelledby` (só quando há título). */
export function headingId(block: HomeBlockView): string | undefined {
  return block.title ? `bloco-${block.id}` : undefined;
}

/** Texto longo em parágrafos, preservando as quebras de linha digitadas. */
export function BlockText({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="flex max-w-text flex-col gap-4 text-body text-pretty text-muted">
      {text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => (
          <p key={paragraph} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
    </div>
  );
}
