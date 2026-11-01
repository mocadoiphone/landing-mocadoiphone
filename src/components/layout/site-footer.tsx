import { type Route } from "next";
import Link from "next/link";
import { type ReactNode } from "react";

import { categoryPath, SITE_ROUTES } from "@/lib/site/routes";
import { type SiteChrome } from "@/lib/site/types";

const LINK =
  "inline-flex min-h-9 items-center rounded-control text-caption text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-caption font-semibold">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Rodapé administrável (Brain §7.8; MDI-D031): textos, redes e dados legais vêm
 * de Configurações › Rodapé; contato e endereço vêm do contato padrão e da loja.
 * Links de navegação são do sistema (nada de link livre).
 */
export function SiteFooter({ chrome }: { chrome: SiteChrome }) {
  const { footer, contact, store } = chrome;
  const navigation = [
    ...(chrome.hasOffers
      ? [{ href: SITE_ROUTES.offers, label: "Ofertas" }]
      : []),
    ...(chrome.hasLaunches
      ? [{ href: SITE_ROUTES.launches, label: "Lançamentos" }]
      : []),
    { href: SITE_ROUTES.store, label: "Loja física" },
  ];
  const legal = [footer.legalName, footer.legalId].filter(Boolean).join(" · ");

  return (
    <footer data-theme="dark" className="border-t border-border">
      <div className="mx-auto flex w-full max-w-wide flex-col gap-12 px-gutter py-section-tight">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="w-fit rounded-control text-lead font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-ring"
            >
              {chrome.siteName}
            </Link>
            {footer.about ? (
              <p className="max-w-text text-caption text-pretty text-muted">
                {footer.about}
              </p>
            ) : null}
            {footer.socialLinks.length > 0 ? (
              <ul
                className="flex flex-wrap gap-x-4 gap-y-1"
                aria-label="Redes sociais"
              >
                {footer.socialLinks.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={LINK}
                    >
                      {link.label}
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {chrome.categories.length > 0 ? (
            <Column title="Linhas Apple">
              <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-1">
                {chrome.categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={categoryPath(category.slug) as Route}
                      className={LINK}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Column>
          ) : null}

          <Column title="Navegação">
            <ul>
              {navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href as Route} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Atendimento">
            <div className="flex flex-col gap-3 text-caption text-muted">
              {contact.whatsappUrl ? (
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK}
                >
                  WhatsApp
                  {contact.whatsappLabel ? `: ${contact.whatsappLabel}` : ""}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ) : null}
              {contact.phoneHref && contact.phoneLabel ? (
                <a href={contact.phoneHref} className={LINK}>
                  Telefone: {contact.phoneLabel}
                </a>
              ) : null}
              {store.addressLines.length > 0 ? (
                <address className="not-italic">
                  {store.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              ) : null}
              {store.hours.length > 0 ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {store.hours.map((row) => (
                    <div key={row.label} className="contents">
                      <dt>{row.label}</dt>
                      <dd className="text-foreground">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </Column>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-caption text-muted">
          {footer.legalNotice ? (
            <p className="max-w-narrow text-pretty">{footer.legalNotice}</p>
          ) : null}
          {legal ? <p>{legal}</p> : null}
          <p>{footer.copyrightLine}</p>
        </div>
      </div>
    </footer>
  );
}
