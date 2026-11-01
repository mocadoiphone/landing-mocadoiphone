import { parseBRLToCents } from "@/lib/pricing/pricing";

/**
 * Conversão de FormData em objeto tipado para as Server Actions do painel
 * (MDI-D025). Só faz a conversão de formato (texto → número, reais → centavos,
 * checkbox → booleano). A validação de regra continua no servidor (Zod + banco).
 */
export type FieldKind = "text" | "boolean" | "money" | "int" | "list";

export type FormSpec = Record<string, FieldKind>;

export type ParsedForm = {
  values: Record<string, unknown>;
  /** Erros de formato detectados antes do envio (ex.: valor em reais ilegível). */
  errors: Record<string, string[]>;
};

export const MONEY_FORMAT_ERROR = "Valor inválido. Use o formato 8.999,90.";
export const INT_FORMAT_ERROR = "Informe um número inteiro.";

/**
 * - text: ausente → não envia; presente → string (vazia limpa o campo no servidor);
 * - boolean: checkbox marcado → true; desmarcado (ausente) → false;
 * - money: "" → null; "8.999,90" → 899990 centavos;
 * - int: "" → null; "18" → 18;
 * - list: todos os valores do campo (ex.: ids em ordem).
 */
export function parseForm(formData: FormData, spec: FormSpec): ParsedForm {
  const values: Record<string, unknown> = {};
  const errors: Record<string, string[]> = {};

  for (const [name, kind] of Object.entries(spec)) {
    const raw = formData.get(name);
    const text = typeof raw === "string" ? raw.trim() : null;

    switch (kind) {
      case "boolean":
        values[name] = text !== null && text !== "" && text !== "false";
        break;
      case "list":
        values[name] = formData
          .getAll(name)
          .filter((item): item is string => typeof item === "string");
        break;
      case "text":
        if (text !== null) values[name] = text;
        break;
      case "money":
        if (text === null) break;
        if (text === "") {
          values[name] = null;
        } else {
          const cents = parseBRLToCents(text);
          if (cents === null) errors[name] = [MONEY_FORMAT_ERROR];
          else values[name] = cents;
        }
        break;
      case "int":
        if (text === null) break;
        if (text === "") {
          values[name] = null;
        } else if (/^\d+$/.test(text)) {
          values[name] = Number(text);
        } else {
          errors[name] = [INT_FORMAT_ERROR];
        }
        break;
    }
  }

  return { values, errors };
}

/** Centavos → texto do campo em reais ("8.999,90"), para preencher formulários. */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const reais = Math.trunc(cents / 100);
  const centavos = String(cents % 100).padStart(2, "0");
  return `${reais.toLocaleString("pt-BR")},${centavos}`;
}
