/** Estado de carregamento das páginas do catálogo (fallback do Suspense). */
export function CatalogLoading() {
  return (
    <main
      className="mx-auto w-full max-w-content px-gutter py-section"
      aria-busy="true"
    >
      <p className="text-body text-muted" role="status">
        Carregando…
      </p>
    </main>
  );
}
