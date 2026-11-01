import { describe, expect, it } from "vitest";

import { MEDIA_PUBLIC_PATH, supabaseImageConfig } from "./images";

describe("supabaseImageConfig", () => {
  it("aceita só o caminho público do bucket do projeto remoto", () => {
    expect(supabaseImageConfig("https://abcdefgh.supabase.co")).toEqual({
      remotePatterns: [
        {
          protocol: "https",
          hostname: "abcdefgh.supabase.co",
          port: "",
          pathname: MEDIA_PUBLIC_PATH,
        },
      ],
      dangerouslyAllowLocalIP: false,
    });
  });

  it("libera IP local só para o Supabase local", () => {
    const local = supabaseImageConfig("http://127.0.0.1:54321");
    expect(local.dangerouslyAllowLocalIP).toBe(true);
    expect(local.remotePatterns[0]).toMatchObject({
      protocol: "http",
      hostname: "127.0.0.1",
      port: "54321",
    });
  });

  it("sem Supabase configurado, não aceita nenhuma imagem remota", () => {
    expect(supabaseImageConfig(undefined)).toEqual({
      remotePatterns: [],
      dangerouslyAllowLocalIP: false,
    });
  });
});
