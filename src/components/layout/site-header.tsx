import { type Route } from "next";
import Link from "next/link";

import { HeaderMotionController } from "@/components/motion/header-motion-controller";
import { categoryPath, SITE_ROUTES } from "@/lib/site/routes";
import { type SiteChrome } from "@/lib/site/types";

import { type MenuLink, MobileMenu } from "./mobile-menu";

const NAV_LINK =
  "inline-flex min-h-11 items-center whitespace-nowrap rounded-control px-1 text-caption text-foreground/80 transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

/**
 * Cabeçalho do site (Brain §6, §7.4): marca, linhas Apple, ofertas e lançamentos
 * quando houver produtos, e contato. Navegação completa a partir de 1280 px;
 * abaixo disso, botão de menu (celular, tablet e notebook pequeno).
 */
export function SiteHeader({ chrome }: { chrome: SiteChrome }) {
  const categories: MenuLink[] = chrome.categories.map((category) => ({
    href: categoryPath(category.slug),
    label: category.name,
  }));
  const extras: MenuLink[] = [
    ...(chrome.hasOffers
      ? [{ href: SITE_ROUTES.offers, label: "Ofertas" }]
      : []),
    ...(chrome.hasLaunches
      ? [{ href: SITE_ROUTES.launches, label: "Lançamentos" }]
      : []),
  ];
  const contact = chrome.contact.whatsappUrl
    ? {
        href: chrome.contact.whatsappUrl,
        label: "Fale no WhatsApp",
        external: true,
      }
    : { href: SITE_ROUTES.store, label: "Visite a loja", external: false };

  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
      >
        Pular para o conteúdo
      </a>
      <div className="site-header__inner mx-auto flex h-header w-full max-w-wide items-center justify-between gap-6 px-gutter">
        <Link
          href="/"
          className="shrink-0 rounded-control text-lead font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-ring"
        >
          {chrome.siteName}
        </Link>

        <nav aria-label="Principal" className="hidden xl:block">
          <ul className="flex items-center gap-5">
            {[...categories, ...extras].map((link) => (
              <li key={link.href}>
                <Link href={link.href as Route} className={NAV_LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {contact.external ? (
            <a
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-10 items-center rounded-pill bg-accent px-4 text-caption font-medium whitespace-nowrap text-accent-foreground transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex"
            >
              {contact.label}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : (
            <Link
              href={contact.href as Route}
              className="hidden min-h-10 items-center rounded-pill bg-accent px-4 text-caption font-medium whitespace-nowrap text-accent-foreground transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex"
            >
              {contact.label}
            </Link>
          )}
          <MobileMenu
            categories={categories}
            links={[
              ...extras,
              { href: SITE_ROUTES.store, label: "Loja física" },
            ]}
            contact={contact}
          />
        </div>
      </div>
      <HeaderMotionController />
    </header>
  );
}
