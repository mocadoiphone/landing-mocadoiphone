"use server";

import { AREA_ROLES } from "@/lib/auth/permissions";
import { idInput, orderedIds } from "@/lib/catalog/schemas";
import {
  homeBlockActiveInput,
  homeBlockCreateInput,
  homeBlockUpdateInput,
} from "@/lib/home/blocks";
import { runCatalogAction } from "@/services/catalog/action-runner";
import { CACHE_TAGS } from "@/services/catalog/tags";
import { z } from "zod";

import {
  createHomeBlock,
  deleteHomeBlock,
  reorderHomeBlocks,
  setHomeBlockActive,
  updateHomeBlock,
} from "./mutations";

/**
 * Server Actions dos blocos da Home (MDI-D030). Papel conferido no servidor
 * (OWNER, ADMIN, CONTENT_EDITOR, igual à RLS); toda escrita invalida a tag `home`.
 */
const home = { roles: AREA_ROLES.home, tags: [CACHE_TAGS.home] } as const;

export async function createHomeBlockAction(input: unknown) {
  return runCatalogAction({
    ...home,
    schema: homeBlockCreateInput,
    input,
    run: createHomeBlock,
  });
}

export async function updateHomeBlockAction(input: unknown) {
  return runCatalogAction({
    ...home,
    schema: homeBlockUpdateInput,
    input,
    run: updateHomeBlock,
  });
}

export async function setHomeBlockActiveAction(input: unknown) {
  return runCatalogAction({
    ...home,
    schema: homeBlockActiveInput,
    input,
    run: setHomeBlockActive,
  });
}

export async function deleteHomeBlockAction(input: unknown) {
  return runCatalogAction({
    ...home,
    schema: idInput,
    input,
    run: deleteHomeBlock,
  });
}

export async function reorderHomeBlocksAction(input: unknown) {
  return runCatalogAction({
    ...home,
    schema: z.object({ orderedIds }),
    input,
    run: reorderHomeBlocks,
  });
}
