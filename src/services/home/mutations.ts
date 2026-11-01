import "server-only";

import {
  type HomeBlockActiveInput,
  type HomeBlockInput,
  type HomeBlockUpdateInput,
  toBlockRow,
} from "@/lib/home/blocks";
import { type CatalogResult, notFound, success } from "@/lib/catalog/result";
import { type IdInput } from "@/lib/catalog/schemas";
import {
  applyReorder,
  type CatalogClient,
  dbFailure,
  nextOrder,
} from "@/services/catalog/mutations/shared";

/**
 * Núcleo das escritas da Home (MDI-D009, MDI-D030). Roda com a sessão do
 * administrador: a RLS de `homepage_sections` (OWNER, ADMIN, CONTENT_EDITOR)
 * decide, e a auditoria registra o autor.
 */
type SavedBlock = { id: string };

export async function createHomeBlock(
  client: CatalogClient,
  input: HomeBlockInput,
): Promise<CatalogResult<SavedBlock>> {
  const last = await client
    .from("homepage_sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("homepage_sections")
    .insert({
      ...toBlockRow(input),
      is_active: input.isActive ?? false,
      sort_order: nextOrder(last.data),
    })
    .select("id")
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

export async function updateHomeBlock(
  client: CatalogClient,
  input: HomeBlockUpdateInput,
): Promise<CatalogResult<SavedBlock>> {
  const { data, error } = await client
    .from("homepage_sections")
    .update({
      ...toBlockRow(input),
      ...(input.isActive === undefined ? {} : { is_active: input.isActive }),
    })
    .eq("id", input.id)
    .select("id")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function setHomeBlockActive(
  client: CatalogClient,
  input: HomeBlockActiveInput,
): Promise<CatalogResult<SavedBlock>> {
  const { data, error } = await client
    .from("homepage_sections")
    .update({ is_active: input.isActive })
    .eq("id", input.id)
    .select("id")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Bloco é conteúdo filho: exclusão física, sempre auditada (MDI-D010). */
export async function deleteHomeBlock(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedBlock>> {
  const { data, error } = await client
    .from("homepage_sections")
    .delete()
    .eq("id", input.id)
    .select("id")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function reorderHomeBlocks(
  client: CatalogClient,
  input: { orderedIds: string[] },
): Promise<CatalogResult<{ updated: number }>> {
  const current = await client
    .from("homepage_sections")
    .select("id, sort_order");
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("homepage_sections")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .select("id")
      .maybeSingle(),
  );
}
