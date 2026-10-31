# ETAPA 00 — Auditoria técnica e plano de execução

> **Projeto:** Moça do iPhone 2.0 · **Agente:** `engenheiro-software.md` · **Data:** 2026-10-30
> **Fonte normativa:** `moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md`. Em caso de conflito, o Brain prevalece até que uma nova decisão MDI seja registrada.
> **Decisões estruturais:** [`docs/decisoes/REGISTRO-DE-DECISOES.md`](../decisoes/REGISTRO-DE-DECISOES.md)

## Contexto

Esta etapa audita o repositório antes de qualquer código. Ela compara o estado atual com o Brain e propõe arquitetura, domínios, modelo Supabase, plano de MVP e as primeiras decisões MDI. Nesta etapa não houve implementação, migrations nem deploy.

**Achado central: o projeto é greenfield.** `C:\projetos\moca-do-iphone` contém **apenas** a pasta `moca-do-iphone-brain/` (Brain + README + 7 agentes = 9 arquivos). Não há código, `package.json`, configuração Next/TS/Tailwind, rotas, banco, `.env` nem repositório git. O site atual roda no **Wix**, então não existe código legado reaproveitável, apenas conteúdo a migrar depois de validado.

**Decisões tomadas pelo responsável nesta etapa:**
- URL de produto: **`/produto/[slug]`**
- WhatsApp: **somente contato padrão** no MVP
- Coleções: **listas curadas de produtos**

---

## 1. ETAPA 1: Auditoria do repositório

| Item | Encontrado |
|---|---|
| Estrutura | `moca-do-iphone-brain/{BRAIN-MOCA-DO-IPHONE.md, README.md, agents/*.md}`. Nada mais. |
| package.json / dependências | Não existem |
| Next.js / TypeScript / Tailwind | Não configurados |
| Componentes / rotas | Não existem |
| Banco | Nenhum projeto Supabase da Moça. A org "Athrios" (plano **Pro**) já tem `Ambitask` e `luv-platform`. |
| Integrações / env vars | Nenhuma |
| Controle de versão | **A pasta não é um repositório git** |
| Toolchain local | Node 22.15.1, npm 11.21, git 2.45, Supabase CLI 2.109.1, Docker 29.9 em execução. Sem pnpm e sem Vercel CLI. |
| Versões atuais (npm, hoje) | next 16.4.3 · react 19.3.1 · tailwindcss 4.3.3 · gsap 3.15.0 · @gsap/react 2.1.2 · motion 14.9.0 · @supabase/supabase-js 2.118.0 · @supabase/ssr 0.12.7 · zod 4.6.7 · vitest 5.0.5 · @playwright/test 1.64.1 |

**Site atual (mocadoiphone.com, Wix), para inventário de migração:**
- Menu: MacBook, iPad, AirPods, Apple Watch, iPhone, "Mais".
- URLs legadas: `/macbook`, `/iphone`, `/apple-vision-pro`, `/applewatch`, `/ipad`, `/airpods`.
- Preços exibidos **somente como parcela mensal** ("A partir de R$ X/mês"), sem preço à vista. A tabela completa é enviada pelo WhatsApp.
- WhatsApp via `api.whatsapp.com/send` com 3 números fixos por área (vendas, tabela/encomendas/Vision Pro, TV e Casa/acessórios) e mensagens pré-preenchidas.
- Loja física na Av. Paulista: seg–qui 10h–20h, sex 10h–17h. Os dados precisam ser validados pelo cliente.
- Imagens servidas por `static.wixstatic.com`. A origem e a licença de cada imagem são desconhecidas.

**Referência iStore:** SPA React + Tailwind v4 + Framer Motion (sem GSAP), com `position: sticky`, `100svh` e `prefers-reduced-motion`. Ela serve de referência de ritmo e experiência, não de stack: pelo Brain §5, GSAP continua sendo o padrão para storytelling.

**Código legado:** nenhum. **Reaproveitável:** Brain e agentes (normativos); do Wix, somente conteúdo validado (estrutura de categorias, endereço, horários, mapa de URLs). **Remover futuramente:** nada no repositório. **Dependências desnecessárias:** nenhuma, porque não há dependências.

### Inconsistências e lacunas do próprio Brain
Elas serão resolvidas por decisões MDI. O Brain não será editado.

| # | Lacuna | Resolução proposta |
|---|---|---|
| I1 | §11 lista `installment_text` e `price_on_request`, mas §21 `product_variants` não tem esses campos | Adicionar à variante (D005) |
| I2 | §9/§17 pedem SEO, produto relacionado, vídeos, benefícios e seções editoriais; §21 `products` não modela nada disso | Campos SEO + `related_product_id` em `products`; `product_sections` para o conteúdo editorial |
| I3 | O `status` do produto não é definido; §35 define DRAFT/REVIEWED/PUBLISHED; §12 tem HIDDEN como disponibilidade, o que mistura publicação com comércio | Unificar o status de publicação; HIDDEN só na variante (D006) |
| I4 | `products.price_from` editável contraria a regra "preço de variante é fonte única" (modelagem-dados.md) | `price_from` derivado por trigger e somente leitura (D005) |
| I5 | `products` tem `category_id` e `family_id`, e a família também tem categoria, o que permite inconsistência | FK composta `(family_id, category_id)` (D004) |
| I6 | `/admin/colecoes`, `/admin/banners`, `/admin/seo` e `/admin/usuarios` não têm modelo no §21 | Coleções = listas curadas; banners = blocos; SEO = campos + `site_settings`; usuários = `admin_profiles` |
| I7 | §26 oferece duas estratégias de URL | Resolvido: `/produto/[slug]` (D003) |
| I8 | §34 diz "MacBook"; §6/§7.4 dizem "Mac" | Categoria "Mac", rota `/mac`; `/macbook` vira 301 |
| I9 | `*_url` soltos (`image_url`, `media_url`, `avatar_url`) impedem cumprir o §20 "excluir somente após verificar referências" | Tabela central `media_assets` + FKs (D007) |
| I10 | §37 coloca o "painel completo" na Fase 3, mas os critérios do §38 exigem que o admin cadastre, precifique e publique | O CRUD admin do catálogo entra na Fase 1; a Home configurável e os banners ficam na Fase 3 |
| I11 | §5 cita "Framer Motion" | O pacote atual é `motion` (`motion/react`), a mesma biblioteca |

---

## 2. ETAPA 2: Matriz Brain × repositório

Prioridade: **P0** bloqueia a Fase 1 do MVP · **P1** Fase 2 · **P2** Fases 3/4 · **—** já atendido.

| Requisito do Brain | Status | Ação necessária | Prior. |
|---|---|---|---|
| Brain normativo + agentes (§41) | EXISTE | Manter intacto em `moca-do-iphone-brain/` | — |
| Registro de decisões MDI (§40) | NÃO EXISTE | `docs/decisoes/` (nesta etapa) | P0 |
| Controle de versão | NÃO EXISTE | `git init` + `.gitignore` (Etapa 01) | P0 |
| Stack Next.js + TS + React + Tailwind (§5) | NÃO EXISTE | Scaffold Next 16 App Router, TS strict, Tailwind 4 | P0 |
| Design system / tokens (§30) | NÃO EXISTE | Tokens semânticos com valores provisórios; **pedir a identidade oficial ao cliente** | P0 |
| Componentização (§31) | NÃO EXISTE | Criar as pastas conforme a necessidade de cada etapa | P1 |
| Projeto Supabase (§5) | NÃO EXISTE | Local (Docker) e depois remoto (Etapa 02) | P0 |
| Modelo de dados (§21) | PARCIAL (spec com lacunas I1–I9) | Modelo completo da seção 5 | P0 |
| RLS (§22) | NÃO EXISTE | Políticas + testes pgTAP | P0 |
| Perfis administrativos (§23) | NÃO EXISTE | `admin_profiles` + enum de 4 papéis | P0 |
| Auditoria (§24) | NÃO EXISTE | `audit_log` + triggers | P0 |
| Soft delete (§25) | NÃO EXISTE | `deleted_at`/`deleted_by` + DELETE revogado | P0 |
| Autenticação admin | NÃO EXISTE | Supabase Auth sem cadastro público | P0 |
| Hierarquia do catálogo (§8) | NÃO EXISTE | categories → families → products → variants | P0 |
| Produto (§9) | NÃO EXISTE | Tabela + regras de publicação | P0 |
| Variantes (§10) | NÃO EXISTE | Fonte única de preço e disponibilidade | P0 |
| Preços (§11) | NÃO EXISTE (o Wix só mostra parcela) | Centavos; `lib/pricing` testada; "Consulte valores" | P0 |
| Disponibilidade (§12) | NÃO EXISTE | Enum de 6 estados + rótulos PT | P0 |
| Mídia (§20) | NÃO EXISTE | `media_assets` + bucket + upload validado | P0 |
| Admin: produtos e cadastro em abas (§16–17) | NÃO EXISTE | Etapa 04 | P0 |
| Admin: dashboard (§15) | NÃO EXISTE | Contagens derivadas (Etapa 04) | P1 |
| Rotas públicas (§6) | NÃO EXISTE | Etapa 05 | P1 |
| `/produto/[slug]` (§6/§26) | NÃO EXISTE (decidido) | Etapa 05 | P1 |
| WhatsApp contextual (§13) | PRECISA SER REFEITO (Wix: números e mensagens fixos) | Builder por template + contato padrão | P1 |
| Contatos/vendedores (§14) | NÃO EXISTE | Tabela `contacts`, com um padrão único | P1 |
| Home storytelling (§7) | PRECISA SER REFEITO (Wix estático) | Blocos tipados (Etapa 05) + motion (Etapa 06) | P1 |
| Home administrável / blocos (§18–19) | NÃO EXISTE | `homepage_sections` + Zod por tipo | P2 |
| Banners (§4, §6) | NÃO EXISTE (sem modelo) | Blocos PROMO_BANNER / FULLSCREEN_MEDIA | P2 |
| Coleções (§6) | NÃO EXISTE (sem modelo) | `collections` + `collection_products` | P2 |
| Loja física / footer (§7.7–7.8) | NÃO EXISTE | `site_settings` tipado | P2 |
| Motion system (§32–33) | NÃO EXISTE | `src/motion/` (Etapa 06) | P1 |
| Mobile first / acessibilidade (§28–29) | NÃO EXISTE | Critério transversal em todas as etapas | P0 |
| SEO (§26) | NÃO EXISTE | Metadata, JSON-LD, sitemap, robots (Etapa 07) | P2 |
| Redirects das URLs Wix | NÃO EXISTE | 301 de `/macbook`, `/applewatch`, `/apple-vision-pro` | P2 |
| Performance (§27) | NÃO EXISTE | Orçamento + estratégia de imagem/vídeo (Etapa 07) | P2 |
| Migração (§34–35) | PARCIAL (categorias listadas; Wix mapeado por alto) | Inventário + importação como DRAFT (Etapa 08) | P2 |
| QA (qa.md) | NÃO EXISTE | Vitest (Etapa 01+) e Playwright (Etapa 09) | P1 |

---

## 3. ETAPA 3: Arquitetura inicial

Next.js 16 App Router na **raiz do repositório**, com `src/`. O Brain fica intocado em `moca-do-iphone-brain/`. As pastas abaixo são o alvo: cada uma só é criada na etapa que a usa.

```txt
src/
├── app/
│   ├── (site)/                   layout público (header/footer)
│   │   ├── page.tsx              Home: renderiza blocos do banco
│   │   ├── [categorySlug]/       /iphone, /mac, … (slugs vêm do banco; ver D003)
│   │   ├── produto/[slug]/
│   │   ├── ofertas/  lancamentos/  loja/  contato/
│   ├── admin/
│   │   ├── login/
│   │   └── (painel)/             layout autenticado; requireAdmin() no servidor
│   │       └── dashboard/ produtos/ categorias/ colecoes/ home/ banners/
│   │           midia/ contatos/ seo/ usuarios/ configuracoes/
│   ├── sitemap.ts  robots.ts  layout.tsx
├── components/                   SOMENTE apresentação: recebem DTOs por props, nunca acessam o Supabase
│   ├── layout/ navigation/ product/ category/ commerce/ sections/ admin/ ui/
│   └── motion/                   wrappers React (client) da camada de motion
├── motion/                       §32: reveal.ts parallax.ts pin.ts product-story.ts text-reveal.ts reduced-motion.ts
├── services/                     acesso a dados por domínio ('server-only')
│   ├── catalog/  media/  home/  contacts/  settings/  auth/  audit/
│   │   (cada um: queries.ts públicas com cache · admin-queries.ts · actions.ts Server Actions · schemas.ts Zod)
├── lib/
│   ├── supabase/   public.ts (sem cookies, cacheável) · server.ts (sessão via cookies) · browser.ts · admin.ts (chave secreta, 'server-only')
│   ├── pricing/  availability/  whatsapp/  seo/  slug/    regras puras com teste unitário
│   └── env.ts                    variáveis validadas com Zod
├── types/   database.ts (gerado por `supabase gen types`) · domain.ts (DTOs)
├── hooks/   apenas hooks client (ex.: media query)
└── styles/  globals.css (tokens em @theme do Tailwind 4)
supabase/    migrations/ · seed.sql · tests/ (pgTAP RLS)
tests/e2e/   Playwright
docs/        auditoria/ · decisoes/
```

**Fluxos:**
- **Leitura pública:** Server Component → `services/*/queries` → `lib/supabase/public.ts` (chave publishable, **sem cookies**) → RLS só devolve o que está publicado → cache do Next com tags (`catalog`, `product:<slug>`, `home`, `settings`).
- **Escrita admin:** formulário → Server Action → `requireRole()` + Zod → `lib/supabase/server.ts` com a **sessão do usuário** (RLS aplicada; `auth.uid()` chega aos triggers de auditoria) → invalidação das tags afetadas, e a alteração aparece no site sem deploy (§38).
- **Chave secreta:** só em `lib/supabase/admin.ts` (`server-only`), para convidar admins e rodar scripts de migração. Nunca vai para o browser.
- **Sem ORM** (Prisma/Drizzle): a conexão direta ao Postgres contorna a RLS. Usaremos supabase-js com tipos gerados.

**Dependências previstas, cada uma justificada pelo Brain ou pelos agentes:** next, react, react-dom, typescript, tailwindcss (§5) · @supabase/supabase-js e @supabase/ssr (§5, sessão SSR) · zod (validação no servidor, exigida por seguranca.md) · server-only (proteção da chave secreta) · gsap e @gsap/react (§5; instalar na Etapa 06) · motion (§5; Etapa 05/06) · dev: eslint (eslint-config-next), vitest, @playwright/test (Etapa 09). **Não adicionar:** ORM, editor rich text (o Brain proíbe HTML livre), biblioteca de smooth scroll (§33). Uma lib de primitivas acessíveis para o admin (abas, diálogos) fica para decidir e justificar na Etapa 04.

**Variáveis de ambiente:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (somente servidor), `NEXT_PUBLIC_SITE_URL`. Telefone, preço e mensagens são **dados**, nunca env vars.

---

## 4. ETAPA 4: Domínios

| Domínio | Responsabilidade | Entidades | Relações | NÃO pertence a ele |
|---|---|---|---|---|
| **Catálogo** | Hierarquia, slugs, publicação, ordenação, flags (lançamento, destaque, promoção), coleções | categories, product_families, products, collections, collection_products | Variantes, mídia, conteúdo, SEO | Preço, disponibilidade, layout |
| **Variantes** | Combinações capacidade × cor, SKU, variante padrão | product_variants | Pertence a um produto; tem mídia própria | Regras de exibição de preço |
| **Preços** | Regras de formatação, `price_from`, parcelamento, "Consulte valores", promoção (`price_old`) | Campos da variante; `lib/pricing` | Variantes; SEO (oferta no JSON-LD) | Checkout ou pagamento (§36) |
| **Disponibilidade** | Os 6 estados, rótulos PT, disponibilidade derivada do produto, visibilidade (HIDDEN) | Enum `availability_status`; `lib/availability` | Variantes; publicação; dashboard | Estoque quantitativo (§36) |
| **Mídia** | Upload validado, alt obrigatório, dimensões, ordenação, exclusão segura | media_assets, product_media; bucket `media` | Referenciada por catálogo, home, contatos, SEO | Decisão de layout de exibição |
| **Conteúdo de produto** | Especificações, benefícios, seções editoriais | product_specs, product_sections | Produto; tipos de bloco compartilhados com a Home | HTML livre |
| **Home** | Blocos predefinidos, ordem, ativação, tema, seleção de produto/categoria/coleção/mídia; banners | homepage_sections | Catálogo, mídia, coleções | Layout livre (§18) |
| **Conteúdo institucional / configurações** | Loja física, footer, padrões de SEO, template do WhatsApp, flag de vídeo | site_settings (chaves tipadas) | Home (STORE), SEO, WhatsApp | Segredos ou credenciais |
| **Contatos / WhatsApp** | Atendentes, contato padrão único, mensagem contextual (produto, variante, origem) | contacts; `lib/whatsapp` | Produto, variante, settings | CRM, rodízio e distribuição de leads (futuro) |
| **Autenticação e autorização** | Login admin, sessão, papéis, helpers de RLS | auth.users, admin_profiles | Todos os domínios de escrita | Usuários públicos (não existem) |
| **Auditoria** | Registro append-only de alterações críticas | audit_log | Todas as tabelas administráveis | Analytics de visitantes |
| **SEO** | Metadata, OG/Twitter, JSON-LD Product/Breadcrumb, sitemap, robots, canonical, redirects | Campos SEO + `lib/seo` | Catálogo, settings, mídia | Conteúdo editorial |
| **Administração** | Dashboard, telas de CRUD, filtros, busca | Views derivadas | Usa todos os serviços | Regras de negócio, que vivem em services/lib |
| **Migração** (temporário) | Inventário do Wix e importação como DRAFT | Scripts + status DRAFT | Catálogo, mídia | Publicação automática (§35) |

---

## 5. ETAPA 5: Planejamento Supabase (sem migrations)

**Convenções:** PK `uuid default gen_random_uuid()` (`audit_log` usa `bigint identity`) · `created_at`/`updated_at timestamptz` com trigger de `updated_at` · dinheiro em **centavos `integer`** · slugs validados por `^[a-z0-9]+(-[a-z0-9]+)*$` · helpers de RLS no schema privado `app` (não exposto pela API), `SECURITY DEFINER` com `search_path = ''`.

### Enums
```txt
publication_status   DRAFT | REVIEWED | PUBLISHED                         (§35, status do produto)
availability_status  AVAILABLE | PRE_ORDER | ON_REQUEST | OUT_OF_STOCK | DISCONTINUED | HIDDEN   (§12)
admin_role           OWNER | ADMIN | CATALOG_MANAGER | CONTENT_EDITOR      (§23)
media_kind           IMAGE | VIDEO
media_slot           MAIN | GALLERY | MOBILE | VIDEO                       (§17 aba Mídia)
content_block_type   HERO_PRODUCT | PRODUCT_STORY | PRODUCT_GRID | CATEGORY_GRID | FULLSCREEN_MEDIA |
                     TEXT_AND_MEDIA | FEATURES | PROMO_BANNER | STORE | REVIEWS | CTA   (§19)
section_theme        LIGHT | DARK
audit_operation      INSERT | UPDATE | DELETE | SOFT_DELETE | RESTORE
```

### Tabelas (✱ = soft delete com `deleted_at`, `deleted_by`)
```txt
admin_profiles     user_id PK→auth.users · display_name · role admin_role · is_active
                   trigger: impede remover o último OWNER e impede alterar o próprio papel
categories ✱       name · slug · description · image_asset_id→media_assets · sort_order · is_active
                   slug UNIQUE (parcial, não deletados) · CHECK slug fora da lista reservada
                   (produto, ofertas, lancamentos, loja, contato, admin, api…)
product_families ✱ category_id→categories · name · slug · sort_order
                   UNIQUE(category_id, slug) parcial · UNIQUE(id, category_id) para a FK composta
products ✱         category_id · family_id NOT NULL · FK (family_id, category_id)→product_families(id, category_id)
                   name · slug (UNIQUE global parcial) · short_description · description (texto puro)
                   status publication_status DEFAULT 'DRAFT' · badge · price_from (derivado, somente leitura)
                   is_featured · is_launch · is_promotion · published_at · sort_order
                   related_product_id→products (CHECK ≠ id)
                   meta_title · meta_description · og_image_asset_id→media_assets · canonical_url
                   created_by · updated_by
                   CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL)
product_variants ✱ product_id · sku (UNIQUE parcial quando presente) · storage · color_name · color_hex (CHECK #RRGGBB)
                   price_cash · price_old · price_installment · installments · installment_text · price_on_request
                   availability availability_status · is_default · sort_order
                   CHECK preços ≥ 0 · CHECK price_old > price_cash quando ambos existem
                   CHECK (price_installment IS NULL) = (installments IS NULL) · CHECK installments BETWEEN 1 AND 36
                   UNIQUE(product_id) WHERE is_default AND não deletado      → no máximo uma variante padrão
                   UNIQUE NULLS NOT DISTINCT (product_id, storage, color_name) parcial → sem variante duplicada
                   UNIQUE(id, product_id) para a FK composta da mídia
media_assets ✱     storage_path UNIQUE · kind · mime_type (CHECK jpg/png/webp/avif/mp4) · size_bytes (CHECK limite)
                   width · height (obrigatórios para imagem, evitam CLS) · alt_text NOT NULL, sem texto vazio
                   created_by · soft delete bloqueado por trigger se houver referência
product_media      product_id · variant_id NULL · FK (variant_id, product_id)→product_variants(id, product_id)
                   media_asset_id→media_assets RESTRICT · slot media_slot · alt_text (override opcional) · sort_order
                   UNIQUE parcial: um MAIN e um MOBILE por (produto, variante)
product_specs      product_id · group_name · label · value · sort_order            (§21 sem mudanças)
product_sections   product_id · type content_block_type (subconjunto permitido) · title · subtitle · body
                   media_asset_id · theme · settings jsonb · sort_order · is_active  (benefícios e seções editoriais, §17)
collections ✱      name · slug · description · sort_order · is_active
collection_products collection_id · product_id · sort_order · PK(collection_id, product_id)
homepage_sections  type content_block_type · title · subtitle · content (texto puro) · product_id · category_id
                   collection_id · media_asset_id · video_asset_id · theme · settings_json jsonb
                   sort_order · is_active · updated_by
                   CHECK jsonb_typeof(settings_json) = 'object' · CHECK de tamanho nos textos
contacts ✱         name · phone · whatsapp (CHECK E.164 só dígitos) · role · avatar_asset_id · is_active · is_default · sort_order
                   UNIQUE parcial: um único is_default
site_settings      key PK (CHECK chave permitida: whatsapp, store, footer, seo, media) · value_json · updated_at · updated_by
                   regra: nunca armazenar segredo aqui
audit_log          id bigint identity · occurred_at · actor_id · actor_role · source ('admin' | 'migration' | 'system')
                   entity · record_id · operation · old_values · new_values · changed_fields text[]
```

### Índices principais
`products(category_id, sort_order) WHERE status='PUBLISHED' AND deleted_at IS NULL` · parciais em `is_launch`, `is_promotion` e `is_featured` (publicados) · `product_variants(product_id, sort_order)` · `product_media(product_id, slot, sort_order)` · `product_specs(product_id, group_name, sort_order)` · `homepage_sections(sort_order) WHERE is_active` · `audit_log(entity, record_id, occurred_at DESC)`, `audit_log(occurred_at DESC)`, `audit_log(actor_id)`. A busca por nome usa `ILIKE`, suficiente para um catálogo de centenas de itens; `pg_trgm` só se for medido como necessário.

### Triggers e funções
- `updated_at` automático.
- Variante (insert, update ou soft delete): recalcula `products.price_from` como o mínimo de `price_cash` entre variantes não deletadas, fora de `HIDDEN`/`DISCONTINUED` e sem `price_on_request`.
- Publicação: preenche `published_at`. Bloqueia `PUBLISHED` se o produto não tiver ao menos uma variante visível, imagem MAIN e categoria ativa. A validação também ocorre na Server Action, para dar mensagem amigável.
- `app.audit_row_change()` genérico em products, product_variants, categories, product_families, collections, homepage_sections, product_sections, contacts, site_settings, media_assets e admin_profiles. No UPDATE grava só os campos alterados.
- `app.media_references(asset_id)`: soma as FKs e varre os ids em `site_settings.value_json`. Bloqueia o soft delete de mídia referenciada.
- Views com `security_invoker = true`: `catalog_product_cards` (card com preço "a partir de", disponibilidade derivada pela ordem AVAILABLE > PRE_ORDER > ON_REQUEST > OUT_OF_STOCK > DISCONTINUED, e imagem MAIN) e `admin_product_overview` (tabela do §16 e contagens do dashboard: sem preço, indisponíveis).

### Soft delete
"Excluir" = UPDATE `deleted_at = now(), deleted_by = auth.uid()`. **`DELETE` revogado de `authenticated`** nas tabelas ✱. Haverá função de restore. Slugs únicos são parciais (`WHERE deleted_at IS NULL`). Tabelas de ligação e de conteúdo filho (specs, sections, media links, collection_products, homepage_sections) usam delete físico, sempre auditado.

### RLS (ativa em **todas** as tabelas)
| Tabela | Público (anon + autenticado sem perfil) | Admin |
|---|---|---|
| categories / families | `is_active` e não deletado | CATALOG_MANAGER+ |
| products | `status='PUBLISHED'`, `published_at <= now()`, não deletado, categoria ativa | CATALOG_MANAGER+ |
| product_variants | produto publicado e `availability <> 'HIDDEN'` | CATALOG_MANAGER+ |
| product_media / specs / product_sections | produto pai publicado (+ `is_active`) | CATALOG_MANAGER+ (sections: + CONTENT_EDITOR) |
| media_assets | somente `app.is_media_public(id)` (referenciada por conteúdo publicado), para não vazar mídia de rascunho | CATALOG_MANAGER+ e CONTENT_EDITOR |
| collections / collection_products | coleção ativa + produto publicado | CATALOG_MANAGER+ |
| homepage_sections | `is_active` | CONTENT_EDITOR+ |
| contacts | ativos, com **grant por coluna** (name, role, whatsapp, avatar) | ADMIN+ |
| site_settings | leitura de todas as chaves | ADMIN+ |
| admin_profiles | — | leitura do próprio perfil; gestão só OWNER |
| audit_log | — | SELECT para OWNER/ADMIN; **ninguém faz UPDATE ou DELETE** |

"+" = o papel citado mais OWNER e ADMIN. No MVP só OWNER e ADMIN recebem contas; os demais papéis ficam com as políticas prontas.
**Grants:** revogar tudo de `anon` e `authenticated` e conceder explicitamente (defesa em profundidade).
**Storage:** bucket `media` com leitura pública, `allowed_mime_types` e `file_size_limit` no bucket, sem listagem para anon. Escrita só quando `app.has_role(...)` e a primeira pasta estiver em `{products, categories, home, banners, store, seo}` (§20). Avatares de contato ficam em `store/`. Caminhos com uuid.

### Migrations (Etapa 02)
Supabase CLI local (Docker OK) → `supabase/migrations/` versionadas, cada uma com estratégia de reversão documentada → testes pgTAP de RLS por papel (anon, autenticado sem perfil, cada admin_role) → `supabase gen types` → projeto remoto. Seed: as 8 categorias do §7.4 com os slugs do §6, sem produtos e sem preços.

---

## 6. ETAPA 6: Plano do MVP

| Etapa | Objetivo | Entregáveis | Depende de | Riscos | Critério de aceite |
|---|---|---|---|---|---|
| **00 Auditoria** | Leitura técnica e plano | Este documento + `docs/` | — | — | Aprovado pelo responsável |
| **01 Fundação técnica** | Base do projeto compilando | git; Next 16 + TS strict + Tailwind 4; ESLint (`no-explicit-any: error`); Vitest; `lib/env.ts`; `.env.example`; tokens §30 provisórios; headers de segurança básicos | 00 | Breaking changes do Next 16 e do Tailwind 4 | `build`, `lint`, `typecheck` e `test` verdes; `.env` fora do git; tokens mínimos presentes |
| **02 Banco e autenticação** | Modelo da seção 5 + login admin | Migrations, RLS, storage, auditoria, seed, tipos gerados, pgTAP; login, `proxy.ts`, `requireRole()`, bootstrap do 1º OWNER | 01; org Supabase definida (R6) | Erro de RLS expõe rascunho | pgTAP verde (anon não lê DRAFT nem escreve; papéis respeitados); login e logout funcionam; rota admin sem sessão redireciona |
| **03 Catálogo (domínio + serviços)** | Regras e acesso a dados | `lib/pricing`, `availability`, `whatsapp`, `slug` com testes unitários; `services/catalog` (queries com cache por tag e actions); Zod; DTOs | 02 | Regra duplicada entre front e admin | Formato "R$ 8.999 / ou 18x de R$ 549,90" e "Consulte valores" testados; mensagem do WhatsApp idêntica ao exemplo do §13 |
| **04 Painel admin (catálogo)** | Fechar a Fase 1 e os critérios admin do §38 | Shell admin; dashboard; tabela de produtos com filtros e busca; cadastro em abas (Geral, Comercial, Variantes, Mídia, Conteúdo, SEO); categorias e famílias; mídia (upload, alt, reorder, exclusão segura); contatos + config do WhatsApp; usuários (OWNER) | 03 | Usabilidade para pessoa não técnica | Admin cadastra produto, altera preço e disponibilidade, publica e despublica, envia imagens; todas as ações auditadas |
| **05 Front público + Home configurável** | Fase 2 + Home/banners/coleções da Fase 3 | Layout e nav; Home renderizando blocos; `/[categoria]`; `/produto/[slug]` com seletor de variante; ofertas, lançamentos, loja, contato; admin de Home, banners e coleções | 04; **identidade visual** (R1) | Ativos sem licença (R2) | Alteração no admin aparece no site sem deploy; WhatsApp com produto e variante corretos; mobile e desktop OK; estados loading, empty, error e unavailable |
| **06 Motion e storytelling** | Experiência premium (§7.2, §32–33) | `src/motion/*` com `gsap.matchMedia` (desktop, mobile e reduced), `useGSAP`; PRODUCT_STORY, HERO e pinning; microinterações com `motion` | 05; ativos recortados | Peso e travamento no mobile (R7) | Reduced motion respeitado; nenhum conteúdo essencial só via animação; scroll não trava; sem regressão de CWV |
| **07 SEO e performance** | §26–27 | Metadata, OG/Twitter, JSON-LD Product e Breadcrumb, `sitemap.ts`, `robots.ts`, canonical, `/admin/seo`; estratégia de imagem (loader de transformação do Supabase Pro ou otimizador do Next); orçamento de vídeo | 05–06 | — | Rich Results válido; metas propostas para aprovação: LCP < 2,5 s, CLS < 0,1, INP < 200 ms no mobile |
| **08 Migração** | §34–35 | Inventário do Wix (produtos, textos, imagens com origem e licença); script de importação com `source='migration'` e status DRAFT; 301 das URLs legadas | 04; dados do cliente | Preços inválidos (R3) | Nada publicado automaticamente; cliente revisa (DRAFT → REVIEWED → PUBLISHED) |
| **09 Segurança e QA** | Agentes seguranca.md e qa.md | Revisão de superfícies; CSP; validação de upload; varredura do bundle por segredos; Playwright nos fluxos críticos; axe; teclado; dispositivos | 05–08 | — | Nenhum achado crítico ou alto aberto; fluxos do qa.md aprovados; nenhuma credencial no cliente |
| **10 Produção** | Go-live | Projeto Vercel, env vars, Supabase de produção separado do dev, backups, troca de DNS do Wix com plano de rollback (Wix ativo até a validação) | 09; acesso ao DNS | Indisponibilidade na troca de DNS | Checklist do §38 completo e validado |

Mapa para o §37: Fase 1 = Etapas 01–04 · Fase 2 = Etapa 05 · Fase 3 = Etapas 05 (Home, banners) e 07 · Fase 4 = Etapas 08–10.

---

## 7. ETAPA 7: Decisões registradas (texto completo em [`REGISTRO-DE-DECISOES.md`](../decisoes/REGISTRO-DE-DECISOES.md))

Todas com **Data: 2026-10-30**, no formato do §40 (Decisão / Motivo / Impacto / Arquivos afetados). Resumo:

- **MDI-D001 Estrutura do repositório.** App Next.js na raiz com `src/`; Brain intacto em `moca-do-iphone-brain/`; documentação em `docs/`; pastas criadas sob demanda. *Arquivos:* raiz, `src/`, `docs/`.
- **MDI-D002 Separação dados × apresentação.** `components/` não acessa dados; `services/<domínio>` é server-only; regras puras em `lib/` com teste; nada de preço, telefone ou produto em JSX (§11, desenvolvedor.md); sem ORM, por causa da RLS. *Arquivos:* `src/services/**`, `src/lib/**`, `src/components/**`.
- **MDI-D003 Rotas.** Produto em `/produto/[slug]` (decisão do usuário, §26); slug global único; categorias por segmento dinâmico `[categorySlug]` vindo do banco, com lista de slugs reservados no banco; breadcrumb via JSON-LD. *Arquivos:* `src/app/(site)/**`, migration de categories/products.
- **MDI-D004 Hierarquia do catálogo.** Categoria → Família (obrigatória) → Produto → Variante; FK composta garante que a família pertença à categoria do produto. *Arquivos:* migrations do catálogo.
- **MDI-D005 Variante como fonte única de preço.** Todo produto tem ao menos uma variante (a padrão); preços em centavos; `price_installment` armazenado e não calculado (a loja define os juros); `installment_text` e `price_on_request` na variante; `price_from` derivado por trigger. *Arquivos:* migrations, `src/lib/pricing/`.
- **MDI-D006 Publicação × disponibilidade.** `products.status` = DRAFT/REVIEWED/PUBLISHED (unifica §9 e §35); disponibilidade só na variante; HIDDEN oculta a variante; disponibilidade do produto derivada; publicação com pré-requisitos validados no banco e no servidor. *Arquivos:* migrations, `src/lib/availability/`.
- **MDI-D007 Mídia centralizada.** `media_assets` é a fonte única (alt obrigatório, mime, tamanho, dimensões); referências por FK substituem os `*_url` do §21; exclusão bloqueada se houver referência; bucket `media` com as pastas do §20. *Arquivos:* migrations de mídia e storage, `src/services/media/`.
- **MDI-D008 Autenticação, papéis e RLS.** Supabase Auth sem cadastro público; admins convidados pelo OWNER; `admin_profiles` com 4 papéis (OWNER/ADMIN ativos no MVP); helpers em schema privado; mutações com a sessão do usuário; chave secreta só server-only. *Arquivos:* migrations de auth/RLS, `src/lib/supabase/`, `src/proxy.ts`, `src/services/auth/`.
- **MDI-D009 Conteúdo por blocos tipados.** `homepage_sections` com os 11 tipos do §19; `settings_json` validado por Zod (união discriminada por tipo) na escrita e na leitura (bloco inválido não renderiza); texto puro, sem HTML; banners = blocos PROMO_BANNER/FULLSCREEN_MEDIA, sem tabela própria; coleções = listas curadas (decisão do usuário) para PRODUCT_GRID; `product_sections` reutiliza os tipos para o conteúdo editorial do produto. *Arquivos:* migrations de conteúdo, `src/services/home/`, `src/components/sections/`.
- **MDI-D010 Auditoria e soft delete no banco.** Trigger genérico append-only; `deleted_at`/`deleted_by` com DELETE revogado; unicidade parcial. *Arquivos:* migrations.
- **MDI-D011 Renderização e cache.** Server Components; leitura pública por client sem cookies (evita cachear rascunho visto por admin); cache por tags + invalidação sob demanda nas Server Actions; client components só para interação e motion. *Arquivos:* `src/lib/supabase/public.ts`, `src/services/**/queries.ts`.
- **MDI-D012 WhatsApp.** Um único contato padrão no MVP (decisão do usuário); mensagem por template em `site_settings` com produto, variante e origem; link `wa.me`; tabela `contacts` mantida (§14), com rodízio futuro fora do escopo. *Arquivos:* `src/lib/whatsapp/`, migrations de contacts e settings.

A decisão sobre a camada de motion (`gsap.matchMedia`, sem smooth scroll) será registrada na Etapa 06, quando houver o que decidir com base nos ativos reais.

---

## 8. Relatório final

**1. Estado atual:** repositório vazio, exceto pelo Brain e pelos agentes. Sem git, sem código, sem Supabase. Site atual no Wix.

**2. Aproveitável:** Brain e agentes (normativos); toolchain local pronto (Node 22, Supabase CLI, Docker); org Supabase Pro existente; do Wix, só conteúdo depois de validado (categorias, endereço, horários, mapa de URLs para 301).

**3. A criar:** tudo o que está nas seções 2, 3 e 5: fundação, banco, RLS, auth, catálogo, admin, front, motion, SEO, migração, QA e produção.

**4. Riscos reais:**
- R1 · Sem identidade visual oficial (cores, tipografia, logo). O §30 proíbe inventar, o que bloqueia o design final. **Pedir o manual de marca agora.**
- R2 · Direito de uso das imagens e vídeos (§3). O storytelling depende de ativos recortados de alta qualidade e a origem das imagens do Wix é desconhecida.
- R3 · Os preços do Wix são só parcelas e podem estar desatualizados (§34). Os dados comerciais precisam vir do cliente.
- R4 · Perda de SEO na troca de URLs (`/macbook`, `/applewatch`, `/apple-vision-pro`). Exige 301.
- R5 · Sem controle de versão hoje: trabalho pode ser perdido. `git init` é o primeiro comando da Etapa 01.
- R6 · Propriedade da infraestrutura: criar o projeto na org "Athrios" (Pro, custo mensal por projeto) ou na conta do cliente? E acesso ao DNS hoje no Wix. **Decidir antes da Etapa 02.**
- R7 · Motion pesado no mobile, travamento e CWV. Mitigação: variantes por `matchMedia` e orçamento de performance.
- R8 · Vazamento de rascunho via cache se a leitura pública usar sessão admin. Mitigação: client público sem cookies (D011) + testes de RLS.

**5. Arquitetura:** seção 3. Next 16 App Router; componentes só de apresentação; serviços server-only por domínio; regras puras testadas; Supabase com RLS em tudo; escrita admin com a sessão do usuário e auditoria por trigger; leitura pública cacheada e invalidada por tag.

**6. Plano:** seção 6 (Etapas 00 a 10).

**7. Primeiro passo de implementação (próxima tarefa):** **ETAPA 01, Fundação técnica.**
1. `git init` + `.gitignore` (`.env*`, `node_modules`, `.next`, `supabase/.temp`).
2. Scaffold Next 16.4 na raiz (App Router, TS, Tailwind 4, ESLint, `src/`, alias `@/*`, npm), preservando `moca-do-iphone-brain/`.
3. `tsconfig` strict + `noUncheckedIndexedAccess`; ESLint com `no-explicit-any: error`.
4. `src/styles/globals.css` com os 10 tokens mínimos do §30 em `@theme` (claro e escuro), com valores neutros marcados como provisórios até a identidade oficial.
5. `src/lib/env.ts` (Zod, separando público e servidor) + `.env.example`.
6. Vitest configurado; scripts `dev`, `build`, `lint`, `typecheck`, `test`.
7. Headers de segurança básicos no `next.config` (CSP fica para a Etapa 09).
8. Registrar MDI-D013, se surgir decisão estrutural nova.
