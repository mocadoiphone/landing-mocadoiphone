import { SignOutButton } from "@/components/admin/sign-out-button";
import { ADMIN_ROLE_LABELS } from "@/lib/auth/roles";
import { getAdminContext } from "@/services/auth/session";

// Página mínima da Etapa 02: comprova autenticação, perfil e RLS.
// O painel completo começa na Etapa 04.
export default async function AdminHomePage() {
  const admin = await getAdminContext();
  if (admin.status !== "authorized") {
    return null; // O layout já trata visitante sem sessão e conta sem perfil.
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-content flex-col justify-center gap-6 px-gutter">
      <h1 className="text-display-md">Painel administrativo</h1>
      <dl className="flex flex-col gap-3 text-body">
        <div>
          <dt className="text-caption text-muted">Usuário autenticado</dt>
          <dd>{admin.email ?? admin.userId}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Perfil</dt>
          <dd>
            {ADMIN_ROLE_LABELS[admin.role]} ({admin.role})
          </dd>
        </div>
      </dl>
      <SignOutButton />
    </main>
  );
}
