import { type ReactNode } from "react";

/**
 * Seção do site público com tema próprio (Brain §7.1, §18; MDI-D013): claro ou
 * escuro por seção, sem duplicar classes de cor.
 */
export function Section({
  theme = "light",
  labelledBy,
  label,
  tight = false,
  className = "",
  children,
}: {
  theme?: "light" | "dark";
  labelledBy?: string;
  label?: string;
  tight?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      data-theme={theme}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={`${tight ? "py-section-tight" : "py-section"} ${className}`.trim()}
    >
      {children}
    </section>
  );
}

/** Texto de apoio acima do título ("Novo", "Lançamento"…). */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-eyebrow font-semibold tracking-wide text-muted uppercase">
      {children}
    </p>
  );
}

/** Cabeçalho padrão de seção: apoio, título e subtítulo. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  align = "start",
  level = 2,
}: {
  id?: string;
  eyebrow?: string | null;
  title: string | null;
  subtitle?: string | null;
  align?: "start" | "center";
  level?: 1 | 2;
}) {
  if (!title && !eyebrow && !subtitle) return null;
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div
      className={`flex max-w-narrow flex-col gap-3 ${align === "center" ? "mx-auto items-center text-center" : ""}`}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {title ? (
        <Heading
          id={id}
          className={`${level === 1 ? "text-display-lg" : "text-display-md"} font-semibold text-balance`}
        >
          {title}
        </Heading>
      ) : null}
      {subtitle ? (
        <p className="text-lead text-pretty text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
