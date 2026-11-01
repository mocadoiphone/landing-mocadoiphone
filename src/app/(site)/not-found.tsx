import { CtaLink } from "@/components/ui/cta-link";
import { SITE_ROUTES } from "@/lib/site/routes";

// Produto, categoria ou página inexistente dentro do site: 404 com cabeçalho e
// rodapé (o status real vem das páginas estáticas, MDI-D034).
export default function SiteNotFound() {
  return (
    <main className="mx-auto flex min-h-[60svh] w-full max-w-narrow flex-col justify-center gap-6 px-gutter py-section">
      <p className="text-eyebrow font-semibold tracking-wide text-muted uppercase">
        Erro 404
      </p>
      <h1 className="text-display-md font-semibold text-balance">
        Página não encontrada
      </h1>
      <p className="text-lead text-pretty text-muted">
        O endereço não existe ou o produto não está mais disponível no site.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <CtaLink href="/">Voltar ao início</CtaLink>
        <CtaLink href={SITE_ROUTES.store} variant="secondary">
          Visite a loja
        </CtaLink>
      </div>
    </main>
  );
}
