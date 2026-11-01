import Link from "next/link";
import { type Route } from "next";

/**
 * Abas como navegação (MDI-D025): cada aba é uma URL renderizada no servidor,
 * com `aria-current`; funciona sem JavaScript e pode ser compartilhada.
 */
export function TabsNav({
  label,
  tabs,
  current,
}: {
  label: string;
  tabs: { key: string; label: string; href: Route; badge?: string }[];
  current: string;
}) {
  return (
    <nav aria-label={label} className="overflow-x-auto border-b border-border">
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-caption font-medium focus-visible:outline-2 focus-visible:outline-ring ${
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.badge ? (
                  <span className="rounded-control bg-warning px-1.5 text-caption text-accent-foreground">
                    {tab.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
