"use client";

import { type Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Menu do painel. Recebe só os itens permitidos ao papel (decididos no servidor);
 * esconder itens é UX: cada página e cada action conferem o papel de novo.
 */
export function AdminNav({
  items,
}: {
  items: { href: Route; label: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav aria-label="Painel" className="flex flex-col gap-2">
      <button
        type="button"
        className="inline-flex min-h-10 items-center rounded-control border border-border px-3 text-caption font-medium md:hidden"
        aria-expanded={open}
        aria-controls="menu-painel"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Fechar menu" : "Menu"}
      </button>
      <ul
        id="menu-painel"
        className={`flex-col gap-1 md:flex ${open ? "flex" : "hidden"}`}
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-10 items-center rounded-control px-3 text-caption font-medium focus-visible:outline-2 focus-visible:outline-ring ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-surface"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
