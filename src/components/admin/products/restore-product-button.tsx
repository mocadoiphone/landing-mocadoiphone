"use client";

import { restoreProductAction } from "@/services/catalog/actions";

import { ActionMessage } from "../forms/action-message";
import { useActionRunner } from "../forms/use-action-form";
import { Button } from "../ui/button";

export function RestoreProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const { pending, result, run } = useActionRunner();
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        pending={pending}
        aria-label={`Restaurar ${name}`}
        onClick={() => run(restoreProductAction, { id })}
      >
        Restaurar
      </Button>
      {result && !result.ok ? <ActionMessage result={result} /> : null}
    </div>
  );
}
