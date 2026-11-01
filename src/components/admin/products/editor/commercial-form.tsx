"use client";

import Link from "next/link";

import { variantPrice } from "@/lib/pricing/pricing";
import { AVAILABILITY_LABELS } from "@/lib/availability/availability";
import type { EditorVariant } from "@/services/admin/queries";
import {
  updateProductAction,
  updateVariantAction,
} from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { type ActionResult, useActionForm } from "../../forms/use-action-form";
import { Button, buttonClasses } from "../../ui/button";
import { CheckboxField } from "../../ui/fields";

import { PRICE_FORM_SPEC, PriceFields } from "./price-fields";
import { variantName, variantPriceFields } from "./variant-utils";

/**
 * Aba Comercial (Brain §17): destaques do produto e, se houver uma única variante,
 * preço, parcelamento e disponibilidade dela (MDI-D005: preço vive na variante).
 */
export function CommercialForm({
  product,
  variants,
}: {
  product: {
    id: string;
    is_launch: boolean;
    is_featured: boolean;
    is_promotion: boolean;
  };
  variants: EditorVariant[];
}) {
  const active = variants.filter((variant) => variant.deleted_at === null);
  const single = active.length === 1 ? active[0] : undefined;

  const save = async (input: unknown): Promise<ActionResult> => {
    const values = input as Record<string, unknown>;
    const flags = await updateProductAction({
      id: product.id,
      isLaunch: values.isLaunch,
      isFeatured: values.isFeatured,
      isPromotion: values.isPromotion,
    });
    if (!flags.ok || !single) return flags;
    return updateVariantAction({
      id: single.id,
      priceCash: values.priceCash,
      priceOld: values.priceOld,
      priceInstallment: values.priceInstallment,
      installments: values.installments,
      installmentText: values.installmentText,
      priceOnRequest: values.priceOnRequest,
      availability: values.availability,
    });
  };

  const { state, formAction, pending, errors } = useActionForm(save, {
    isLaunch: "boolean",
    isFeatured: "boolean",
    isPromotion: "boolean",
    ...(single ? PRICE_FORM_SPEC : {}),
  });

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-body font-semibold">Destaques</legend>
        <CheckboxField
          label="Lançamento"
          name="isLaunch"
          defaultChecked={product.is_launch}
          hint="Aparece em /lancamentos e na seção de lançamentos."
        />
        <CheckboxField
          label="Destaque"
          name="isFeatured"
          defaultChecked={product.is_featured}
        />
        <CheckboxField
          label="Promoção"
          name="isPromotion"
          defaultChecked={product.is_promotion}
          hint="Aparece em /ofertas."
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-body font-semibold">
          Preço e disponibilidade
        </legend>
        {single ? (
          <>
            <p className="text-caption text-muted">
              Produto com variante única: os valores abaixo são os da variante “
              {variantName(single)}”.
            </p>
            <PriceFields
              defaults={{
                priceCash: single.price_cash,
                priceOld: single.price_old,
                priceInstallment: single.price_installment,
                installments: single.installments,
                installmentText: single.installment_text,
                priceOnRequest: single.price_on_request,
                availability: single.availability,
              }}
              errors={errors}
            />
          </>
        ) : active.length === 0 ? (
          <p className="text-caption">
            Nenhuma variante ainda. O preço e a disponibilidade ficam na
            variante:{" "}
            <Link
              href={`/admin/produtos/${product.id}?aba=variantes`}
              className="underline"
            >
              cadastre a primeira na aba Variantes
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-caption text-muted">
              Este produto tem {active.length} variantes: cada uma tem seu preço
              e disponibilidade.
            </p>
            <ul className="divide-y divide-border rounded-card border border-border text-caption">
              {active.map((variant) => {
                const price = variantPrice(variantPriceFields(variant));
                return (
                  <li
                    key={variant.id}
                    className="flex flex-wrap justify-between gap-2 px-3 py-2"
                  >
                    <span>{variantName(variant)}</span>
                    <span>
                      {price.kind === "priced" ? price.amount : price.label} ·{" "}
                      {AVAILABILITY_LABELS[variant.availability]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link
              href={`/admin/produtos/${product.id}?aba=variantes`}
              className={buttonClasses("secondary", "w-fit")}
            >
              Editar variantes
            </Link>
          </div>
        )}
      </fieldset>

      <ActionMessage result={state} />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar comercial
      </Button>
    </form>
  );
}
