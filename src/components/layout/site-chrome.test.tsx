import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type SiteChrome } from "@/lib/site/types";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const CHROME: SiteChrome = {
  siteName: "Moça do iPhone",
  categories: [
    {
      id: "c1",
      name: "iPhone",
      slug: "iphone",
      description: null,
      image: null,
    },
    { id: "c2", name: "Mac", slug: "mac", description: null, image: null },
  ],
  hasOffers: false,
  hasLaunches: true,
  contact: {
    phoneLabel: "+55 (11) 3333-4444",
    phoneHref: "tel:+551133334444",
    whatsappLabel: "+55 (11) 99999-9999",
    whatsappUrl: "https://wa.me/5511999999999?text=oi",
  },
  store: {
    name: "Loja",
    description: null,
    addressLines: ["Rua Exemplo, 1"],
    hours: [{ label: "Seg a sáb", value: "10h às 22h" }],
    mapUrl: null,
    photos: [],
    ctaLabel: null,
    whatsappUrl: "https://wa.me/5511999999999?text=oi",
  },
  footer: {
    about: "Sobre a loja",
    socialLinks: [
      {
        network: "INSTAGRAM",
        label: "Instagram",
        url: "https://instagram.com/x",
      },
    ],
    legalName: "Empresa LTDA",
    legalId: "00.000.000/0000-00",
    legalNotice: "Aviso legal",
    copyright: null,
    copyrightLine: "© 2026 Moça do iPhone. Todos os direitos reservados.",
  },
};

describe("SiteHeader", () => {
  it("mostra linhas Apple, lançamentos (ofertas só se houver) e contato", () => {
    render(<SiteHeader chrome={CHROME} />);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(
      within(nav).getByRole("link", { name: "Mac" }).getAttribute("href"),
    ).toBe("/mac");
    expect(
      within(nav).getByRole("link", { name: "Lançamentos" }),
    ).toBeDefined();
    expect(within(nav).queryByRole("link", { name: "Ofertas" })).toBeNull();
    expect(
      screen
        .getAllByRole("link", { name: /Fale no WhatsApp/ })[0]
        ?.getAttribute("href"),
    ).toBe("https://wa.me/5511999999999?text=oi");
    expect(
      screen.getByRole("link", { name: "Pular para o conteúdo" }),
    ).toBeDefined();
  });

  it("menu do celular abre em diálogo e fecha", () => {
    render(<SiteHeader chrome={CHROME} />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const menu = screen.getByRole("dialog", { name: "Menu" });
    expect(menu.hasAttribute("open")).toBe(true);
    expect(
      within(menu).getByRole("link", { name: "Loja física" }),
    ).toBeDefined();
    fireEvent.click(within(menu).getByRole("button", { name: "Fechar" }));
    expect(menu.hasAttribute("open")).toBe(false);
  });

  it("sem contato padrão, o botão leva à loja física", () => {
    render(
      <SiteHeader
        chrome={{
          ...CHROME,
          contact: { ...CHROME.contact, whatsappUrl: null },
        }}
      />,
    );
    expect(
      screen
        .getAllByRole("link", { name: "Visite a loja" })[0]
        ?.getAttribute("href"),
    ).toBe("/loja");
  });
});

describe("SiteFooter", () => {
  it("mostra conteúdo do painel, contato, endereço e copyright", () => {
    render(<SiteFooter chrome={CHROME} />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Sobre a loja")).toBeDefined();
    expect(
      within(footer).getByRole("link", { name: /Instagram/ }),
    ).toBeDefined();
    expect(
      within(footer)
        .getByRole("link", { name: /Telefone/ })
        .getAttribute("href"),
    ).toBe("tel:+551133334444");
    expect(within(footer).getByText("Rua Exemplo, 1")).toBeDefined();
    expect(
      within(footer).getByText("Empresa LTDA · 00.000.000/0000-00"),
    ).toBeDefined();
    expect(
      within(footer).getByText(
        "© 2026 Moça do iPhone. Todos os direitos reservados.",
      ),
    ).toBeDefined();
    expect(footer.getAttribute("data-theme")).toBe("dark");
  });
});
