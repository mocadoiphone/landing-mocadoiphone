import { type Route } from "next";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** Navegação estrutural (MDI-D003: hierarquia expressa por breadcrumb). */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Navegação estrutural" className="text-caption text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-2"
          >
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link
                href={item.href as Route}
                className="inline-flex min-h-8 items-center rounded-control hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
