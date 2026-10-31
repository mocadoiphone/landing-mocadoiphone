import { describe, expect, it } from "vitest";

import { signInErrorMessage, signInSchema } from "./sign-in";

describe("signInSchema", () => {
  it("aceita credenciais válidas e remove espaços do e-mail", () => {
    expect(
      signInSchema.parse({ email: "  dono@exemplo.com ", password: "x" }),
    ).toEqual({ email: "dono@exemplo.com", password: "x" });
  });

  it("rejeita e-mail inválido e senha vazia com mensagens em português", () => {
    const result = signInSchema.safeParse({ email: "invalido", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Informe um e-mail válido.",
      "Informe a senha.",
    ]);
  });
});

describe("signInErrorMessage", () => {
  it("credenciais inválidas não revelam se o e-mail existe", () => {
    expect(
      signInErrorMessage({ code: "invalid_credentials", status: 400 }),
    ).toBe("E-mail ou senha inválidos.");
  });

  it("limite de tentativas", () => {
    expect(signInErrorMessage({ code: "over_request_rate_limit" })).toMatch(
      /Muitas tentativas/,
    );
    expect(signInErrorMessage({ status: 429 })).toMatch(/Muitas tentativas/);
  });

  it("falha de conexão", () => {
    expect(signInErrorMessage({ name: "AuthRetryableFetchError" })).toMatch(
      /conectar ao servidor/,
    );
  });

  it("erro desconhecido usa mensagem genérica", () => {
    expect(signInErrorMessage({ status: 500, code: "unexpected" })).toBe(
      "Não foi possível entrar. Tente novamente.",
    );
  });
});
