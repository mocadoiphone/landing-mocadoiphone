import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { UsersManager } from "@/components/admin/users/users-manager";
import { canAccess } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAdminUsers } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

// Usuários do painel (Brain §23; MDI-D027): OWNER gerencia, ADMIN consulta.
export default async function UsersPage() {
  const access = await requireAdminPage("usersView");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const users = await listAdminUsers(client);

  return (
    <>
      <PageHeader
        title="Usuários do painel"
        description="Sem convite por e-mail: o login é criado no Supabase e o acesso é concedido aqui."
      />
      <UsersManager
        users={users}
        canManage={canAccess(access.admin.role, "usersManage")}
        currentUserId={access.admin.userId}
      />
    </>
  );
}
