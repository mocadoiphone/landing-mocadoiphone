import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/product/breadcrumb";
import { EmptyCatalog } from "@/components/product/empty-catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { CategoryTiles } from "@/components/sections/category-grid-section";
import { staticParams } from "@/lib/site/routes";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { listActiveCategorySlugs } from "@/services/catalog/public-queries";
import { getCategories, getCategoryPage } from "@/services/catalog/queries";
import { getSiteChrome } from "@/services/site/queries";

// Página de categoria (Brain §6, §8; MDI-D003): produtos agrupados por família,
// na ordem do painel. Estática a partir do cache (MDI-D034): slug inexistente
// ou categoria inativa responde 404 de verdade.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const slugs = await listActiveCategorySlugs(createSupabasePublicClient());
  return staticParams("categorySlug", slugs);
}

export async function generateMetadata({
  params,
}: PageProps<"/[categorySlug]">): Promise<Metadata> {
  const { categorySlug } = await params;
  const page = await getCategoryPage(categorySlug);
  if (!page) return {};
  return {
    title: page.category.name,
    description: page.category.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
}: PageProps<"/[categorySlug]">) {
  const { categorySlug } = await params;
  const page = await getCategoryPage(categorySlug);
  if (!page) notFound();

  const [categories, chrome] = await Promise.all([
    getCategories(),
    getSiteChrome(),
  ]);
  const { category, families } = page;
  const others = categories.filter((item) => item.slug !== category.slug);

  return (
    <main>
      <header className="mx-auto flex w-full max-w-wide flex-col gap-6 px-gutter pt-6 pb-section-tight">
        <Breadcrumb
          items={[{ label: "Início", href: "/" }, { label: category.name }]}
        />
        <div className="flex max-w-narrow flex-col gap-4 pt-6">
          <h1 className="text-display-lg font-semibold text-balance">
            {category.name}
          </h1>
          {category.description ? (
            <p className="text-lead text-pretty text-muted">
              {category.description}
            </p>
          ) : null}
        </div>
        {families.length > 1 ? (
          <nav aria-label={`Famílias de ${category.name}`}>
            <ul className="flex flex-wrap gap-2">
              {families.map((family) => (
                <li key={family.id}>
                  <a
                    href={`#familia-${family.slug}`}
                    className="inline-flex min-h-10 items-center rounded-pill border border-border px-4 text-caption font-medium transition-colors duration-200 hover:border-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {family.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      <div className="mx-auto flex w-full max-w-wide flex-col gap-section-tight px-gutter pb-section">
        {families.length === 0 ? (
          <EmptyCatalog
            title={`Ainda não há produtos de ${category.name} no site.`}
            description="Os produtos desta linha estão sendo cadastrados. Fale com a gente para saber o que temos disponível agora."
            whatsappUrl={chrome.contact.whatsappUrl}
          />
        ) : (
          families.map((family) => (
            <section
              key={family.id}
              id={`familia-${family.slug}`}
              aria-labelledby={`titulo-familia-${family.slug}`}
              className="flex flex-col gap-6"
            >
              <h2
                id={`titulo-familia-${family.slug}`}
                className="text-heading font-semibold"
              >
                {family.name}
              </h2>
              <ProductGrid products={family.products} />
            </section>
          ))
        )}
      </div>

      {others.length > 0 ? (
        <section
          aria-labelledby="outras-linhas"
          className="border-t border-border py-section-tight"
        >
          <div className="mx-auto flex w-full max-w-wide flex-col gap-8 px-gutter">
            <h2 id="outras-linhas" className="text-heading font-semibold">
              Outras linhas
            </h2>
            <CategoryTiles categories={others} />
          </div>
        </section>
      ) : null}
    </main>
  );
}
