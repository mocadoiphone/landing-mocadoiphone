import { type Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CommercialForm } from "@/components/admin/products/editor/commercial-form";
import { GeneralForm } from "@/components/admin/products/editor/general-form";
import { MediaTab } from "@/components/admin/products/editor/media-tab";
import { ProductPreview } from "@/components/admin/products/editor/product-preview";
import { PublicationPanel } from "@/components/admin/products/editor/publication-panel";
import { SeoForm } from "@/components/admin/products/editor/seo-form";
import { SpecsTab } from "@/components/admin/products/editor/specs-tab";
import { VariantsTab } from "@/components/admin/products/editor/variants-tab";
import { type PanelMedia } from "@/components/admin/media/media-helpers";
import { Forbidden } from "@/components/admin/shell/forbidden";
import { PageHeader } from "@/components/admin/ui/feedback";
import { TabsNav } from "@/components/admin/ui/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAdminSettings,
  getProductEditor,
  listMediaLibrary,
} from "@/services/admin/queries";
import { requireAdminPage } from "@/services/auth/page-guard";

export const instant = false;

const TABS = [
  { key: "geral", label: "Geral" },
  { key: "comercial", label: "Comercial" },
  { key: "variantes", label: "Variantes" },
  { key: "midia", label: "Mídia" },
  { key: "conteudo", label: "Conteúdo" },
  { key: "seo", label: "SEO" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// Editor de produto (Brain §17): abas por URL, publicação com pendências e prévia.
export default async function ProductEditorPage({
  params,
  searchParams,
}: PageProps<"/admin/produtos/[id]">) {
  const access = await requireAdminPage("catalog");
  if (!access.ok) return <Forbidden />;

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const requested = (await searchParams).aba;
  const tab: TabKey = TABS.some((item) => item.key === requested)
    ? (requested as TabKey)
    : "geral";

  const client = await createSupabaseServerClient();
  const [data, settings, library] = await Promise.all([
    getProductEditor(client, id),
    getAdminSettings(client),
    listMediaLibrary(client),
  ]);
  if (!data) notFound();

  const { product, publicationIssues } = data;
  const panelLibrary: PanelMedia[] = library
    .filter((item) => !item.isDeleted)
    .map(({ id: mediaId, storagePath, altText, kind, width, height }) => ({
      id: mediaId,
      storagePath,
      altText,
      kind,
      width,
      height,
    }));
  const main = data.media.find(
    (link) => link.slot === "MAIN" && link.variantId === null,
  );
  const tabBadges: Partial<Record<TabKey, string>> = {
    ...(publicationIssues.includes("no_visible_variant")
      ? { variantes: "!" }
      : {}),
    ...(publicationIssues.includes("no_main_image") ? { midia: "!" } : {}),
    ...(publicationIssues.includes("family_deleted") ? { geral: "!" } : {}),
  };

  return (
    <>
      <PageHeader
        title={product.name}
        description={
          <>
            {data.category?.name ?? "Sem categoria"} ·{" "}
            {data.family?.name ?? "Sem família"} · /produto/{product.slug}
          </>
        }
        actions={
          <Link href="/admin/produtos" className="text-caption underline">
            ← Voltar à lista
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <TabsNav
            label="Seções do produto"
            current={tab}
            tabs={TABS.map((item) => ({
              key: item.key,
              label: item.label,
              href: `/admin/produtos/${product.id}?aba=${item.key}` as Route,
              ...(tabBadges[item.key] ? { badge: tabBadges[item.key] } : {}),
            }))}
          />

          {tab === "geral" ? (
            <GeneralForm
              product={product}
              categories={data.categories}
              relatedOptions={data.relatedOptions}
            />
          ) : null}
          {tab === "comercial" ? (
            <CommercialForm product={product} variants={data.variants} />
          ) : null}
          {tab === "variantes" ? (
            <VariantsTab productId={product.id} variants={data.variants} />
          ) : null}
          {tab === "midia" ? (
            <MediaTab
              productId={product.id}
              links={data.media}
              variants={data.variants}
              library={panelLibrary}
              videoEnabled={settings.media.videoUploadEnabled}
            />
          ) : null}
          {tab === "conteudo" ? (
            <SpecsTab productId={product.id} specs={data.specs} />
          ) : null}
          {tab === "seo" ? (
            <SeoForm
              product={product}
              ogImage={data.ogImage}
              library={panelLibrary}
            />
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <PublicationPanel
            productId={product.id}
            slug={product.slug}
            status={product.status}
            isDeleted={product.deleted_at !== null}
            issues={publicationIssues}
          />
          <ProductPreview
            name={product.name}
            status={product.status}
            variants={data.variants}
            mainImage={
              main?.asset ? { ...main.asset, altOverride: main.altText } : null
            }
            issuesCount={publicationIssues.length}
          />
        </aside>
      </div>
    </>
  );
}
