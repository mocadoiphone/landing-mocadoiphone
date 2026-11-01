import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EditorVariant } from "@/services/admin/queries";

import { PriceFields } from "./price-fields";
import { ProductPreview } from "./product-preview";
import { PublicationPanel } from "./publication-panel";

const mocks = vi.hoisted(() => ({
  setProductStatusAction: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/services/catalog/actions", () => ({
  setProductStatusAction: mocks.setProductStatusAction,
  deleteProductAction: vi.fn(),
  restoreProductAction: vi.fn(),
}));

const variant = (overrides: Partial<EditorVariant>): EditorVariant => ({
  id: "v1",
  sku: null,
  storage: "256 GB",
  color_name: "Preto",
  color_hex: null,
  sort_order: 10,
  is_default: false,
  availability: "AVAILABLE",
  price_cash: 899900,
  price_old: null,
  price_installment: 54990,
  installments: 18,
  installment_text: null,
  price_on_request: false,
  deleted_at: null,
  ...overrides,
});

describe("PublicationPanel (pendências antes de publicar)", () => {
  beforeEach(() => mocks.setProductStatusAction.mockReset());

  it("com pendências: lista o que falta, com link, e Publicar fica desabilitado", () => {
    render(
      <PublicationPanel
        productId="p1"
        slug="iphone-17"
        status="DRAFT"
        isDeleted={false}
        issues={["no_visible_variant", "no_main_image"]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Publicar" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("link", { name: "Defina a imagem principal." })
        .getAttribute("href"),
    ).toBe("/admin/produtos/p1?aba=midia");
    expect(
      screen.getByRole("link", {
        name: "Cadastre ao menos uma variante visível.",
      }),
    ).toBeDefined();
  });

  it("sem pendências: Publicar chama a action com PUBLISHED", () => {
    mocks.setProductStatusAction.mockResolvedValue({ ok: true, data: {} });
    render(
      <PublicationPanel
        productId="p1"
        slug="iphone-17"
        status="REVIEWED"
        isDeleted={false}
        issues={[]}
      />,
    );
    expect(screen.getByText(/Pronto para publicar/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(mocks.setProductStatusAction).toHaveBeenCalledWith({
      id: "p1",
      status: "PUBLISHED",
    });
  });

  it("publicado: oferece Ver no site e Despublicar", () => {
    render(
      <PublicationPanel
        productId="p1"
        slug="iphone-17"
        status="PUBLISHED"
        isDeleted={false}
        issues={[]}
      />,
    );
    expect(
      screen.getByRole("link", { name: /Ver no site/ }).getAttribute("href"),
    ).toBe("/produto/iphone-17");
    expect(screen.getByRole("button", { name: "Despublicar" })).toBeDefined();
  });
});

describe("ProductPreview", () => {
  it("mostra preço do produto, disponibilidade, variante selecionada e publicação", () => {
    render(
      <ProductPreview
        name="iPhone 17"
        status="DRAFT"
        mainImage={null}
        issuesCount={1}
        variants={[
          variant({ id: "a", is_default: true }),
          variant({
            id: "b",
            storage: "512 GB",
            price_cash: 999900,
            installments: null,
            price_installment: null,
            availability: "OUT_OF_STOCK",
          }),
          variant({
            id: "c",
            storage: "1 TB",
            availability: "HIDDEN",
            price_cash: 100,
          }),
        ]}
      />,
    );
    expect(screen.getByText("A partir de")).toBeDefined();
    // Produto (card) e variante padrão selecionada: ambos disponíveis.
    expect(screen.getAllByText("Disponível")).toHaveLength(2);
    expect(screen.getByText(/1 pendência/)).toBeDefined();

    fireEvent.change(screen.getByLabelText("Variante selecionada"), {
      target: { value: "b" },
    });
    expect(screen.getByText("Indisponível")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Variante selecionada"), {
      target: { value: "c" },
    });
    expect(
      screen.getByText("Variante oculta: não aparece no site."),
    ).toBeDefined();
  });
});

describe("PriceFields (pré-visualização ao vivo)", () => {
  it("atualiza preço, parcelamento e 'Consulte valores' enquanto digita", () => {
    render(
      <PriceFields
        defaults={{
          priceCash: null,
          priceOld: null,
          priceInstallment: null,
          installments: null,
          installmentText: null,
          priceOnRequest: false,
          availability: "AVAILABLE",
        }}
        errors={() => undefined}
      />,
    );
    const preview = screen.getByLabelText("Pré-visualização do preço");
    expect(preview.textContent).toContain("Consulte valores");

    fireEvent.change(screen.getByLabelText("Preço à vista (R$)"), {
      target: { value: "8.999" },
    });
    fireEvent.change(screen.getByLabelText("Parcelas"), {
      target: { value: "18" },
    });
    fireEvent.change(screen.getByLabelText("Valor da parcela (R$)"), {
      target: { value: "549,90" },
    });
    expect(preview.textContent?.replace(/\s/g, " ")).toContain("R$ 8.999");
    expect(preview.textContent?.replace(/\s/g, " ")).toContain(
      "ou 18x de R$ 549,90",
    );

    fireEvent.click(screen.getByLabelText("Consulte valores"));
    expect(preview.textContent).toContain("Consulte valores");
  });
});
