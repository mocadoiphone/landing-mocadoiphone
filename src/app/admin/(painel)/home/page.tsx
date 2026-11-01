import { HomeBlocksManager } from "@/components/admin/home/home-blocks-manager";
import { type PanelMedia } from "@/components/admin/media/media-helpers";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminSettings, listMediaLibrary } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";
import {
  listAdminHomeBlocks,
  listHomeCategoryOptions,
  listHomeProductOptions,
} from "@/services/home/admin-queries";

export const instant = false;

// Home administrável (Brain §18, §19; MDI-D030): OWNER, ADMIN e CONTENT_EDITOR.
export default async function HomeAdminPage() {
  const access = await requireAdminPage("home");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const [blocks, products, categories, library, settings] = await Promise.all([
    listAdminHomeBlocks(client),
    listHomeProductOptions(client),
    listHomeCategoryOptions(client),
    listMediaLibrary(client),
    getAdminSettings(client),
  ]);
  const media: PanelMedia[] = library
    .filter((item) => !item.isDeleted)
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
        title="Home"
        description="Blocos da página inicial, na ordem em que aparecem. Bloco novo nasce inativo; ative quando estiver pronto."
      />
      <HomeBlocksManager
        blocks={blocks}
        products={products}
        categories={categories}
        library={media}
        videoEnabled={settings.media.videoUploadEnabled}
      />
    </>
  );
}
