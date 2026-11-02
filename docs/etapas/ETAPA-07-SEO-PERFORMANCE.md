# ETAPA 07 — SEO e Performance

> Data: 2026-11-02 · Papéis: `engenheiro-software.md`, `desenvolvedor.md`, `ui-ux-motion.md`, `seguranca.md`, `qa.md` · Decisões novas: MDI-D037 e MDI-D038 · **Sem migration, sem commit, sem push e sem go-live.**

## Objetivo

Preparar o site público existente para indexação correta, compartilhamento social, desempenho e operação de produção, sem acrescentar funcionalidade comercial nem liberar o site para buscadores antes da decisão de go-live.

## SEO implementado

### Configuração e indexação

- `NEXT_PUBLIC_SITE_URL` define a origem canônica do deploy.
- `NEXT_PUBLIC_SITE_INDEXING_ENABLED` começa como `false` e é o único controle de liberação.
- Ativar indexação exige também uma URL HTTPS explícita; configuração incompleta derruba o build com mensagem clara.
- Enquanto bloqueado:
  - páginas públicas emitem `noindex, nofollow, noarchive`;
  - `robots.txt` emite `Disallow: /`;
  - o sitemap existe para validação, mas não é anunciado no robots.
- Quando a configuração for explicitamente ativada:
  - as páginas permitem `index, follow`;
  - o robots permite o site, bloqueia `/admin`, `/admin/` e `/api/`;
  - o sitemap é anunciado.

### Metadata

- Global: `metadataBase`, nome da aplicação, título com template, descrição, canonical, Open Graph, Twitter/X e robots.
- Categorias: nome, descrição real, canonical próprio, OG/Twitter e imagem da categoria quando existe.
- Produtos:
  - `meta_title` ou nome do produto;
  - `meta_description` ou resumo real;
  - `canonical_url` HTTPS válida ou rota canônica `/produto/<slug>`;
  - imagem OG cadastrada ou imagem principal;
  - sem imagem real, a tag de imagem é omitida;
  - Open Graph e Twitter/X Card usam o mesmo conteúdo validado.
- Ofertas, lançamentos e loja ganharam canonical e metadata social próprios.

Não foi criado favicon, ícone social global ou manifest: não existe ativo oficial autorizado no repositório, e a aplicação ainda não tem requisito de instalação.

## JSON-LD

Implementado com `<script type="application/ld+json">` nativo e escape de `<` para impedir fechamento injetado do elemento.

| Tipo | Quando aparece | Campos reais usados |
|---|---|---|
| `Organization` | em todo o site público | nome e URL normativos |
| `LocalBusiness` | somente quando a loja tem endereço | nome, URL, endereço, telefone e fotos quando presentes |
| `BreadcrumbList` | categoria e produto | Home, categoria e produto com URLs canônicas |
| `Product` | produto publicado | nome, descrição disponível, URL e imagens reais |
| `Offer` | variante visível com preço à vista real | BRL, preço, disponibilidade, URL e rótulo da variante |

Não são gerados: marca, avaliações, nota agregada, GTIN, estoque quantitativo ou SKU de produto. O SKU de variante existente também não foi promovido a SKU do produto.

## Sitemap e robots

`/sitemap.xml` é dinâmico, cacheado pela tag `catalog` e contém:

- Home;
- categorias ativas;
- produtos publicados;
- ofertas;
- lançamentos;
- loja.

Categorias e produtos usam `updated_at` real como `lastModified`. Produto inclui a imagem principal no sitemap quando existe. Admin, login, rascunhos, itens despublicados e rotas técnicas não entram. A seleção continua protegida pela RLS pública.

## Redirects

As URLs antigas já documentadas na MDI-D003 foram implementadas com status 301:

| Origem Wix | Destino atual |
|---|---|
| `/macbook` | `/mac` |
| `/applewatch` | `/apple-watch` |
| `/apple-vision-pro` | `/vision-pro` |

`src/config/redirects.ts` é o mapa versionado. A lista de redirects de slug de produto foi deixada explicitamente vazia: não existem URLs históricas validadas. A Etapa 08 deve inventariar o Wix e definir se o histórico de slugs continua em configuração versionada ou passa a ter modelo próprio.

## Performance

### JavaScript e motion

- A Home continua Server Component.
- GSAP + ScrollTrigger foram separados em chunk assíncrono.
- O controlador só importa o runtime depois da hidratação e apenas quando não há reduced motion.
- Em `prefers-reduced-motion: reduce`, o chunk de GSAP não é solicitado e o cabeçalho também não instala listener de scroll.
- Registro único de ScrollTrigger, `gsap.context`, `matchMedia`, timelines, listeners, observers e `requestAnimationFrame` continuam com cleanup.
- Pinning continua somente no `PRODUCT_STORY` a partir de 1024 px; mobile usa fluxo normal.
- Nenhuma dependência de produção foi adicionada ou removida: as existentes têm uso comprovado.

### Imagens

- `next/image` permanece no site público, restrito ao caminho público do bucket `media` do Supabase configurado.
- `sizes` está definido por composição; mídia fora da primeira dobra continua lazy.
- Preload permanece apenas na mídia provável de LCP: primeiro bloco visual da Home e imagem principal do produto.
- Dimensões persistidas evitam CLS; o fallback 1200 × 1200 permanece apenas para mídia legada sem dimensões.
- Art direction mobile da imagem principal do produto continua com `<picture>` e `getImageProps`.
- Painel permanece `unoptimized`, pois exibe miniaturas e mídia ainda não publicada.
- Não foram encontradas imagens externas fora do bucket permitido.

**Recomendação de produção:** manter o Image Optimization da Vercel no lançamento e monitorar volume de transformações, cache hit e custo. Não há telemetria de produção nesta etapa para justificar troca. Se o catálogo real tornar o custo relevante, comparar o transformador do Supabase com os mesmos tamanhos e formatos antes de alterar.

### Vídeos e fontes

- Vídeos continuam com controles, `playsInline`, sem autoplay e `preload="none"`.
- Pôster só é usado quando há imagem real do bloco.
- Não há Google Fonts nem fonte remota. A pilha de sistema provisória foi preservada; não foi inventada identidade tipográfica.

### LCP, CLS e INP

Elementos prováveis, identificados pela estrutura renderizada:

| Página | LCP provável | Tratamento |
|---|---|---|
| Home | mídia ou título do primeiro bloco | mídia recebe preload apenas se for a primeira; título permanece no HTML |
| Categoria | `h1`/introdução; em catálogo curto, primeiro card | nenhuma imagem abaixo da dobra recebe preload desnecessário |
| Produto | imagem principal | dimensões, `sizes`, art direction e preload |

CLS é mitigado por dimensões/aspect ratios. INP é protegido mantendo o conteúdo no servidor, interações pequenas e motion fora do caminho crítico. LCP/CLS/INP reais não foram inventados: precisam de Lighthouse/Web Vitals em URL publicada com mídia e rede de produção.

## Cache, rendering e build

- O modelo da MDI-D020 foi mantido: `use cache`, `cacheLife("hours")`, `cacheTag` e `updateTag`.
- Tags permanecem:
  - `catalog`: categorias, produtos, variantes, mídia, metadata e sitemap;
  - `home`: blocos da Home;
  - `settings`: WhatsApp, loja e rodapé.
- Produto continua usando `catalog` + `settings`; Home usa as três tags; sitemap usa `catalog`.
- Publicar, editar, despublicar e alterar mídia continuam invalidando `catalog`; conteúdo da Home e configurações invalidam suas tags existentes.
- Produto/categoria inexistente, rascunho, despublicado, categoria inexistente e rota inválida continuam respondendo 404 real.
- A limitação de uma primeira resposta 404 depois de publicar um slug acessado previamente permanece a da MDI-D034.

### Decisão sobre a dependência do Supabase no build

**Manter a dependência e falhar de forma explícita.** O banco é a fonte de verdade de rotas estáticas, metadata e sitemap. Um fallback vazio faria o deploy “passar” com catálogo e descoberta incompletos, escondendo indisponibilidade operacional. A Etapa 10 pode rever disponibilidade do build/cache distribuído com dados do ambiente final, mas não deve mascarar falha do banco.

## Headers de produção

- CSP estática com origem própria e origem exata do Supabase configurado para `connect-src`, `img-src` e `media-src`.
- `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` e `form-action 'self'`.
- `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin` e Permissions Policy restritiva.
- `unsafe-inline` permanece em script/style porque o runtime estático do Next, estilos inline necessários e JSON-LD precisam funcionar. Nonce por requisição não foi adotado: no Next 16.4.3 tornaria todas as páginas dinâmicas, desligaria ISR/CDN/PPR e pioraria o objetivo da etapa.
- HSTS (`max-age=31536000`, sem `includeSubDomains`/`preload`) só é emitido em build de produção com `NEXT_PUBLIC_SITE_URL` HTTPS explícita.
- Nenhum Google Analytics, Meta Pixel ou outro rastreamento foi instalado.

## Métricas realmente medidas

Medição local do build Turbopack, arquivos JavaScript brutos em `.next/static/chunks` (sem gzip/Brotli; não equivale ao JS transferido por uma rota):

| Medida | Antes da Etapa 07 | Depois |
|---|---:|---:|
| Chunks JS | 29 | 31 |
| Bytes JS brutos no diretório | 1.320.852 | 1.337.830 |
| Chunk contendo GSAP/ScrollTrigger | 117.959 bytes | 117.638 bytes |

O aumento bruto total foi de 16.978 bytes e inclui infraestrutura de SEO/client references. O manifest e o código compilado confirmam que o chunk de 117.638 bytes é referenciado por import dinâmico, não pelo conjunto inicial do controlador. O caminho de reduced motion retorna antes do import; o E2E confirma que a cena entra nesse modo reduzido.

O build de produção medido:

- compilou em 15,0 s;
- concluiu TypeScript em 36,2 s;
- gerou 24/24 unidades estáticas em 6,7 s no ambiente configurado;
- registrou `/robots.txt` estático e `/sitemap.xml` com revalidação de 1 h.

Não foram medidos nesta etapa: bytes transferidos por rota, compressão CDN, cache hit da Vercel, custo do Image Optimization, LCP, CLS e INP de produção.

## Testes

| Portão | Resultado |
|---|---|
| Unitários + componentes | **236** testes, 35 arquivos |
| Integração Supabase local | **53** testes, 4 arquivos |
| Build Next 16.4.3 | verde |
| E2E Playwright local | **18** testes: 15 desktop, 2 Pixel 7, 1 sem JavaScript |

Cobertura específica adicionada:

- metadata, canonical, OG, Twitter/X e imagem social;
- robots bloqueado e configuração de liberação;
- sitemap sem admin/rascunhos;
- JSON-LD Product/Offer/Breadcrumb e ausência de avaliações inventadas;
- escape de JSON-LD;
- redirects 301;
- CSP e HSTS condicional;
- 404 real;
- reduced motion sem pinning e sem reação do header;
- cache painel → site, navegação mobile, ausência de overflow e uso sem JavaScript (regressões existentes mantidas).

Os avisos de imagem do E2E continuam vindo do arquivo fictício ausente no Storage local, pendência já registrada na Etapa 05; não representam falha do otimizador nem do teste.

## Riscos e pendências

- Indexação continua deliberadamente bloqueada até o go-live.
- URL final precisa ser configurada explicitamente antes da liberação.
- Identidade oficial, logo, favicon, ícones e imagem social global ainda não foram fornecidos.
- Inventário completo de URLs do Wix e histórico real de slugs: Etapa 08.
- Migração do Wix e catálogo real não foram iniciados.
- Core Web Vitals e custos da Vercel dependem de tráfego, rede e mídia reais.
- A CSP estática é menos estrita que uma CSP por nonce; a escolha preserva páginas estáticas e deve ser reavaliada se scripts de terceiros forem aprovados.
- A disponibilidade do Supabase continua sendo requisito do build; monitoramento e estratégia de deploy pertencem à Etapa 10.
- Limitação do primeiro 404 após publicação de slug previamente visitado permanece (MDI-D034).
- O seed local ainda referencia uma imagem inexistente.

## Fora do escopo confirmado

- nenhuma migration;
- nenhum `db push`;
- nenhuma migração/importação do Wix;
- nenhum checkout, pagamento, CRM, analytics, pixel, campanha ou go-live;
- Etapa 08 não iniciada.
