"use client";

import { useActionState, useCallback, useState, useTransition } from "react";

import { type CatalogResult } from "@/lib/catalog/result";
import { type FormSpec, parseForm } from "@/lib/forms/form-data";

/**
 * Formulários do painel com `useActionState` (MDI-D025). O FormData vira objeto
 * tipado (`lib/forms`); erros de formato aparecem antes do envio, mas a validação
 * que vale é a do servidor (Zod + banco), devolvida no `CatalogResult`.
 */
export type ActionResult = CatalogResult<unknown>;
export type CatalogAction = (input: unknown) => Promise<ActionResult>;

export function errorsFor(
  state: ActionResult | null,
  name: string,
): string[] | undefined {
  if (!state || state.ok) return undefined;
  const fieldErrors = state.error.fieldErrors?.[name];
  if (fieldErrors?.length) return fieldErrors;
  return state.error.field === name ? [state.error.message] : undefined;
}

export function useActionForm(
  action: CatalogAction,
  spec: FormSpec,
  extra: Record<string, unknown> = {},
) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(async (_previous, formData) => {
    const parsed = parseForm(formData, spec);
    if (Object.keys(parsed.errors).length > 0) {
      return {
        ok: false,
        error: {
          code: "validation",
          message: "Revise os campos destacados.",
          fieldErrors: parsed.errors,
        },
      };
    }
    return action({ ...parsed.values, ...extra });
  }, null);

  return {
    state,
    formAction,
    pending,
    errors: (name: string) => errorsFor(state, name),
  };
}

/** Ações de botão (publicar, definir padrão, excluir…): pendente + último resultado. */
export function useActionRunner() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  const run = useCallback(
    (
      action: CatalogAction,
      input: unknown,
      onSuccess?: (result: ActionResult) => void,
    ) => {
      startTransition(async () => {
        const next = await action(input);
        setResult(next);
        if (next.ok) onSuccess?.(next);
      });
    },
    [],
  );

  return { pending, result, run, clear: () => setResult(null) };
}
