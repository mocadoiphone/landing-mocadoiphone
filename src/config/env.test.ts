import { describe, expect, it } from "vitest";

import { parsePublicEnv, requireSupabaseEnv } from "./env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-publica-de-teste",
};

describe("parsePublicEnv", () => {
  it("aceita ambiente sem variáveis (Etapa 01)", () => {
    expect(parsePublicEnv({})).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });
  });

  it("trata strings vazias como ausentes", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "   ",
    });

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
  });

  it("aceita valores válidos, inclusive o Supabase local", () => {
    expect(parsePublicEnv(validEnv)).toEqual(validEnv);
    expect(
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" })
        .NEXT_PUBLIC_SUPABASE_URL,
    ).toBe("http://127.0.0.1:54321");
  });

  it("rejeita URL malformada com mensagem que cita a variável", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "nao-e-uma-url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("requireSupabaseEnv", () => {
  it("falha com mensagem clara quando a configuração está ausente", () => {
    expect(() => requireSupabaseEnv(parsePublicEnv({}))).toThrow(
      /Supabase não configurado/,
    );
    expect(() =>
      requireSupabaseEnv(
        parsePublicEnv({
          NEXT_PUBLIC_SUPABASE_URL: validEnv.NEXT_PUBLIC_SUPABASE_URL,
        }),
      ),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("devolve URL e chave quando ambas existem", () => {
    expect(requireSupabaseEnv(parsePublicEnv(validEnv))).toEqual({
      url: validEnv.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  });
});
