import { type ReactNode } from "react";

/** Selos, mensagens e estados vazios do painel. */
export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const BADGE_TONES: Record<Tone, string> = {
  neutral: "border-border text-muted",
  success: "border-success text-success",
  warning: "border-warning text-warning",
  danger: "border-danger text-danger",
  info: "border-accent text-foreground",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-control border px-2 py-0.5 text-caption font-medium whitespace-nowrap ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Mensagem do resultado de um formulário. Sucesso usa `role="status"` (educado);
 * erro usa `role="alert"` (anunciado na hora).
 */
export function FormMessage({
  kind,
  children,
}: {
  kind: "success" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-control border px-3 py-2 text-caption ${
        kind === "error"
          ? "border-danger text-danger"
          : "border-success text-success"
      }`}
    >
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-card border border-dashed border-border p-6">
      <p className="text-body font-semibold">{title}</p>
      {children ? (
        <div className="text-caption text-muted">{children}</div>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-heading font-semibold">{title}</h1>
        {description ? (
          <p className="text-caption text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
