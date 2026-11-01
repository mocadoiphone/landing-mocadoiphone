"use client";

import type { CategoryOption } from "@/services/admin/queries";
import { updateProductAction } from "@/services/catalog/actions";

import { ActionMessage } from "../../forms/action-message";
import { useActionForm } from "../../forms/use-action-form";
import { Button } from "../../ui/button";
import { SelectField, TextAreaField, TextField } from "../../ui/fields";
import { CategoryFamilyFields } from "../category-family-fields";

/** Aba Geral (Brain §17): nome, slug, categoria, família, resumo, descrição. */
export function GeneralForm({
  product,
  categories,
  relatedOptions,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    category_id: string;
    family_id: string;
    short_description: string | null;
    description: string | null;
    badge: string | null;
    related_product_id: string | null;
    status: string;
  };
  categories: CategoryOption[];
  relatedOptions: { id: string; name: string }[];
}) {
  const { state, formAction, pending, errors } = useActionForm(
    updateProductAction,
    {
      name: "text",
      slug: "text",
      categoryId: "text",
      familyId: "text",
      shortDescription: "text",
      description: "text",
      badge: "text",
      relatedProductId: "text",
    },
    { id: product.id },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        label="Nome"
        name="name"
        required
        maxLength={160}
        defaultValue={product.name}
        errors={errors("name")}
      />
      <TextField
        label="Endereço (slug)"
        name="slug"
        maxLength={120}
        defaultValue={product.slug}
        hint={
          product.status === "PUBLISHED"
            ? "Atenção: mudar o endereço de um produto publicado quebra links antigos."
            : "Usado na URL /produto/… Só letras minúsculas, números e hífens."
        }
        errors={errors("slug")}
      />
      <CategoryFamilyFields
        categories={categories}
        defaultCategoryId={product.category_id}
        defaultFamilyId={product.family_id}
        categoryErrors={errors("categoryId")}
        familyErrors={errors("familyId")}
      />
      <TextAreaField
        label="Resumo"
        name="shortDescription"
        maxLength={300}
        defaultValue={product.short_description ?? ""}
        hint="Até 300 caracteres. Aparece nos cards."
        errors={errors("shortDescription")}
      />
      <TextAreaField
        label="Descrição"
        name="description"
        maxLength={10000}
        rows={8}
        defaultValue={product.description ?? ""}
        hint="Texto simples; quebras de linha são mantidas."
        errors={errors("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Selo"
          name="badge"
          maxLength={40}
          defaultValue={product.badge ?? ""}
          hint="Ex.: Novo, Lançamento. Até 40 caracteres."
          errors={errors("badge")}
        />
        <SelectField
          label="Produto relacionado"
          name="relatedProductId"
          defaultValue={product.related_product_id ?? ""}
          placeholder="Nenhum"
          options={relatedOptions.map((option) => ({
            value: option.id,
            label: option.name,
          }))}
          errors={errors("relatedProductId")}
        />
      </div>
      <ActionMessage result={state} />
      <Button
        type="submit"
        variant="primary"
        pending={pending}
        className="w-fit"
      >
        Salvar dados gerais
      </Button>
    </form>
  );
}
