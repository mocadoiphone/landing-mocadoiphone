import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("página técnica", () => {
  it("exibe o nome do projeto e o status da fundação", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Moça do iPhone 2.0" }),
    ).toBeDefined();
    expect(screen.getByText("Fundação técnica inicializada.")).toBeDefined();
  });
});
