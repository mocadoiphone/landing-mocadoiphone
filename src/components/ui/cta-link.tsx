import { type Route } from "next";
import Link from "next/link";
import { type ReactNode } from "react";

export type CtaVariant = "primary" | "secondary" | "text";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 text-body font-medium transition-[background-color,color,opacity,transform] duration-200 ease-premium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const VARIANTS: Record<CtaVariant, string> = {
  primary:
    "rounded-pill bg-accent px-6 text-accent-foreground hover:opacity-85 active:scale-[0.98]",
  secondary:
    "rounded-pill border border-current px-6 text-foreground hover:bg-surface active:scale-[0.98]",
  text: "rounded-control px-1 text-foreground underline-offset-4 hover:underline",
};

export function ctaClasses(
  variant: CtaVariant = "primary",
  extra = "",
): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

/**
 * Botão-link do site público. Destinos internos usam `Link`; externos (WhatsApp)
 * abrem em nova aba com aviso para leitor de tela.
 */
export function CtaLink({
  href,
  external = false,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  external?: boolean;
  variant?: CtaVariant;
  className?: string;
  children: ReactNode;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={ctaClasses(variant, className)}
      >
        {children}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    );
  }
  return (
    <Link href={href as Route} className={ctaClasses(variant, className)}>
      {children}
    </Link>
  );
}
