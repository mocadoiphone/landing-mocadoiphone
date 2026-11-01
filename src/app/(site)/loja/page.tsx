import { type Metadata } from "next";

import { EmptyCatalog } from "@/components/product/empty-catalog";
import { StoreSection } from "@/components/sections/store-section";
import { getStore } from "@/services/site/queries";

export const metadata: Metadata = { title: "Loja física" };

// Loja física (Brain §6, §7.7; MDI-D031): conteúdo de Configurações › Loja física.
export default async function StorePage() {
  const store = await getStore();
  const hasContent = store.addressLines.length > 0 || store.hours.length > 0;

  if (!hasContent) {
    return (
      <main className="mx-auto flex w-full max-w-wide flex-col gap-10 px-gutter py-section">
        <h1 className="text-display-lg font-semibold">Loja física</h1>
        <EmptyCatalog
          title="Endereço e horários em breve."
          description="Enquanto isso, fale com a gente pelo WhatsApp."
          whatsappUrl={store.whatsappUrl}
        />
      </main>
    );
  }

  return (
    <main>
      <StoreSection store={store} headingLevel={1} />
    </main>
  );
}
