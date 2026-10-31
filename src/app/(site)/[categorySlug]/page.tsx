import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CatalogLoading } from "@/components/catalog/catalog-loading";
import { ProductCardItem } from "@/components/catalog/product-card";
import { getCategories, getCategoryPage } from "@/services/catalog/queries";

type Params = PageProps<"/[categorySlug]">["params"];

// Página técnica de categoria (Brain §6, §8; MDI-D003). Design final na Etapa 05.
// O conteúdo depende do slug e chega por streaming: slug inexistente mostra a
// página "não encontrada" com noindex (status 404 real fica para as Etapas 05/07).
export default function CategoryPage({ params }: PageProps<"/[categorySlug]">) {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: Params }) {
  const { categorySlug } = await params;
  const page = await getCategoryPage(categorySlug);
  if (!page) notFound();

  const categories = await getCategories();

  return (
    <main className="mx-auto flex w-full max-w-content flex-col gap-10 px-gutter py-section">
      <nav
        aria-label="Navegação estrutural"
        className="text-caption text-muted"
      >
        <Link href="/">Início</Link> /{" "}
        <span aria-current="page">{page.category.name}</span>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="text-display-md">{page.category.name}</h1>
        {page.category.description ? (
          <p className="text-body text-muted">{page.category.description}</p>
        ) : null}
      </header>

      {page.families.length === 0 ? (
        <p className="text-body text-muted">
          Nenhum produto publicado nesta linha ainda.
        </p>
      ) : (
        page.families.map((family) => (
          <section
            key={family.id}
            aria-labelledby={`familia-${family.slug}`}
            className="flex flex-col gap-4"
          >
            <h2
              id={`familia-${family.slug}`}
              className="text-heading font-semibold"
            >
              {family.name}
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {family.products.map((product) => (
                <ProductCardItem key={product.id} product={product} />
              ))}
            </ul>
          </section>
        ))
      )}

      <nav aria-label="Linhas Apple" className="border-t border-border pt-6">
        <ul className="flex flex-wrap gap-4 text-caption">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/${category.slug}`}
                aria-current={
                  category.slug === page.category.slug ? "page" : undefined
                }
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
