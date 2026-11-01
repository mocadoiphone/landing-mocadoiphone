import { SiteImage } from "@/components/media/site-image";
import { CtaLink } from "@/components/ui/cta-link";
import { SectionHeading } from "@/components/ui/section";
import { type StoreView } from "@/lib/site/types";

/**
 * Loja física (Brain §7.7; MDI-D031): endereço, horários, texto, fotos, mapa e
 * atendimento. Tudo vem de Configurações › Loja física; nada fixo no código.
 * Usada no bloco STORE da Home e na página /loja.
 */
export function StoreSection({
  store,
  theme = "light",
  eyebrow,
  title,
  subtitle,
  headingLevel = 2,
  id = "loja-fisica",
}: {
  store: StoreView;
  theme?: "light" | "dark";
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  headingLevel?: 1 | 2;
  id?: string;
}) {
  const heading = title ?? store.name ?? "Loja física";
  const [cover, ...others] = store.photos;

  return (
    <section data-theme={theme} aria-labelledby={id} className="py-section">
      <div className="mx-auto grid w-full max-w-wide gap-12 px-gutter lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-8">
          <SectionHeading
            id={id}
            eyebrow={eyebrow}
            title={heading}
            subtitle={subtitle ?? store.description}
            level={headingLevel}
          />

          <div className="grid gap-8 sm:grid-cols-2">
            {store.addressLines.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-caption font-semibold text-muted">
                  Endereço
                </h3>
                <address className="text-body not-italic">
                  {store.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </div>
            ) : null}
            {store.hours.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-caption font-semibold text-muted">
                  Horários
                </h3>
                <dl className="flex flex-col gap-1 text-body">
                  {store.hours.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-wrap justify-between gap-x-4"
                    >
                      <dt>{row.label}</dt>
                      <dd className="font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {store.whatsappUrl ? (
              <CtaLink
                href={store.whatsappUrl}
                external
                className="w-full sm:w-auto"
              >
                {store.ctaLabel ?? "Fale com a loja"}
              </CtaLink>
            ) : null}
            {store.mapUrl ? (
              <CtaLink
                href={store.mapUrl}
                external
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Como chegar
              </CtaLink>
            ) : null}
          </div>
        </div>

        {cover ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SiteImage
              media={cover}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-auto w-full rounded-media object-cover sm:col-span-2"
            />
            {others.map((photo) => (
              <SiteImage
                key={photo.url}
                media={photo}
                sizes="(min-width: 1024px) 22vw, 50vw"
                className="aspect-[4/3] h-auto w-full rounded-media object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
