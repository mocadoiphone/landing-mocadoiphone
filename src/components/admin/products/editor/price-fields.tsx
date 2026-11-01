"use client";

import { useState } from "react";

import { AvailabilityBadge } from "@/components/catalog/availability-badge";
import { PriceBlock } from "@/components/catalog/price-block";
import {
  AVAILABILITY_LABELS,
  type AvailabilityStatus,
  availabilityView,
} from "@/lib/availability/availability";
import { centsToInput } from "@/lib/forms/form-data";
import { parseBRLToCents, variantPrice } from "@/lib/pricing/pricing";

import {
  CheckboxField,
  MoneyField,
  SelectField,
  TextField,
} from "../../ui/fields";

export type PriceDefaults = {
  priceCash: number | null;
  priceOld: number | null;
  priceInstallment: number | null;
  installments: number | null;
  installmentText: string | null;
  priceOnRequest: boolean;
  availability: AvailabilityStatus;
};

export const PRICE_FORM_SPEC = {
  priceCash: "money",
  priceOld: "money",
  priceInstallment: "money",
  installments: "int",
  installmentText: "text",
  priceOnRequest: "boolean",
  availability: "text",
} as const;

/**
 * Campos de preço e disponibilidade da variante (Brain §11, §12) com
 * pré-visualização AO VIVO, usando as mesmas regras do site.
 */
export function PriceFields({
  defaults,
  errors,
}: {
  defaults: PriceDefaults;
  errors: (name: string) => string[] | undefined;
}) {
  const [cash, setCash] = useState(centsToInput(defaults.priceCash));
  const [old, setOld] = useState(centsToInput(defaults.priceOld));
  const [installment, setInstallment] = useState(
    centsToInput(defaults.priceInstallment),
  );
  const [installments, setInstallments] = useState(
    defaults.installments?.toString() ?? "",
  );
  const [installmentText, setInstallmentText] = useState(
    defaults.installmentText ?? "",
  );
  const [onRequest, setOnRequest] = useState(defaults.priceOnRequest);
  const [availability, setAvailability] = useState<AvailabilityStatus>(
    defaults.availability,
  );

  const count = /^\d+$/.test(installments) ? Number(installments) : null;
  const preview = variantPrice({
    priceCash: cash ? parseBRLToCents(cash) : null,
    priceOld: old ? parseBRLToCents(old) : null,
    priceInstallment:
      installment && count ? parseBRLToCents(installment) : null,
    installments: installment && count ? count : null,
    installmentText: installmentText || null,
    priceOnRequest: onRequest,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            label="Preço à vista (R$)"
            name="priceCash"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            errors={errors("priceCash")}
            hint="Ex.: 8.999,00"
          />
          <MoneyField
            label="Preço “de” (R$)"
            name="priceOld"
            value={old}
            onChange={(e) => setOld(e.target.value)}
            errors={errors("priceOld")}
            hint="Opcional. Aparece riscado; precisa ser maior que o à vista."
          />
          <TextField
            label="Parcelas"
            name="installments"
            inputMode="numeric"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            errors={errors("installments")}
            hint="De 1 a 36."
          />
          <MoneyField
            label="Valor da parcela (R$)"
            name="priceInstallment"
            value={installment}
            onChange={(e) => setInstallment(e.target.value)}
            errors={errors("priceInstallment")}
            hint="Informado pela loja (inclui juros, se houver)."
          />
        </div>
        <TextField
          label="Texto de parcelamento"
          name="installmentText"
          maxLength={120}
          value={installmentText}
          onChange={(e) => setInstallmentText(e.target.value)}
          errors={errors("installmentText")}
          hint="Opcional. Se preenchido, substitui a linha “ou Nx de R$ …”. Ex.: em até 12x sem juros."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Disponibilidade"
            name="availability"
            value={availability}
            onChange={(e) =>
              setAvailability(e.target.value as AvailabilityStatus)
            }
            options={Object.entries(AVAILABILITY_LABELS).map(
              ([value, label]) => ({
                value,
                label:
                  value === "HIDDEN" ? `${label} (não aparece no site)` : label,
              }),
            )}
            errors={errors("availability")}
          />
          <CheckboxField
            label="Consulte valores"
            name="priceOnRequest"
            checked={onRequest}
            onChange={(e) => setOnRequest(e.target.checked)}
            hint="Esconde o preço e mostra “Consulte valores”."
            className="self-end"
          />
        </div>
      </div>
      <aside
        aria-label="Pré-visualização do preço"
        className="flex flex-col gap-2 rounded-card bg-surface p-4"
        aria-live="polite"
      >
        <p className="text-caption text-muted">Pré-visualização</p>
        <PriceBlock price={preview} />
        <AvailabilityBadge availability={availabilityView(availability)} />
        {availability === "HIDDEN" ? (
          <p className="text-caption text-muted">
            Oculta: não aparece no site.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
