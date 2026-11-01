import type { NextConfig } from "next";

// Valida as variáveis de ambiente ao iniciar `next dev` / `next build` (falha cedo se inválidas).
import { publicEnv } from "./src/config/env";
import { supabaseImageConfig } from "./src/config/images";

// Cabeçalhos de segurança básicos. A CSP completa fica para a Etapa 09 (Segurança e QA).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

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
};

export default nextConfig;
