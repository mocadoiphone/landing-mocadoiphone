import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { SpecList } from "@/components/catalog/spec-list";
import { Breadcrumb } from "@/components/product/breadcrumb";
import { ProductConfigurator } from "@/components/product/product-configurator";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductRail } from "@/components/sections/product-grid-section";
import { BlockText } from "@/components/sections/block-parts";
import { siteConfig } from "@/config/site";
import { createPageMetadata, resolveCanonicalUrl } from "@/lib/seo/metadata";
import {
  productBreadcrumbJsonLd,
  productJsonLd,
} from "@/lib/seo/structured-data";
import { categoryPath, productPath, staticParams } from "@/lib/site/routes";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { listPublishedProductSlugs } from "@/services/catalog/public-queries";
import { getProduct } from "@/services/catalog/queries";

// Página definitiva de produto (Brain §9–§13; MDI-D003). Gerada estática a
// partir do cache (MDI-D034): produto inexistente, rascunho ou excluído responde
// 404 de verdade, porque a decisão acontece antes de qualquer streaming.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const slugs = await listPublishedProductSlugs(createSupabasePublicClient());
  return staticParams("slug", slugs);
}

export async function generateMetadata({
  params,
}: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return createPageMetadata({
    title: product.seo.title,
    description: product.seo.description,
    path: productPath(product.slug),
    siteName: siteConfig.name,
    siteUrl: siteConfig.url,
    canonicalUrl: product.seo.canonicalUrl,
    image: product.seo.image,
  });
}

export default async function ProductPage({
  params,
}: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const canonicalUrl = resolveCanonicalUrl(
    product.seo.canonicalUrl,
    productPath(product.slug),
    siteConfig.url,
  );

  return (
    <main>
      <JsonLd value={productJsonLd(product, canonicalUrl)} />
      <JsonLd value={productBreadcrumbJsonLd(product, siteConfig.url)} />
      <div className="mx-auto flex w-full max-w-wide flex-col gap-8 px-gutter pt-6 pb-section">
        <Breadcrumb
          items={[
            { label: "Início", href: "/" },
            {
              label: product.category.name,
              href: categoryPath(product.category.slug),
            },
            { label: product.name },
          ]}
        />
        <ProductConfigurator
          product={{
            name: product.name,
            badge: product.badge,
            familyName: product.family.name,
            shortDescription: product.shortDescription,
            price: product.price,
            availability: product.availability,
            whatsappUrl: product.whatsappUrl,
            media: product.media,
          }}
          variants={product.variants}
          defaultVariantId={product.defaultVariantId}
        />
      </div>

      {product.description || product.specs.length > 0 ? (
        <section
          data-theme="light"
          aria-label="Detalhes do produto"
          className="border-t border-border py-section"
        >
          <div className="mx-auto grid w-full max-w-wide gap-12 px-gutter lg:grid-cols-2 lg:gap-16">
            {product.description ? (
              <div className="flex flex-col gap-6">
                <h2 className="text-heading font-semibold">Sobre o produto</h2>
                <BlockText text={product.description} />
              </div>
            ) : null}
            {product.specs.length > 0 ? (
              <div className="flex flex-col gap-6">
                <h2 className="text-heading font-semibold">Especificações</h2>
                <SpecList groups={product.specs} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {product.relatedProducts.length > 0 ? (
        <section
          data-theme="light"
          aria-labelledby="relacionados"
          className="border-t border-border py-section"
        >
          <div className="mx-auto flex w-full max-w-wide flex-col gap-8 px-gutter">
            <h2 id="relacionados" className="text-display-md font-semibold">
              Veja também
            </h2>
            <ProductRail
              products={product.relatedProducts}
              label="Veja também"
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}
