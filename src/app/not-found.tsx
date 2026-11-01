import Link from "next/link";

// Endereço que não corresponde a nenhuma rota (fora do grupo do site).
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-narrow flex-col justify-center gap-4 px-gutter">
      <p className="text-eyebrow font-semibold tracking-wide text-muted uppercase">
        Erro 404
      </p>
      <h1 className="text-display-md font-semibold">Página não encontrada</h1>
      <p className="text-lead text-muted">
        O endereço não existe ou o conteúdo não está mais disponível.
      </p>
      <Link
        href="/"
        className="w-fit rounded-control text-body font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
