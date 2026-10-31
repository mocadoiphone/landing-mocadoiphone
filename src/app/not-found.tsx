import Link from "next/link";

// Página não encontrada (inclui produto não publicado ou excluído).
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-narrow flex-col justify-center gap-4 px-gutter">
      <h1 className="text-heading font-semibold">Página não encontrada</h1>
      <p className="text-body text-muted">
        O endereço não existe ou o conteúdo não está mais disponível.
      </p>
      <Link href="/" className="w-fit text-body underline">
        Voltar ao início
      </Link>
    </main>
  );
}
