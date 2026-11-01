import { type ProductCard } from "@/lib/catalog/types";

import { Breadcrumb } from "./breadcrumb";
import { EmptyCatalog } from "./empty-catalog";
import { ProductGrid } from "./product-grid";

/** Vitrines /ofertas e /lancamentos (Brain §6): produtos marcados no painel. */
export function ShowcasePage({
  title,
  description,
  products,
  emptyTitle,
  whatsappUrl,
}: {
  title: string;
  description: string;
  products: ProductCard[];
  emptyTitle: string;
  whatsappUrl: string | null;
}) {
  return (
    <main className="mx-auto flex w-full max-w-wide flex-col gap-10 px-gutter pt-6 pb-section">
      <Breadcrumb items={[{ label: "Início", href: "/" }, { label: title }]} />
      <header className="flex max-w-narrow flex-col gap-4">
        <h1 className="text-display-lg font-semibold text-balance">{title}</h1>
        <p className="text-lead text-pretty text-muted">{description}</p>
      </header>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyCatalog
          title={emptyTitle}
          description="Fale com a gente para saber das novidades e condições do momento."
          whatsappUrl={whatsappUrl}
        />
      )}
    </main>
  );
}
