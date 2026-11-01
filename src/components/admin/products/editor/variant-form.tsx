"use client";

import { useEffect } from "react";

import type { EditorVariant } from "@/services/admin/queries";
import {
  createVariantAction,
  updateVariantAction,
} from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { useActionForm } from "../../forms/use-action-form";
import { Button } from "../../ui/button";
import { TextField } from "../../ui/fields";

import { PRICE_FORM_SPEC, PriceFields } from "./price-fields";

/** Criar ou editar variante (Brain §10): capacidade, cor, SKU, preço, disponibilidade. */
export function VariantForm({
  productId,
  variant,
  onDone,
}: {
  productId: string;
  variant: EditorVariant | null;
  onDone: () => void;
}) {
  const { state, formAction, pending, errors } = useActionForm(
    variant ? updateVariantAction : createVariantAction,
    {
      storage: "text",
      colorName: "text",
      colorHex: "text",
      sku: "text",
      ...PRICE_FORM_SPEC,
    },
    variant ? { id: variant.id } : { productId },
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Capacidade"
          name="storage"
          maxLength={40}
          defaultValue={variant?.storage ?? ""}
          hint="Ex.: 256 GB"
          errors={errors("storage")}
        />
        <TextField
          label="Cor"
          name="colorName"
          maxLength={60}
          defaultValue={variant?.color_name ?? ""}
          hint="Ex.: Preto"
          errors={errors("colorName")}
        />
        <TextField
          label="Cor (código)"
          name="colorHex"
          maxLength={7}
          defaultValue={variant?.color_hex ?? ""}
          placeholder="#000000"
          hint="Opcional, formato #RRGGBB. Usado na bolinha de cor."
          errors={errors("colorHex")}
        />
        <TextField
          label="SKU"
          name="sku"
          maxLength={64}
          defaultValue={variant?.sku ?? ""}
          hint="Opcional. Código interno."
          errors={errors("sku")}
        />
      </div>
      <PriceFields
        defaults={{
          priceCash: variant?.price_cash ?? null,
          priceOld: variant?.price_old ?? null,
          priceInstallment: variant?.price_installment ?? null,
          installments: variant?.installments ?? null,
          installmentText: variant?.installment_text ?? null,
          priceOnRequest: variant?.price_on_request ?? false,
          availability: variant?.availability ?? "AVAILABLE",
        }}
        errors={errors}
      />
      {state && !state.ok ? <ActionMessage result={state} /> : null}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" pending={pending}>
          {variant ? "Salvar variante" : "Criar variante"}
        </Button>
      </div>
    </form>
  );
}
