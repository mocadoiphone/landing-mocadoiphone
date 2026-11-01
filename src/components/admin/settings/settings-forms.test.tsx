import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WhatsappSettingsForm } from "./settings-forms";

vi.mock("@/services/admin/actions", () => ({
  updateWhatsappSettingsAction: vi.fn(),
  updateMediaSettingsAction: vi.fn(),
}));

describe("WhatsappSettingsForm", () => {
  it("sem template salvo, pré-visualiza exatamente o exemplo do Brain §13", () => {
    render(<WhatsappSettingsForm template={null} leadOrigin={null} />);
    expect(
      screen.getByText(
        "Olá! Vi no site da Moça do iPhone o iPhone 17 Pro Max 256 GB Preto e gostaria de consultar disponibilidade e valor.",
      ),
    ).toBeDefined();
  });

  it("a pré-visualização acompanha a edição da mensagem e da origem", () => {
    render(
      <WhatsappSettingsForm
        template="Oi! {produto} ({origem})"
        leadOrigin="Site"
      />,
    );
    expect(screen.getByText("Oi! iPhone 17 Pro Max (Site)")).toBeDefined();
    fireEvent.change(screen.getByLabelText(/Origem do lead/), {
      target: { value: "Instagram" },
    });
    expect(screen.getByText("Oi! iPhone 17 Pro Max (Instagram)")).toBeDefined();
  });
});
