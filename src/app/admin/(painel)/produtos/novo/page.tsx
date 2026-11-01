import Link from "next/link";

import { ProductCreateForm } from "@/components/admin/products/product-create-form";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { EmptyState, PageHeader } from "@/components/admin/ui/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCategoryOptions } from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

export default async function NewProductPage() {
  const access = await requireAdminPage("catalog");
  if (!access.ok) return <Forbidden />;

  const client = await createSupabaseServerClient();
  const categories = await listCategoryOptions(client);

  return (
    <>
      <PageHeader
        title="Novo produto"
        description="O produto nasce como rascunho. Nada vai para o site até você publicar."
      />
      {categories.length === 0 ? (
        <EmptyState title="Nenhuma categoria cadastrada.">
          Crie uma categoria e uma família em{" "}
          <Link href="/admin/categorias" className="underline">
            Categorias
          </Link>{" "}
          primeiro.
        </EmptyState>
      ) : (
        <ProductCreateForm categories={categories} />
      )}
    </>
  );
}
