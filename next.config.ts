import type { NextConfig } from "next";

// Valida as variáveis de ambiente ao iniciar `next dev` / `next build` (falha cedo se inválidas).
import { publicEnv } from "./src/config/env";
import { supabaseImageConfig } from "./src/config/images";
import { legacyRedirects } from "./src/config/redirects";
import { createSecurityHeaders } from "./src/config/security";

const securityHeaders = createSecurityHeaders({
  supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  productionHttps:
    process.env.NODE_ENV === "production" &&
    Boolean(publicEnv.NEXT_PUBLIC_SITE_URL?.startsWith("https://")),
  development: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // Modelo de cache do Next 16 (MDI-D020): `use cache` + tags nas consultas públicas.
  cacheComponents: true,
  partialPrefetching: true,
  // Imagens públicas otimizadas pelo next/image, só do bucket do projeto (MDI-D032).
  images: supabaseImageConfig(publicEnv.NEXT_PUBLIC_SUPABASE_URL),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [...legacyRedirects];
  },
};

export default nextConfig;
