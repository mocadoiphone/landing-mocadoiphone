"use server";

import {
  adminGrantInput,
  adminUpdateInput,
  contactCreateInput,
  contactUpdateInput,
  mediaSettingsInput,
  reorderContactsInput,
  whatsappSettingsInput,
} from "@/lib/admin/schemas";
import { AREA_ROLES } from "@/lib/auth/permissions";
import { idInput } from "@/lib/catalog/schemas";
import { footerSettingsInput, storeSettingsInput } from "@/lib/site/settings";
import { runCatalogAction } from "@/services/catalog/action-runner";
import { CACHE_TAGS } from "@/services/catalog/tags";

import {
  createContact,
  grantAdminProfile,
  reorderContacts,
  restoreContact,
  setDefaultContact,
  softDeleteContact,
  updateAdminProfile,
  updateContact,
  updateFooterSettings,
  updateMediaSettings,
  updateStoreSettings,
  updateWhatsappSettings,
} from "./mutations";

/**
 * Server Actions de contatos, configurações e usuários (MDI-D025, MDI-D027).
 * Contato, WhatsApp, loja física e rodapé aparecem no site: invalidam a tag `settings`.
 */
const contacts = {
  roles: AREA_ROLES.contacts,
  tags: [CACHE_TAGS.settings],
} as const;
const settings = {
  roles: AREA_ROLES.settings,
  tags: [CACHE_TAGS.settings],
} as const;
const users = { roles: AREA_ROLES.usersManage, tags: [] } as const;

// Contatos -------------------------------------------------------------------
export async function createContactAction(input: unknown) {
  return runCatalogAction({
    ...contacts,
    schema: contactCreateInput,
    input,
    run: createContact,
  });
}
export async function updateContactAction(input: unknown) {
  return runCatalogAction({
    ...contacts,
    schema: contactUpdateInput,
    input,
    run: updateContact,
  });
}
export async function setDefaultContactAction(input: unknown) {
  return runCatalogAction({
    ...contacts,
    schema: idInput,
    input,
    run: setDefaultContact,
  });
}
export async function deleteContactAction(input: unknown) {
  return runCatalogAction({
    ...contacts,
    schema: idInput,
    input,
    run: softDeleteContact,
  });
}
export async function restoreContactAction(input: unknown) {
  return runCatalogAction({
    ...contacts,
    schema: idInput,
    input,
    run: restoreContact,
  });
}
export async function reorderContactsAction(input: unknown) {
  return runCatalogAction({
    ...contacts,
    schema: reorderContactsInput,
    input,
    run: reorderContacts,
  });
}

// Configurações --------------------------------------------------------------
export async function updateWhatsappSettingsAction(input: unknown) {
  return runCatalogAction({
    ...settings,
    schema: whatsappSettingsInput,
    input,
    run: updateWhatsappSettings,
  });
}
export async function updateMediaSettingsAction(input: unknown) {
  return runCatalogAction({
    ...settings,
    schema: mediaSettingsInput,
    input,
    run: updateMediaSettings,
  });
}

export async function updateStoreSettingsAction(input: unknown) {
  return runCatalogAction({
    ...settings,
    schema: storeSettingsInput,
    input,
    run: updateStoreSettings,
  });
}
export async function updateFooterSettingsAction(input: unknown) {
  return runCatalogAction({
    ...settings,
    schema: footerSettingsInput,
    input,
    run: updateFooterSettings,
  });
}

// Usuários (só OWNER) --------------------------------------------------------
export async function grantAdminProfileAction(input: unknown) {
  return runCatalogAction({
    ...users,
    schema: adminGrantInput,
    input,
    run: grantAdminProfile,
  });
}
export async function updateAdminProfileAction(input: unknown) {
  return runCatalogAction({
    ...users,
    schema: adminUpdateInput,
    input,
    run: updateAdminProfile,
  });
}
