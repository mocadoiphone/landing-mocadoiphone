"use client";

// Estado de erro das páginas do catálogo: mensagem amigável, sem detalhes internos.
export default function SiteError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-narrow flex-col gap-4 px-gutter py-section">
      <h1 className="text-heading font-semibold">
        Não foi possível carregar esta página
      </h1>
      <p className="text-body text-muted">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="w-fit rounded-control bg-accent px-4 py-2 text-caption font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Tentar novamente
      </button>
    </main>
  );
}
