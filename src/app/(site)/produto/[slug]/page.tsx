import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { CatalogLoading } from "@/components/catalog/catalog-loading";
import { MediaImage } from "@/components/catalog/media-image";
import { PriceBlock } from "@/components/catalog/price-block";
import { SpecList } from "@/components/catalog/spec-list";
import { VariantList } from "@/components/catalog/variant-list";
import { WhatsAppLink } from "@/components/catalog/whatsapp-link";
import { getProduct } from "@/services/catalog/queries";

type Params = PageProps<"/produto/[slug]">["params"];

// Página técnica de produto (Brain §9–§13; MDI-D003). Design final na Etapa 05.
// Rascunho, excluído ou slug inexistente: página "não encontrada" com noindex
// (status 404 real fica para as Etapas 05/07, junto com generateStaticParams).
export default function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const defaultVariant = product.variants.find((variant) => variant.isDefault);
  const whatsappUrl = defaultVariant?.whatsappUrl ?? product.whatsappUrl;

  return (
    <main className="mx-auto flex w-full max-w-content flex-col gap-10 px-gutter py-section">
      <nav
        aria-label="Navegação estrutural"
        className="text-caption text-muted"
      >
        <Link href="/">Início</Link> /{" "}
        <Link href={`/${product.category.slug}`}>{product.category.name}</Link>{" "}
        / <span aria-current="page">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {product.media.main ? (
          <MediaImage
            media={product.media.main}
            className="h-auto w-full rounded-media object-contain"
            priority
          />
        ) : null}

        <div className="flex flex-col gap-4">
          <p className="text-caption text-muted">{product.family.name}</p>
          <h1 className="text-display-md">{product.name}</h1>
          {product.badge ? (
            <p className="text-caption font-medium">{product.badge}</p>
          ) : null}
          {product.shortDescription ? (
            <p className="text-body text-muted">{product.shortDescription}</p>
          ) : null}
          <PriceBlock price={product.price} />
          <AvailabilityBadge availability={product.availability} />
          {whatsappUrl ? (
            <WhatsAppLink href={whatsappUrl} label="Consultar no WhatsApp" />
          ) : null}
        </div>
      </div>

      <section aria-labelledby="variantes" className="flex flex-col gap-4">
        <h2 id="variantes" className="text-heading font-semibold">
          Opções
        </h2>
        <VariantList variants={product.variants} />
      </section>

      {product.description ? (
        <section aria-labelledby="descricao" className="flex flex-col gap-4">
          <h2 id="descricao" className="text-heading font-semibold">
            Descrição
          </h2>
          <p className="text-body whitespace-pre-line">{product.description}</p>
        </section>
      ) : null}

      {product.media.gallery.length > 0 || product.media.videos.length > 0 ? (
        <section aria-labelledby="galeria" className="flex flex-col gap-4">
          <h2 id="galeria" className="text-heading font-semibold">
            Galeria
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...product.media.gallery, ...product.media.videos].map(
              (media) => (
                <li key={media.url}>
                  <MediaImage
                    media={media}
                    className="h-auto w-full rounded-media"
                  />
                </li>
              ),
            )}
          </ul>
        </section>
      ) : null}

      {product.specs.length > 0 ? (
        <section
          aria-labelledby="especificacoes"
          className="flex flex-col gap-4"
        >
          <h2 id="especificacoes" className="text-heading font-semibold">
            Especificações
          </h2>
          <SpecList groups={product.specs} />
        </section>
      ) : null}

      {product.related ? (
        <p className="text-body">
          Veja também:{" "}
          <Link href={`/produto/${product.related.slug}`} className="underline">
            {product.related.name}
          </Link>
        </p>
      ) : null}
    </main>
  );
}
