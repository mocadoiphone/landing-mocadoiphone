import { type Metadata } from "next";
import Link from "next/link";

// Páginas técnicas da Etapa 03 (MDI-D020): sem design final e fora dos buscadores
// até a Etapa 07 (SEO). O layout não consulta dados, para o build não depender do banco.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-content items-center px-gutter py-4">
          <Link
            href="/"
            className="text-body font-semibold focus-visible:outline-2 focus-visible:outline-ring"
          >
            Moça do iPhone
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
