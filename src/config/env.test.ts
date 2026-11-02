import { describe, expect, it } from "vitest";

import { classifySupabaseKey, parsePublicEnv, requireSupabaseEnv } from "./env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_chave_de_teste",
};

// JWT fictício (assinatura falsa) apenas com o payload relevante para o teste.
const fakeJwt = (payload: object) =>
  [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
    Buffer.from(JSON.stringify(payload)).toString("base64url"),
    "assinatura-falsa",
  ].join(".");

describe("classifySupabaseKey", () => {
  it("aceita somente chaves públicas íntegras", () => {
    expect(classifySupabaseKey("sb_publishable_abc123")).toBe("publishable");
    expect(classifySupabaseKey(fakeJwt({ role: "anon" }))).toBe("anon-jwt");
  });

  it("reconhece chaves secretas", () => {
    expect(classifySupabaseKey("sb_secret_abc123")).toBe("secret");
    expect(classifySupabaseKey(fakeJwt({ role: "service_role" }))).toBe(
      "secret",
    );
  });

  it("detecta service_role colada depois de uma chave anon", () => {
    // Caso real: chave anon completa + payload/assinatura restantes da service_role.
    const serviceRemainder = fakeJwt({ role: "service_role" })
      .split(".")
      .slice(1)
      .join(".");
    const pasted = `${fakeJwt({ role: "anon" })}.${serviceRemainder}`;

    expect(classifySupabaseKey(pasted)).toBe("secret");
  });

  it("recusa qualquer outro formato", () => {
    expect(classifySupabaseKey("texto.que.nao-e-jwt")).toBe("invalid");
    expect(classifySupabaseKey("chave-qualquer")).toBe("invalid");
    expect(classifySupabaseKey(fakeJwt({ role: "authenticated" }))).toBe(
      "invalid",
    );
    expect(classifySupabaseKey(`${fakeJwt({ role: "anon" })}.extra`)).toBe(
      "invalid",
    );
  });
});

describe("parsePublicEnv", () => {
  it("aceita ambiente sem variáveis (Etapa 01)", () => {
    expect(parsePublicEnv({})).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_SITE_INDEXING_ENABLED: undefined,
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
    expect(parsePublicEnv(validEnv)).toMatchObject(validEnv);
    expect(
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" })
        .NEXT_PUBLIC_SUPABASE_URL,
    ).toBe("http://127.0.0.1:54321");
  });

  it("só libera indexação com URL HTTPS explícita", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SITE_URL: "https://mocadoiphone.com/",
        NEXT_PUBLIC_SITE_INDEXING_ENABLED: "true",
      }),
    ).toMatchObject({
      NEXT_PUBLIC_SITE_URL: "https://mocadoiphone.com/",
      NEXT_PUBLIC_SITE_INDEXING_ENABLED: "true",
    });
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SITE_INDEXING_ENABLED: "true" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "http:\/\/mocadoiphone.com" }),
    ).toThrow(/https/);
  });

  it("rejeita URL malformada com mensagem que cita a variável", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "nao-e-uma-url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejeita chave secreta na variável pública", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: fakeJwt({ role: "service_role" }),
      }),
    ).toThrow(/chave SECRETA/);
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_secret_abc123" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("rejeita chave em formato não reconhecido", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-qualquer" }),
    ).toThrow(/não é uma chave pública válida/);
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
