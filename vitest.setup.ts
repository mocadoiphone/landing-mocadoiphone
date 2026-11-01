import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Desmonta o que cada teste renderizou, para os testes não interferirem entre si.
afterEach(() => {
  cleanup();
});

// O jsdom não implementa `<dialog>.showModal()`/`close()` (navegadores reais sim).
if (
  typeof HTMLDialogElement !== "undefined" &&
  !HTMLDialogElement.prototype.showModal
) {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
