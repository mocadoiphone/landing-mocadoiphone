"use client";

import { type Route } from "next";
import Link from "next/link";
import { useRef } from "react";

export type MenuLink = { href: string; label: string; current?: boolean };

/**
 * Menu do celular e tablet (Brain §28). `<dialog>` nativo em modo modal: prende
 * o foco, fecha com Esc e devolve o foco ao botão. Escolher um link fecha o menu.
 */
export function MobileMenu({
  categories,
  links,
  contact,
}: {
  categories: MenuLink[];
  links: MenuLink[];
  contact: { href: string; label: string; external: boolean } | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  const item = (link: MenuLink, large: boolean) => (
    <li key={link.href}>
      <Link
        href={link.href as Route}
        onClick={close}
        aria-current={link.current ? "page" : undefined}
        className={`flex min-h-11 items-center rounded-control focus-visible:outline-2 focus-visible:outline-ring ${large ? "text-heading font-semibold" : "text-lead text-muted"}`}
      >
        {link.label}
      </Link>
    </li>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-2 rounded-pill px-3 text-body font-medium focus-visible:outline-2 focus-visible:outline-ring xl:hidden"
      >
        <span aria-hidden="true" className="flex w-5 flex-col gap-1.5">
          <span className="h-0.5 w-full rounded-pill bg-current" />
          <span className="h-0.5 w-full rounded-pill bg-current" />
        </span>
        Menu
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-background p-0 text-foreground backdrop:bg-foreground/40"
      >
        <div className="mx-auto flex h-full w-full max-w-content flex-col px-gutter">
          <div className="flex h-header shrink-0 items-center justify-end">
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center rounded-pill px-3 text-body font-medium focus-visible:outline-2 focus-visible:outline-ring"
            >
              Fechar
            </button>
          </div>
          <nav
            aria-label="Menu principal"
            className="flex flex-1 flex-col gap-8 overflow-y-auto pb-10"
          >
            <ul className="flex flex-col gap-1">
              {categories.map((link) => item(link, true))}
            </ul>
            {links.length > 0 ? (
              <ul className="flex flex-col gap-1 border-t border-border pt-6">
                {links.map((link) => item(link, false))}
              </ul>
            ) : null}
            {contact ? (
              contact.external ? (
                <a
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="inline-flex min-h-12 items-center justify-center rounded-pill bg-accent px-6 text-body font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {contact.label}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ) : (
                <Link
                  href={contact.href as Route}
                  onClick={close}
                  className="inline-flex min-h-12 items-center justify-center rounded-pill bg-accent px-6 text-body font-medium text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {contact.label}
                </Link>
              )
            ) : null}
          </nav>
        </div>
      </dialog>
    </>
  );
}
