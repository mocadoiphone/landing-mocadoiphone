import { type ComponentProps } from "react";

/**
 * Botões do painel (MDI-D025): funcionais e consistentes, só com tokens.
 * `pending` desabilita e sinaliza envio em andamento (evita clique duplo).
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BASE =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-control px-4 text-caption font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  secondary:
    "border border-border bg-background text-foreground hover:bg-surface",
  danger: "bg-danger text-accent-foreground hover:opacity-90",
  ghost: "text-foreground hover:bg-surface",
};

export function buttonClasses(
  variant: ButtonVariant = "secondary",
  extra = "",
) {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

export function Button({
  variant = "secondary",
  pending = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; pending?: boolean }) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {children}
      {pending ? <span aria-hidden="true">…</span> : null}
    </button>
  );
}
