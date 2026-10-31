import { type Metadata } from "next";

// O painel nunca deve ser indexado por buscadores.
export const metadata: Metadata = {
  title: "Painel · Moça do iPhone",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
