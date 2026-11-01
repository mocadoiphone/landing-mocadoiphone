import { HomeBlocks } from "@/components/sections/home-blocks";
import { siteConfig } from "@/config/site";
import { getHome } from "@/services/home/queries";

// Home administrável por blocos (Brain §7, §18, §19; MDI-D009, MDI-D030).
// Sem bloco válido ativo, usa a composição padrão (linhas, lançamentos, loja).
export default async function HomePage() {
  const home = await getHome();
  const startsWithHero = home.blocks[0]?.type === "HERO_PRODUCT";

  return (
    <main>
      {startsWithHero ? null : <h1 className="sr-only">{siteConfig.name}</h1>}
      {home.blocks.length > 0 ? (
        <HomeBlocks blocks={home.blocks} />
      ) : (
        <section className="mx-auto flex min-h-[50svh] w-full max-w-narrow flex-col justify-center gap-4 px-gutter py-section text-center">
          <p className="text-display-md font-semibold text-balance">
            Novidades em breve.
          </p>
          <p className="text-lead text-muted">
            Estamos preparando o catálogo. Volte em instantes.
          </p>
        </section>
      )}
    </main>
  );
}
