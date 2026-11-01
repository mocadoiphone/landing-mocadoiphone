import { ContactsManager } from "@/components/admin/contacts/contacts-manager";
import { type PanelMedia } from "@/components/admin/media/media-helpers";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listAdminContacts, listMediaLibrary } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

// Contatos e vendedores (Brain §14; MDI-D012).
export default async function ContactsPage() {
  const access = await requireAdminPage("contacts");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const [contacts, library] = await Promise.all([
    listAdminContacts(client),
    listMediaLibrary(client),
  ]);
  const images: PanelMedia[] = library
    .filter((item) => !item.isDeleted && item.kind === "IMAGE")
    .map(({ id, storagePath, altText, kind, width, height }) => ({
      id,
      storagePath,
      altText,
      kind,
      width,
      height,
    }));

  return (
    <>
      <PageHeader
        title="Contatos"
        description="Atendentes do WhatsApp. Um contato é o padrão do site."
      />
      <ContactsManager contacts={contacts} library={images} />
    </>
  );
}
