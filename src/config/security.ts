export type SecurityHeader = { key: string; value: string };

function originOf(url: string | undefined): string | null {
  return url ? new URL(url).origin : null;
}

export function createSecurityHeaders({
  supabaseUrl,
  productionHttps,
  development,
}: {
  supabaseUrl: string | undefined;
  productionHttps: boolean;
  development: boolean;
}): SecurityHeader[] {
  const supabaseOrigin = originOf(supabaseUrl);
  const remoteSource = supabaseOrigin ? ` ${supabaseOrigin}` : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${remoteSource}`,
    `media-src 'self'${remoteSource}`,
    `connect-src 'self'${remoteSource}${development ? " ws: wss:" : ""}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(productionHttps ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    ...(productionHttps
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
        ]
      : []),
  ];
}
