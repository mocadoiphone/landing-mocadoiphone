import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/admin/sign-out-button";
import { getAdminContext } from "@/services/auth/session";

// Autorização no servidor a cada requisição (o proxy só renova a sessão).
// Toda Server Action futura do painel também deve verificar o perfil.

// Lê a sessão no topo do layout: a rota pode bloquear no servidor (MDI-D020).
export const instant = false;

export default async function AdminPanelLayout({
  children,
}: LayoutProps<"/admin">) {
  const admin = await getAdminContext();

  if (admin.status === "anonymous") {
    redirect("/admin/login");
  }

  if (admin.status === "forbidden") {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-narrow flex-col justify-center gap-4 px-gutter">
        <h1 className="text-heading font-semibold">Acesso não autorizado</h1>
        <p className="text-body text-muted">
          A conta {admin.email ?? "atual"} não tem um perfil administrativo
          ativo. Fale com o responsável pelo painel.
        </p>
        <SignOutButton />
      </main>
    );
  }

  return children;
}
