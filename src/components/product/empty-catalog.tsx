import { CtaLink } from "@/components/ui/cta-link";
import { SITE_ROUTES } from "@/lib/site/routes";

/**
 * Estado vazio das listagens: explica e oferece um próximo passo (atendimento
 * ou loja), em vez de uma página em branco.
 */
export function EmptyCatalog({
  title,
  description,
  whatsappUrl,
}: {
  title: string;
  description: string;
  whatsappUrl: string | null;
}) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-media bg-surface p-8 sm:p-12">
      <p className="text-heading font-semibold text-balance">{title}</p>
      <p className="max-w-text text-body text-pretty text-muted">
        {description}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {whatsappUrl ? (
          <CtaLink href={whatsappUrl} external>
            Consultar no WhatsApp
          </CtaLink>
        ) : null}
        <CtaLink href={SITE_ROUTES.store} variant="secondary">
          Visite a loja
        </CtaLink>
      </div>
    </div>
  );
}
