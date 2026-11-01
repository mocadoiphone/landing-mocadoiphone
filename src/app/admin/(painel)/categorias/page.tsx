import { CategoriesManager } from "@/components/admin/categories/categories-manager";
import { type PanelMedia } from "@/components/admin/media/media-helpers";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listAdminCategories,
  listMediaLibrary,
} from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

// Categorias e famílias (Brain §8; MDI-D004).
export default async function CategoriesPage() {
  const access = await requireAdminPage("catalog");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const [categories, library] = await Promise.all([
    listAdminCategories(client),
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
        title="Categorias e famílias"
        description="Categoria → Família → Produto. Categorias novas nascem inativas."
      />
      <CategoriesManager categories={categories} library={images} />
    </>
  );
}
