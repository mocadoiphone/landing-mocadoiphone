"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { CategoryOption } from "@/services/admin/queries";
import { createProductAction } from "@/services/catalog/actions";

import { ActionMessage } from "../forms/action-message";
import { useActionForm } from "../forms/use-action-form";
import { Button } from "../ui/button";
import { TextAreaField, TextField } from "../ui/fields";

import { CategoryFamilyFields } from "./category-family-fields";

/** Novo produto: nasce rascunho (Brain §35) e segue para a aba Comercial. */
export function ProductCreateForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const { state, formAction, pending, errors } = useActionForm(
    createProductAction,
    {
      name: "text",
      slug: "text",
      categoryId: "text",
      familyId: "text",
      shortDescription: "text",
    },
  );

  useEffect(() => {
    if (state?.ok) {
      const created = state.data as { id: string };
      router.push(`/admin/produtos/${created.id}?aba=comercial`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex max-w-narrow flex-col gap-4">
      <TextField
        label="Nome"
        name="name"
        required
        maxLength={160}
        errors={errors("name")}
      />
      <TextField
        label="Endereço (slug)"
        name="slug"
        maxLength={120}
        hint="Deixe em branco para gerar a partir do nome. Ex.: iphone-17-pro-max."
        errors={errors("slug")}
      />
      <CategoryFamilyFields
        categories={categories}
        categoryErrors={errors("categoryId")}
        familyErrors={errors("familyId")}
      />
      <TextAreaField
        label="Resumo"
        name="shortDescription"
        maxLength={300}
        hint="Até 300 caracteres. Aparece nos cards."
        errors={errors("shortDescription")}
      />
      {state && !state.ok ? <ActionMessage result={state} /> : null}
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Criar rascunho
      </Button>
    </form>
  );
}
