import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { getAdminContext } from "@/services/auth/session";

// Lê a sessão para redirecionar quem já entrou: pode bloquear no servidor (MDI-D020).
export const instant = false;

export default async function AdminLoginPage() {
  const admin = await getAdminContext();
  if (admin.status === "authorized") {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-gutter">
      <div>
        <h1 className="text-heading font-semibold">Painel administrativo</h1>
        <p className="mt-1 text-caption text-muted">
          Acesso restrito à equipe da Moça do iPhone.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
