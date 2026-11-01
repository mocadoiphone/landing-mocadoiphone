import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./dialog";
import { TextField } from "./fields";
import { TabsNav } from "./navigation";
import { moveItem, ReorderButtons } from "./reorder-buttons";

describe("TextField", () => {
  it("liga label, ajuda e erro ao campo (acessibilidade)", () => {
    render(
      <TextField
        label="Nome"
        name="name"
        hint="Até 160 caracteres."
        errors={["Informe o nome."]}
        required
      />,
    );
    const input = screen.getByLabelText(/Nome/);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const texts = describedBy
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(texts).toEqual(["Até 160 caracteres.", "Informe o nome."]);
    expect(input.hasAttribute("required")).toBe(true);
  });

  it("sem erro, não marca o campo como inválido", () => {
    render(<TextField label="Nome" name="name" />);
    expect(screen.getByLabelText("Nome").hasAttribute("aria-invalid")).toBe(
      false,
    );
  });
});

describe("ordenação por teclado", () => {
  it("moveItem sobe e desce sem sair dos limites", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
  });

  it("botões ↑/↓ enviam a lista completa na nova ordem e desabilitam nas pontas", () => {
    const onReorder = vi.fn();
    render(
      <ReorderButtons
        ids={["a", "b", "c"]}
        index={0}
        label="Item A"
        onReorder={onReorder}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Subir Item A" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Descer Item A" }));
    expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"]);
  });
});

describe("TabsNav", () => {
  it("marca a aba atual com aria-current", () => {
    render(
      <TabsNav
        label="Seções"
        current="midia"
        tabs={[
          { key: "geral", label: "Geral", href: "/admin/produtos" },
          { key: "midia", label: "Mídia", href: "/admin/midia", badge: "!" },
        ]}
      />,
    );
    expect(
      screen.getByRole("link", { name: /Mídia/ }).getAttribute("aria-current"),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Geral" }).hasAttribute("aria-current"),
    ).toBe(false);
  });
});

describe("ConfirmDialog", () => {
  it("mostra a mensagem e confirma ou cancela", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir produto?"
        message="Dá para restaurar depois."
        confirmLabel="Excluir"
        danger
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText("Dá para restaurar depois.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
