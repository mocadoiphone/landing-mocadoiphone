import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signInWithPassword: mocks.signInWithPassword },
  }),
}));

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tem campos rotulados e botão de envio", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("E-mail")).toBeDefined();
    expect(screen.getByLabelText("Senha")).toBeDefined();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDefined();
  });

  it("valida os dados antes de chamar o Supabase", () => {
    render(<LoginForm />);
    fillAndSubmit("invalido", "");

    expect(screen.getByRole("alert").textContent).toBe(
      "Informe um e-mail válido.",
    );
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("mostra mensagem segura quando as credenciais são inválidas", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", status: 400 },
    });
    render(<LoginForm />);
    fillAndSubmit("dono@exemplo.com", "senha-errada");

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("entra no painel quando o login funciona", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    render(<LoginForm />);
    fillAndSubmit("dono@exemplo.com", "senha-correta");

    await vi.waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/admin"),
    );
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "dono@exemplo.com",
      password: "senha-correta",
    });
  });
});
