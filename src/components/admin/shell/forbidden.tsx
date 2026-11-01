import Link from "next/link";

/** Página aberta sem o papel necessário (a URL foi acessada direto). */
export function Forbidden() {
  return (
    <section className="flex max-w-narrow flex-col gap-3">
      <h1 className="text-heading font-semibold">
        Sem permissão para esta área
      </h1>
      <p className="text-body text-muted">
        Seu perfil não dá acesso a esta parte do painel. Se precisar dela, fale
        com o proprietário (OWNER).
      </p>
      <Link href="/admin/dashboard" className="w-fit text-body underline">
        Voltar ao dashboard
      </Link>
    </section>
  );
}
