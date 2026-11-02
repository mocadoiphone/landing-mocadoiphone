# ETAPA 06 — Motion e Storytelling

> Data: 2026-11-02 · Papéis: `engenheiro-software.md`, `ui-ux-motion.md`, `desenvolvedor.md`, `qa.md` · Decisão nova: MDI-D036 · **Sem migration e sem push remoto.**

## Objetivo

Criar um sistema de motion coerente e reutilizável para o site público, com o produto como protagonista, sem transformar conteúdo em JavaScript nem comprometer navegação, acessibilidade, mobile ou desempenho.

A referência iStore foi usada apenas para auditar padrões de experiência: objeto persistente durante a narrativa, texto em sequência, mudança moderada de escala, respiro e transição entre cenas. Código, imagens, textos e ativos da referência não foram copiados.

## Auditoria do estado anterior

- A Home já era composta no servidor pelos 11 tipos de `homepage_sections` e tinha somente microinterações CSS.
- Só menu móvel e configurador de variante eram Client Components.
- `PRODUCT_STORY` já recebia produto, imagem, texto e até seis destaques do painel; não foi necessário mudar o modelo.
- Imagens públicas já passavam por `next/image`, com dimensões, `sizes`, lazy loading e preload apenas na primeira dobra (MDI-D032).
- O cabeçalho já era sticky; o painel de compra do produto já era sticky no desktop; a barra de WhatsApp já era fixa no celular.
- Breakpoints relevantes: 768 px para composições em duas colunas e 1024 px para a cena sticky de produto. A navegação completa continua em 1280 px.
- `assets-21/macbook.txt` apareceu em um commit genérico de ativos, sem comprovação de origem ou licença. Não foi importado, copiado nem usado. `modelo-tela.jpg` também não foi necessário.

## Sistema implementado

### Camada central

`src/lib/motion/` concentra:

- `gsap.ts`: registro único do ScrollTrigger no navegador;
- `reduced-motion.ts`: decisão segura para movimento reduzido e ambientes sem `matchMedia`;
- `reveal.ts`: reveal progressivo leve com IntersectionObserver;
- `text-reveal.ts`: entrada editorial de textos;
- `parallax.ts`: parallax curto baseado em transform;
- `scroll-progress.ts`: parâmetros comuns de progressão, sem scroll hijacking;
- `sticky-product.ts`: cena responsiva do produto em destaque;
- `scenes.ts`: composição das cenas de Hero, mídia, texto/mídia e produto.

`src/components/motion/` contém somente controladores client-side pequenos. Eles não recebem dados do banco e não renderizam o conteúdo principal.

### Blocos da Home

| Bloco | Movimento | Decisão |
|---|---|---|
| `HERO_PRODUCT` | palavras do título em etapas; apoio, subtítulo, preço e CTAs em sequência; mídia entra com escala curta e reage ao scroll | CTA continua legível; mídia e textos seguem no HTML |
| `PRODUCT_STORY` | produto fixado e escalado no desktop; texto e destaques entram conforme o progresso | pinning só ≥1024 px; conteúdo do painel; principal cena da etapa |
| `FULLSCREEN_MEDIA` | texto separado; parallax e zoom leves da mídia | vídeo continua sem autoplay e com `preload="none"` |
| `TEXT_AND_MEDIA` | texto e mídia entram separadamente; diferença curta de velocidade no desktop | fluxo normal no mobile |
| `PRODUCT_GRID` | reveal e stagger discreto dos cards | sem timeline complexa |
| `CATEGORY_GRID` | reveal e stagger discreto | sem parallax |
| `FEATURES`, `PROMO_BANNER`, `STORE`, `REVIEWS`, `CTA` | composição praticamente estática | informação e conversão têm prioridade |

### Página de produto

- Galeria e painel comercial entram de forma curta e independente.
- O painel de compra sticky existente foi preservado.
- A mudança de variante atualiza a mídia com transição CSS curta, sem interferir em preço, disponibilidade, rádios ou WhatsApp.
- A barra fixa de WhatsApp no celular não mudou.

### Cabeçalho

- Continua sempre visível.
- Após 24 px de scroll, reforça superfície e sombra e reduz visualmente o conteúdo com transform discreto.
- O listener é passivo, limitado por `requestAnimationFrame` e removido no cleanup.

## Estratégia por dispositivo

### Desktop

- Pinning e scrub somente no `PRODUCT_STORY`.
- Hero, fullscreen e texto/mídia usam transform/opacity e progressão curta.
- O scroll continua nativo; não há normalizador nem scroll artificial.

### Mobile e tablet

- Nenhum pinning longo.
- `PRODUCT_STORY` volta ao fluxo normal e usa só reveal curto.
- Parallax é removido abaixo do breakpoint da cena.
- Carrosséis nativos, menu, CTAs e barra fixa do produto permanecem acessíveis.

### Movimento reduzido

Quando `prefers-reduced-motion: reduce` está ativo:

- os controladores marcam a cena como reduzida e não iniciam GSAP;
- não existem ScrollTriggers, pin spacers, scrub ou parallax;
- reveals ficam visíveis imediatamente;
- a neutralização global de animações/transições continua como segunda camada;
- nenhuma informação ou ação depende da animação.

## Performance

- Somente `transform` e `opacity` são animados nas cenas.
- `will-change` existe apenas enquanto uma cena está aprimorada.
- GSAP fica nas cenas narrativas; grades não o carregam para seus reveals.
- Imagens, `sizes`, lazy loading e preload da Etapa 05 foram preservados.
- Timelines, media queries, observers, listeners e ScrollTriggers têm cleanup.
- A Home não virou Client Component.

## Testes

- Unitário: preferência de movimento reduzido e fallback sem `matchMedia`.
- Componente: conteúdo completo do storytelling existe no HTML.
- E2E desktop: Home, header reagindo ao scroll, categoria, produto, variante, WhatsApp e movimento reduzido sem pin spacer.
- E2E mobile: menu, navegação, WhatsApp, ausência de overflow horizontal e ausência de pin spacer.
- E2E sem JavaScript: Home e produto mantêm títulos, dados, especificações e WhatsApp.

| Portão | Resultado |
|---|---|
| `npm run check` | verde: lint, tipos, formatação e **227** testes em **32** arquivos |
| `npm run build` | verde no Next.js 16.4.3; build local também gerou as **31** páginas do seed |
| `npm run test:integration` | verde: **53** testes em **4** arquivos |
| `npm run test:e2e` | verde: **16** testes — 13 desktop, 2 Pixel 7 e 1 sem JavaScript |

O Supabase CLI local demorou vários minutos para responder neste Windows. O timeout de inicialização do `webServer` foi ampliado para 20 min; o timeout de cada teste permanece em 180 s. Para diagnóstico, `E2E_SKIP_BUILD=1` permite reutilizar somente um build local já gerado; o comando padrão continua criando o próprio build e sempre valida que o Supabase é local.

Não houve mudança de schema ou seed, portanto `db:reset` e `db:test` não foram necessários nesta etapa.

## Decisão

MDI-D036 registra o sistema progressivo por cenas. Nenhuma outra decisão arquitetural foi necessária.

## Riscos e pendências

- A qualidade final depende das imagens cadastradas terem recorte e resolução adequados; motion não corrige ativo ruim.
- A identidade oficial continua pendente (MDI-D033).
- O custo real de GSAP e do otimizador de imagens na Vercel deve ser medido na Etapa 07/10 com dados de produção.
- O seed local não possui um `PRODUCT_STORY`; o componente e seu fallback são cobertos no teste de componente, e a cena usa qualquer bloco válido criado no painel.
- Coleções e blocos editoriais do produto continuam fora do escopo (MDI-D035).
- Etapa 07 não foi iniciada.
