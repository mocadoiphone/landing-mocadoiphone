import { type VariantView } from "@/lib/catalog/types";

import { AvailabilityBadge } from "./availability-badge";
import { PriceBlock } from "./price-block";
import { WhatsAppLink } from "./whatsapp-link";

/** Página técnica: todas as variantes em lista, sem seletor interativo. */
export function VariantList({ variants }: { variants: VariantView[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {variants.map((variant) => (
        <li
          key={variant.id}
          className="flex flex-col gap-2 rounded-card border border-border p-4"
          aria-current={variant.isDefault ? "true" : undefined}
        >
          <p className="flex items-center gap-2 text-body font-semibold">
            {variant.colorHex ? (
              <span
                aria-hidden="true"
                className="inline-block size-4 rounded-full border border-border"
                style={{ backgroundColor: variant.colorHex }}
              />
            ) : null}
            {variant.label ?? "Modelo único"}
            {variant.isDefault ? (
              <span className="text-caption font-normal text-muted">
                (padrão)
              </span>
            ) : null}
          </p>
          <PriceBlock price={variant.price} />
          <AvailabilityBadge availability={variant.availability} />
          {variant.whatsappUrl ? (
            <WhatsAppLink
              href={variant.whatsappUrl}
              label={`Consultar ${variant.label ?? "este modelo"} no WhatsApp`}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
