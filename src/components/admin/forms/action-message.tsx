import Link from "next/link";

import { FormMessage } from "../ui/feedback";

import { type ActionResult } from "./use-action-form";

/**
 * Mensagem geral do resultado. Erros ligados a um campo já aparecem no campo;
 * aqui fica o resumo (e o aviso de sessão expirada com link para entrar).
 */
export function ActionMessage({
  result,
  success = "Alterações salvas.",
}: {
  result: ActionResult | null;
  success?: string;
}) {
  if (!result) return null;
  if (result.ok) return <FormMessage kind="success">{success}</FormMessage>;
  return (
    <FormMessage kind="error">
      {result.error.message}
      {result.error.code === "unauthorized" ? (
        <>
          {" "}
          <Link href="/admin/login" className="underline">
            Entrar novamente
          </Link>
        </>
      ) : null}
    </FormMessage>
  );
}
