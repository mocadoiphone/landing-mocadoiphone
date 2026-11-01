"use client";

import { useState } from "react";

import type { CategoryOption } from "@/services/admin/queries";

import { SelectField } from "../ui/fields";

/** Categoria → família dependente (MDI-D004: a família pertence à categoria). */
export function CategoryFamilyFields({
  categories,
  defaultCategoryId = "",
  defaultFamilyId = "",
  categoryErrors,
  familyErrors,
}: {
  categories: CategoryOption[];
  defaultCategoryId?: string;
  defaultFamilyId?: string;
  categoryErrors?: string[] | undefined;
  familyErrors?: string[] | undefined;
}) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [familyId, setFamilyId] = useState(defaultFamilyId);
  const families =
    categories.find((category) => category.id === categoryId)?.families ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label="Categoria"
        name="categoryId"
        required
        value={categoryId}
        placeholder="Escolha a categoria"
        onChange={(event) => {
          setCategoryId(event.target.value);
          setFamilyId("");
        }}
        options={categories.map((category) => ({
          value: category.id,
          label: category.isActive
            ? category.name
            : `${category.name} (inativa)`,
        }))}
        errors={categoryErrors}
      />
      <SelectField
        label="Família"
        name="familyId"
        required
        value={familyId}
        placeholder={
          categoryId
            ? families.length
              ? "Escolha a família"
              : "Categoria sem famílias"
            : "Escolha a categoria primeiro"
        }
        disabled={!categoryId || families.length === 0}
        onChange={(event) => setFamilyId(event.target.value)}
        options={families.map((family) => ({
          value: family.id,
          label: family.name,
        }))}
        errors={familyErrors}
        hint={
          categoryId && families.length === 0
            ? "Crie uma família em Categorias."
            : undefined
        }
      />
    </div>
  );
}
