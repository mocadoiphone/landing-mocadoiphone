import {
  type AvailabilityStatus,
  isVisibleAvailability,
} from "@/lib/availability/availability";

/**
 * Pré-requisitos de publicação (MDI-D006). Espelho de
 * `app.assert_product_publishable`: aqui todas as pendências aparecem de uma
 * vez, com mensagem amigável; o banco continua garantindo a regra.
 */
export type PublicationIssue =
  | "category_inactive"
  | "family_deleted"
  | "no_visible_variant"
  | "no_main_image";

export const PUBLICATION_ISSUE_MESSAGES: Record<PublicationIssue, string> = {
  category_inactive: "Ative a categoria do produto.",
  family_deleted: "A família do produto foi excluída: escolha outra.",
  no_visible_variant: "Cadastre ao menos uma variante visível.",
  no_main_image: "Defina a imagem principal.",
};

export type PublicationAggregate = {
  category: { isActive: boolean; isDeleted: boolean };
  family: { isDeleted: boolean };
  variants: { availability: AvailabilityStatus; isDeleted: boolean }[];
  /** Imagem principal do produto (sem variante), se houver. */
  mainImage: { assetDeleted: boolean } | null;
};

export function getPublicationIssues(
  aggregate: PublicationAggregate,
): PublicationIssue[] {
  const issues: PublicationIssue[] = [];
  if (!aggregate.category.isActive || aggregate.category.isDeleted) {
    issues.push("category_inactive");
  }
  if (aggregate.family.isDeleted) {
    issues.push("family_deleted");
  }
  if (
    !aggregate.variants.some(
      (variant) =>
        !variant.isDeleted && isVisibleAvailability(variant.availability),
    )
  ) {
    issues.push("no_visible_variant");
  }
  if (!aggregate.mainImage || aggregate.mainImage.assetDeleted) {
    issues.push("no_main_image");
  }
  return issues;
}

export function describePublicationIssues(
  issues: readonly PublicationIssue[],
): string {
  return `Para publicar: ${issues
    .map((issue) => PUBLICATION_ISSUE_MESSAGES[issue])
    .join(" ")}`;
}
