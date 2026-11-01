import { MediaLibrary } from "@/components/admin/media/media-library";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminSettings, listMediaLibrary } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

// Biblioteca de mídia (Brain §20; MDI-D007, MDI-D026).
export default async function MediaPage() {
  const access = await requireAdminPage("media");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const [items, settings] = await Promise.all([
    listMediaLibrary(client),
    getAdminSettings(client),
  ]);

  return (
    <>
      <PageHeader
        title="Mídia"
        description="Arquivos usados no site. O texto alternativo é obrigatório; arquivo em uso não pode ser excluído."
      />
      <MediaLibrary
        items={items}
        videoEnabled={settings.media.videoUploadEnabled}
      />
    </>
  );
}
