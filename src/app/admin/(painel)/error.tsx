"use client";

import { Button } from "@/components/admin/ui/button";

// Estado de erro das telas do painel: sem detalhes internos.
export default function AdminError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <section className="flex max-w-narrow flex-col gap-3" role="alert">
      <h1 className="text-heading font-semibold">
        Não foi possível carregar esta tela
      </h1>
      <p className="text-body text-muted">
        Verifique a conexão e tente de novo. Se continuar, avise o responsável.
      </p>
      <Button variant="primary" onClick={() => retry()} className="w-fit">
        Tentar novamente
      </Button>
    </section>
  );
}
