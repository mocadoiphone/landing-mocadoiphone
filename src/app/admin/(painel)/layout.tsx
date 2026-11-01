import { type Route } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminNav } from "@/components/admin/shell/admin-nav";
import { type AdminArea, canAccess } from "@/lib/auth/permissions";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/roles";
import { getAdminContext } from "@/services/auth/session";

// Autorização no servidor a cada requisição (o proxy só renova a sessão).
// Cada página confere o papel da sua área (requireAdminPage) e cada Server
// Action confere de novo: o menu filtrado abaixo é só UX.

// Lê a sessão no topo do layout: a rota pode bloquear no servidor (MDI-D020).
export const instant = false;

const NAV_ITEMS: { href: Route; label: string; area: AdminArea }[] = [
  { href: "/admin/dashboard", label: "Dashboard", area: "dashboard" },
  { href: "/admin/produtos", label: "Produtos", area: "catalog" },
  { href: "/admin/categorias", label: "Categorias", area: "catalog" },
  { href: "/admin/midia", label: "Mídia", area: "media" },
  { href: "/admin/contatos", label: "Contatos", area: "contacts" },
  { href: "/admin/configuracoes", label: "Configurações", area: "settings" },
  { href: "/admin/usuarios", label: "Usuários", area: "usersView" },
];

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

  const items = NAV_ITEMS.filter((item) =>
    canAccess(admin.role, item.area),
  ).map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-wide flex-wrap items-center justify-between gap-3 px-gutter py-3">
          <p className="text-body font-semibold">Painel · Moça do iPhone</p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-caption text-muted">
              {admin.displayName} · {ADMIN_ROLE_LABELS[admin.role]}
            </p>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-wide gap-6 px-gutter py-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <aside>
          <AdminNav items={items} />
        </aside>
        <main className="flex min-w-0 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
