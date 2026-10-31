"use server";

import {
  categoryCreateInput,
  categoryUpdateInput,
  familyCreateInput,
  familyUpdateInput,
  idInput,
  productCreateInput,
  productMediaLinkInput,
  productMediaUpdateInput,
  productStatusInput,
  productUpdateInput,
  reorderCategoriesInput,
  reorderFamiliesInput,
  reorderProductMediaInput,
  reorderProductsInput,
  reorderSpecsInput,
  reorderVariantsInput,
  specCreateInput,
  specUpdateInput,
  variantCreateInput,
  variantUpdateInput,
} from "@/lib/catalog/schemas";

import { runCatalogAction } from "./action-runner";
import { CATALOG_WRITE_ROLES } from "./authorization";
import {
  createCategory,
  createFamily,
  reorderCategories,
  reorderFamilies,
  restoreCategory,
  restoreFamily,
  softDeleteCategory,
  softDeleteFamily,
  updateCategory,
  updateFamily,
} from "./mutations/categories";
import {
  createSpec,
  deleteSpec,
  linkProductMedia,
  reorderProductMedia,
  reorderSpecs,
  unlinkProductMedia,
  updateProductMedia,
  updateSpec,
} from "./mutations/content";
import {
  createProduct,
  reorderProducts,
  restoreProduct,
  setProductStatus,
  softDeleteProduct,
  updateProduct,
} from "./mutations/products";
import {
  createVariant,
  reorderVariants,
  restoreVariant,
  setDefaultVariant,
  softDeleteVariant,
  updateVariant,
} from "./mutations/variants";
import { CACHE_TAGS } from "./tags";

/**
 * Server Actions do catálogo (MDI-D024), consumidas pelo painel da Etapa 04.
 * Todas recebem `unknown` (entrada não confiável) e passam por `runCatalogAction`:
 * sessão + papel, Zod, escrita com a sessão do usuário e invalidação do cache.
 */
const catalog = {
  roles: CATALOG_WRITE_ROLES,
  tags: [CACHE_TAGS.catalog],
} as const;

// Categorias ------------------------------------------------------------------
export async function createCategoryAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: categoryCreateInput,
    input,
    run: createCategory,
  });
}
export async function updateCategoryAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: categoryUpdateInput,
    input,
    run: updateCategory,
  });
}
export async function deleteCategoryAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: softDeleteCategory,
  });
}
export async function restoreCategoryAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: restoreCategory,
  });
}
export async function reorderCategoriesAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: reorderCategoriesInput,
    input,
    run: reorderCategories,
  });
}

// Famílias --------------------------------------------------------------------
export async function createFamilyAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: familyCreateInput,
    input,
    run: createFamily,
  });
}
export async function updateFamilyAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: familyUpdateInput,
    input,
    run: updateFamily,
  });
}
export async function deleteFamilyAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: softDeleteFamily,
  });
}
export async function restoreFamilyAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: restoreFamily,
  });
}
export async function reorderFamiliesAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: reorderFamiliesInput,
    input,
    run: reorderFamilies,
  });
}

// Produtos --------------------------------------------------------------------
export async function createProductAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: productCreateInput,
    input,
    run: createProduct,
  });
}
export async function updateProductAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: productUpdateInput,
    input,
    run: updateProduct,
  });
}
/** DRAFT, REVIEWED ou PUBLISHED. Publicar confere todas as pendências antes. */
export async function setProductStatusAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: productStatusInput,
    input,
    run: setProductStatus,
  });
}
export async function deleteProductAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: softDeleteProduct,
  });
}
export async function restoreProductAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: restoreProduct,
  });
}
export async function reorderProductsAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: reorderProductsInput,
    input,
    run: reorderProducts,
  });
}

// Variantes -------------------------------------------------------------------
export async function createVariantAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: variantCreateInput,
    input,
    run: createVariant,
  });
}
export async function updateVariantAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: variantUpdateInput,
    input,
    run: updateVariant,
  });
}
export async function setDefaultVariantAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: setDefaultVariant,
  });
}
export async function deleteVariantAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: softDeleteVariant,
  });
}
export async function restoreVariantAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: restoreVariant,
  });
}
export async function reorderVariantsAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: reorderVariantsInput,
    input,
    run: reorderVariants,
  });
}

// Especificações --------------------------------------------------------------
export async function createSpecAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: specCreateInput,
    input,
    run: createSpec,
  });
}
export async function updateSpecAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: specUpdateInput,
    input,
    run: updateSpec,
  });
}
export async function deleteSpecAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: deleteSpec,
  });
}
export async function reorderSpecsAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: reorderSpecsInput,
    input,
    run: reorderSpecs,
  });
}

// Mídia do produto ------------------------------------------------------------
export async function linkProductMediaAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: productMediaLinkInput,
    input,
    run: linkProductMedia,
  });
}
export async function updateProductMediaAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: productMediaUpdateInput,
    input,
    run: updateProductMedia,
  });
}
export async function unlinkProductMediaAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: idInput,
    input,
    run: unlinkProductMedia,
  });
}
export async function reorderProductMediaAction(input: unknown) {
  return runCatalogAction({
    ...catalog,
    schema: reorderProductMediaInput,
    input,
    run: reorderProductMedia,
  });
}
