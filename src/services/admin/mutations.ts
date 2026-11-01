import "server-only";

import {
  type AdminGrantInput,
  type AdminUpdateInput,
  type ContactCreateInput,
  type ContactUpdateInput,
  type MediaSettingsInput,
  type ReorderContactsInput,
  type WhatsappSettingsInput,
} from "@/lib/admin/schemas";
import { type CatalogResult, notFound, success } from "@/lib/catalog/result";
import { type IdInput } from "@/lib/catalog/schemas";
import {
  applyReorder,
  type CatalogClient,
  dbFailure,
  definedOnly,
  isEmpty,
  nextOrder,
  nothingToUpdate,
} from "@/services/catalog/mutations/shared";

/**
 * Núcleo das escritas das áreas novas do painel (MDI-D024, MDI-D027):
 * contatos (Brain §14), configurações (§13, §20) e usuários (§23).
 */

// -----------------------------------------------------------------------------
// Contatos
// -----------------------------------------------------------------------------
type SavedContact = { id: string; name: string };

export async function createContact(
  client: CatalogClient,
  input: ContactCreateInput,
): Promise<CatalogResult<SavedContact>> {
  const last = await client
    .from("contacts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (last.error) return dbFailure(last.error);

  const { data, error } = await client
    .from("contacts")
    .insert({
      name: input.name,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp,
      role: input.role ?? null,
      avatar_asset_id: input.avatarAssetId ?? null,
      is_active: input.isActive ?? true,
      sort_order: nextOrder(last.data),
    })
    .select("id, name")
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

export async function updateContact(
  client: CatalogClient,
  input: ContactUpdateInput,
): Promise<CatalogResult<SavedContact>> {
  const values = definedOnly({
    name: input.name,
    phone: input.phone,
    whatsapp: input.whatsapp,
    role: input.role,
    avatar_asset_id: input.avatarAssetId,
    is_active: input.isActive,
  });
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("contacts")
    .update(values)
    .eq("id", input.id)
    .select("id, name")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

/** Troca atômica do contato padrão (função do banco, MDI-D027). */
export async function setDefaultContact(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<{ id: string }>> {
  const { error } = await client.rpc("set_default_contact", {
    p_contact_id: input.id,
  });
  if (error) return dbFailure(error);
  return success({ id: input.id });
}

export async function softDeleteContact(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedContact>> {
  const { data, error } = await client
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.id)
    .is("deleted_at", null)
    .select("id, name")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function restoreContact(
  client: CatalogClient,
  input: IdInput,
): Promise<CatalogResult<SavedContact>> {
  const { data, error } = await client
    .from("contacts")
    .update({ deleted_at: null })
    .eq("id", input.id)
    .not("deleted_at", "is", null)
    .select("id, name")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success(data) : notFound();
}

export async function reorderContacts(
  client: CatalogClient,
  input: ReorderContactsInput,
): Promise<CatalogResult<{ updated: number }>> {
  const current = await client
    .from("contacts")
    .select("id, sort_order")
    .is("deleted_at", null);
  if (current.error) return dbFailure(current.error);

  return applyReorder(current.data, input.orderedIds, (id, sortOrder) =>
    client
      .from("contacts")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .select("id")
      .maybeSingle(),
  );
}

// -----------------------------------------------------------------------------
// Configurações (chaves e visibilidade fixas na migration, MDI-D016)
// -----------------------------------------------------------------------------
export async function updateWhatsappSettings(
  client: CatalogClient,
  input: WhatsappSettingsInput,
): Promise<CatalogResult<{ key: string }>> {
  const { data, error } = await client
    .from("site_settings")
    .upsert(
      {
        key: "whatsapp",
        value_json: {
          message_template: input.messageTemplate,
          lead_origin: input.leadOrigin ?? null,
        },
      },
      { onConflict: "key" },
    )
    .select("key")
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

export async function updateMediaSettings(
  client: CatalogClient,
  input: MediaSettingsInput,
): Promise<CatalogResult<{ key: string }>> {
  const { data, error } = await client
    .from("site_settings")
    .upsert(
      {
        key: "media",
        value_json: { video_upload_enabled: input.videoUploadEnabled },
      },
      { onConflict: "key" },
    )
    .select("key")
    .single();
  if (error) return dbFailure(error);
  return success(data);
}

// -----------------------------------------------------------------------------
// Usuários do painel (sem service_role, MDI-D027)
// -----------------------------------------------------------------------------
export async function grantAdminProfile(
  client: CatalogClient,
  input: AdminGrantInput,
): Promise<CatalogResult<{ userId: string }>> {
  const { data, error } = await client.rpc("grant_admin_profile", {
    p_email: input.email,
    p_display_name: input.displayName,
    p_role: input.role,
  });
  if (error) return dbFailure(error);
  return success({ userId: data });
}

/** Trocar nome, papel ou ativar/desativar. As travas do banco impedem ficar sem OWNER. */
export async function updateAdminProfile(
  client: CatalogClient,
  input: AdminUpdateInput,
): Promise<CatalogResult<{ userId: string }>> {
  const values = definedOnly({
    display_name: input.displayName,
    role: input.role,
    is_active: input.isActive,
  });
  if (isEmpty(values)) return nothingToUpdate();

  const { data, error } = await client
    .from("admin_profiles")
    .update(values)
    .eq("user_id", input.userId)
    .select("user_id")
    .maybeSingle();
  if (error) return dbFailure(error);
  return data ? success({ userId: data.user_id }) : notFound();
}
