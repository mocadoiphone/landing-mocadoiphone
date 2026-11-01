# Registro de Decisões — Moça do iPhone 2.0

> Formato definido no Brain §40. Toda alteração estrutural gera uma decisão.
> O Brain (`moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md`) continua sendo a fonte normativa. Estas decisões resolvem lacunas e escolhas que ele deixa em aberto. Nenhuma delas edita o Brain.
> Origem: [ETAPA 00 — Auditoria](../auditoria/ETAPA-00-AUDITORIA.md).

| ID | Tema | Status |
|---|---|---|
| MDI-D001 | Estrutura do repositório | Aprovada |
| MDI-D002 | Separação entre dados e apresentação | Aprovada |
| MDI-D003 | Rotas de produto e categoria | Aprovada |
| MDI-D004 | Hierarquia do catálogo | Aprovada |
| MDI-D005 | Variante como fonte única de preço | Aprovada |
| MDI-D006 | Publicação × disponibilidade | Aprovada |
| MDI-D007 | Mídia centralizada | Aprovada |
| MDI-D008 | Autenticação, papéis e RLS | Aprovada |
| MDI-D009 | Conteúdo por blocos tipados | Aprovada |
| MDI-D010 | Auditoria e soft delete no banco | Aprovada |
| MDI-D011 | Renderização e cache | Aprovada |
| MDI-D012 | WhatsApp com contato padrão único | Aprovada |
| MDI-D013 | Design tokens provisórios e temas por seção | Aprovada (Etapa 01) |
| MDI-D014 | Ferramentas de qualidade, testes e convenções | Aprovada (Etapa 01) |
| MDI-D015 | Variáveis de ambiente tipadas e opcionais até a Etapa 02 | Aprovada (Etapa 01) |
| MDI-D016 | Configurações públicas definidas por chave, na migration | Aprovada (Etapa 02) |
| MDI-D017 | Fluxo de autenticação administrativa | Aprovada (Etapa 02) |
| MDI-D018 | Ajustes ao modelo de dados da Etapa 00 na implementação | Aprovada (Etapa 02) |
| MDI-D019 | Privilégios explícitos, independentes do ambiente | Aprovada (Etapa 02) |
| MDI-D020 | Cache Components e páginas técnicas do catálogo | Etapa 03 |
| MDI-D021 | Regras de exibição de preço, disponibilidade, variante e WhatsApp | Etapa 03 |
| MDI-D022 | Invariantes do catálogo garantidas pelo banco | Etapa 03 |
| MDI-D023 | Funções sem EXECUTE para PUBLIC (corrige a D018) | Etapa 03 |
| MDI-D024 | Camada de serviços do catálogo | Etapa 03 |
| MDI-D025 | Estrutura do painel administrativo | Aprovada (Etapa 04) |
| MDI-D026 | Envio de mídia por URL temporária com verificação no servidor | Aprovada (Etapa 04) |
| MDI-D027 | Administradores sem service_role e contato padrão atômico | Aprovada (Etapa 04) |
| MDI-D028 | Blocos editoriais do produto adiados para a Etapa 05 | Aprovada (Etapa 04) |
| MDI-D029 | Playwright antecipado para os fluxos críticos | Aprovada (Etapa 04) |
| MDI-D030 | Home por blocos: definição dos tipos e área "Home" do painel | Etapa 05 |
| MDI-D031 | Conteúdo institucional em `site_settings` (loja física, rodapé, atendimento geral) | Etapa 05 |
| MDI-D032 | Imagens públicas otimizadas pelo next/image, só do bucket do projeto | Etapa 05 |
| MDI-D033 | Base visual neutra premium (identidade oficial pendente) | Etapa 05 |
| MDI-D034 | Páginas de produto e categoria estáticas com 404 real (corrige a D020) | Etapa 05 |
| MDI-D035 | Coleções e blocos editoriais do produto fora da Etapa 05 (ajusta D009, D018 e D028) | Etapa 05 |

---

## MDI-D001

**Data:** 2026-10-30

**Decisão:** A aplicação Next.js fica na raiz do repositório, com código em `src/`. O Brain permanece intacto em `moca-do-iphone-brain/`. A documentação do projeto (auditorias, decisões, relatórios) fica em `docs/`. As pastas de `src/` são criadas na etapa que as usa, não antecipadamente.

**Motivo:** O README do Brain orienta manter a pasta na raiz do repositório. Separar código, Brain e documentação evita que o Brain seja alterado por engano e mantém o histórico de decisões fora do código. Criar pastas sob demanda evita estrutura vazia sem dono.

**Impacto:** Define a estrutura-alvo descrita na seção 3 da auditoria (`app/`, `components/`, `motion/`, `services/`, `lib/`, `types/`, `hooks/`, `styles/`, `supabase/`, `tests/e2e/`).

**Arquivos afetados:** raiz do repositório, `src/`, `docs/`.

---

## MDI-D002

**Data:** 2026-10-30

**Decisão:** Os dados ficam separados da apresentação.
- `src/components/` só recebe dados prontos por props e nunca acessa o Supabase.
- `src/services/<domínio>/` concentra o acesso a dados. É server-only e contém queries, Server Actions e schemas Zod.
- `src/lib/` concentra as regras puras (preço, disponibilidade, WhatsApp, slug, SEO), cobertas por teste unitário.
- Não usar ORM (Prisma/Drizzle). O acesso é via `supabase-js` com tipos gerados.

**Motivo:** O Brain §11 proíbe preço no JSX. O agente desenvolvedor proíbe regra de negócio em componentes e hardcode de preço, telefone ou produto. Um ORM conectado direto ao Postgres contornaria a RLS (§22).

**Impacto:** Cada regra de negócio existe em um único lugar e é testável. Componentes visuais podem mudar sem risco para as regras. A RLS vale em todo acesso a dados.

**Arquivos afetados:** `src/services/**`, `src/lib/**`, `src/components/**`, `src/types/database.ts`.

---

## MDI-D003

**Data:** 2026-10-30

**Decisão:**
- **Produto:** a página fica em `/produto/[slug]`, com slug único em todo o catálogo (decisão do responsável, atendendo ao Brain §26).
- **Categorias:** são servidas por um segmento dinâmico `[categorySlug]` cujos slugs vêm do banco (`/iphone`, `/mac`, `/ipad`, `/apple-watch`, `/airpods`, `/vision-pro`, `/tv-e-casa`, `/acessorios`).
- **Slugs reservados:** o banco proíbe slugs de categoria que colidam com rotas fixas (produto, ofertas, lancamentos, loja, contato, admin, api…).
- **Hierarquia para buscadores:** fica expressa por breadcrumb e JSON-LD `BreadcrumbList`.

**Motivo:** O §26 exige escolher uma única estratégia antes da implementação, e o §6 já lista `/produto/[slug]`. Essa URL não muda quando o produto troca de categoria. Categorias vindas do banco permitem criar linhas novas sem código (§2), e a lista reservada impede que uma categoria sobreponha uma rota fixa.

**Impacto:** Uma URL canônica por produto. Os redirects 301 das URLs do Wix (`/macbook`, `/applewatch`, `/apple-vision-pro`) entram na Etapa 08.

**Arquivos afetados:** `src/app/(site)/[categorySlug]/`, `src/app/(site)/produto/[slug]/`, migrations de `categories` e `products`.

---

## MDI-D004

**Data:** 2026-10-30

**Decisão:** O catálogo segue Categoria → Família → Produto → Variante, e a família é obrigatória. `products` mantém `category_id` e `family_id`, como no §21. Uma FK composta `(family_id, category_id) → product_families(id, category_id)` garante que a família pertença à categoria do produto.

**Motivo:** O Brain §8 define a hierarquia, e o §21 coloca os dois campos em `products`. Sem a FK composta, um produto poderia ficar na categoria A com uma família da categoria B.

**Impacto:** Uma classificação incoerente é recusada pelo banco. As consultas por categoria continuam diretas.

**Arquivos afetados:** migrations de `categories`, `product_families` e `products`.

---

## MDI-D005

**Data:** 2026-10-30

**Decisão:**
- Todo produto tem ao menos uma variante. Exatamente uma é a padrão.
- Preço e parcelamento vivem **somente** na variante: `price_cash`, `price_old`, `price_installment`, `installments`, `installment_text`, `price_on_request`.
- Valores monetários são gravados em **centavos** (`integer`).
- `price_installment` é armazenado, não calculado, porque a loja define os juros.
- `products.price_from` é derivado por trigger e somente leitura: o menor `price_cash` entre as variantes visíveis, não descontinuadas e sem "consulte valores".
- A formatação ("R$ 8.999 / ou 18x de R$ 549,90", "Consulte valores") existe apenas em `src/lib/pricing/`.

**Motivo:**
- O agente de modelagem determina que o preço da variante seja fonte única.
- O §11 lista `installment_text` e `price_on_request`, que o §21 não modela (lacuna I1).
- Centavos evitam erro de arredondamento.
- Um `price_from` editável à mão divergiria das variantes (lacuna I4).

**Impacto:** Para produtos de variante única, a aba Comercial do admin edita a variante padrão. Não há como exibir um preço diferente do cadastrado na variante.

**Arquivos afetados:** migrations de `products` e `product_variants`, `src/lib/pricing/`.

---

## MDI-D006

**Data:** 2026-10-30

**Decisão:**
- `products.status` é o status de publicação: `DRAFT | REVIEWED | PUBLISHED`. Ele unifica o "status" do §9 com o status de migração do §35.
- A disponibilidade (`AVAILABLE | PRE_ORDER | ON_REQUEST | OUT_OF_STOCK | DISCONTINUED | HIDDEN`, §12) existe **somente na variante**. `HIDDEN` oculta a variante, não o produto.
- A disponibilidade exibida para o produto é derivada das variantes, nesta ordem de prioridade: AVAILABLE > PRE_ORDER > ON_REQUEST > OUT_OF_STOCK > DISCONTINUED.
- Para publicar, o produto precisa ter variante visível, imagem principal e categoria ativa. Isso é validado no servidor (mensagem amigável) e no banco (garantia).

**Motivo:** O Brain não define os valores de `status`, e o §12 mistura um estado de visibilidade (`HIDDEN`) com estados comerciais (lacuna I3). Separar publicação de disponibilidade evita dois controles que se contradizem. O §35 proíbe publicação automática.

**Impacto:** "Despublicar" = voltar para `REVIEWED` ou `DRAFT`. O dashboard (§15) calcula "indisponíveis" e "sem preço" a partir das variantes.

**Arquivos afetados:** migrations de `products` e `product_variants`, `src/lib/availability/`.

---

## MDI-D007

**Data:** 2026-10-30

**Decisão:**
- `media_assets` é a fonte única de mídia: caminho no storage, tipo, mime, tamanho, largura e altura, e **alt text obrigatório**.
- As demais tabelas referenciam mídia por FK. Isso substitui os campos `image_url`, `media_url` e `avatar_url` do §21.
- Mídia ainda referenciada não pode ser excluída. Os produtos usam `product_media` com slot (MAIN, GALLERY, MOBILE, VIDEO) e ordem.
- Há um único bucket, `media`, com as pastas do §20 (`products`, `categories`, `home`, `banners`, `store`, `seo`). As fotos de contato ficam em `store/`.
- O público só lê metadados de mídia usada em conteúdo publicado.

**Motivo:** O §20 exige alt obrigatório, preview, reordenação e "excluir somente após verificar referências", o que URLs soltas não permitem garantir (lacuna I9). Largura e altura gravadas evitam layout shift (§27). Restringir a leitura pública evita expor imagens de produtos ainda em rascunho.

**Impacto:** O upload passa por validação de tipo e tamanho no servidor e no bucket. A tela `/admin/midia` mostra onde cada arquivo é usado.

**Arquivos afetados:** migrations de `media_assets`, `product_media` e storage, `src/services/media/`.

---

## MDI-D008

**Data:** 2026-10-30

**Decisão:**
- **Login:** Supabase Auth com cadastro público desativado. Administradores são convidados pelo OWNER.
- **Perfis:** `admin_profiles` (vinculada a `auth.users`) com os quatro papéis do §23. No MVP só OWNER e ADMIN recebem contas; as políticas de CATALOG_MANAGER e CONTENT_EDITOR já ficam prontas.
- **RLS:**
  - ativa em todas as tabelas;
  - funções auxiliares (`has_role`) num schema privado não exposto pela API;
  - grants concedidos explicitamente.
- **Mutações administrativas:** rodam com a **sessão do usuário**, então a RLS se aplica e a auditoria registra quem alterou.
- **Chave secreta (service role):** existe só em código server-only, para convites e scripts de migração.

**Motivo:** O §22 exige RLS e proíbe confiar no front-end. O §23 pede arquitetura preparada para quatro papéis. O agente de segurança exige mínimo privilégio e proíbe service role no browser. A sessão do usuário permite que `auth.uid()` chegue aos triggers de auditoria (§24).

**Impacto:** As rotas `/admin` são protegidas em três camadas: `proxy.ts`, verificação no layout do painel e verificação em cada Server Action. Nenhuma credencial vai para o cliente (§38). Os testes pgTAP validam cada papel.

**Arquivos afetados:** migrations de auth e RLS, `src/lib/supabase/`, `src/proxy.ts`, `src/services/auth/`, `supabase/tests/`.

---

## MDI-D009

**Data:** 2026-10-30

**Decisão:**
- **Home:** `homepage_sections` usa os 11 tipos de bloco do §19. O `settings_json` de cada tipo é validado por um schema Zod próprio, na escrita e na leitura; um bloco inválido não é renderizado. Os textos são puros (sem HTML), com limite de tamanho.
- **Banners:** são blocos `PROMO_BANNER` ou `FULLSCREEN_MEDIA`, sem tabela própria. `/admin/banners` é uma tela filtrada desses blocos.
- **Coleções:** são listas curadas e ordenadas de produtos (decisão do responsável), em `collections` e `collection_products`. Alimentam os blocos `PRODUCT_GRID`.
- **Conteúdo editorial do produto:** benefícios e seções editoriais (aba Conteúdo, §17) ficam em `product_sections`, reutilizando os mesmos tipos de bloco.

**Motivo:** O §18 proíbe HTML livre e o §19 exige que o admin não consiga quebrar o layout. O Brain cita banners e coleções nas rotas (§6), mas não os modela (lacuna I6). Reutilizar o sistema de blocos evita uma segunda forma de montar conteúdo. Texto puro dispensa sanitização de conteúdo rico.

**Impacto:** O administrador escolhe tipo, produto, mídia, tema e textos permitidos. O sistema controla o layout (princípio central do §2). Um novo tipo de bloco exige código e decisão própria.

**Arquivos afetados:** migrations de `homepage_sections`, `product_sections`, `collections` e `collection_products`; `src/services/home/`; `src/components/sections/`.

---

## MDI-D010

**Data:** 2026-10-30

**Decisão:**
- **Auditoria:** um trigger genérico grava em `audit_log`, que só aceita inclusões: usuário, papel, origem (admin, migration, system), entidade, registro, operação, valores anteriores e novos, e campos alterados. Cobre todas as tabelas administráveis.
- **Exclusão:** é soft delete (`deleted_at`, `deleted_by`) em categorias, famílias, produtos, variantes, coleções, contatos e mídia. O comando `DELETE` é revogado para usuários autenticados nessas tabelas.
- **Slugs:** a unicidade vale apenas entre registros não excluídos.
- **Tabelas de ligação e conteúdo filho:** usam exclusão física, sempre auditada.

**Motivo:** O §24 exige registrar quem alterou preço, disponibilidade, publicação e exclusão. O §25 pede soft delete para que nenhum produto com histórico desapareça por engano. Fazer isso no banco garante o registro mesmo se o código da aplicação falhar.

**Impacto:** O dashboard (§15) lê "alterações recentes" de `audit_log`. Existe função de restauração. O registro de auditoria não pode ser editado nem apagado pela aplicação.

**Arquivos afetados:** migrations de auditoria e soft delete, `src/services/audit/`.

---

## MDI-D011

**Data:** 2026-10-30

**Decisão:**
- As páginas públicas são Server Components.
- A leitura pública usa um cliente Supabase **sem cookies**, apenas com a chave publishable, e é cacheada com tags (`catalog`, `product:<slug>`, `home`, `settings`).
- Cada Server Action administrativa invalida as tags afetadas.
- Client components só para interação e motion.

**Motivo:** O §38 exige que alterações apareçam no site sem mudança de código, e o §27 pede SSR/SSG e cache controlado. Um cliente sem cookies garante que nenhum rascunho visto por um administrador seja cacheado e servido ao público.

**Impacto:** Páginas rápidas e estáticas na maior parte do tempo, atualizadas em segundos após cada alteração no admin. A API exata de cache do Next 16 será confirmada na Etapa 01.

**Arquivos afetados:** `src/lib/supabase/public.ts`, `src/services/**/queries.ts`, `src/services/**/actions.ts`.

---

## MDI-D012

**Data:** 2026-10-30

**Decisão:**
- No MVP, todos os botões de WhatsApp apontam para **um único contato padrão** (decisão do responsável).
- A mensagem é gerada por um template em `site_settings` com produto, variante e origem do lead, no padrão do §13. O link usa `wa.me`.
- A tabela `contacts` (§14) é mantida, com no máximo um contato padrão. Rodízio e distribuição de leads ficam fora do escopo.

**Motivo:** O §13 define o WhatsApp como principal canal de conversão, com mensagem contextual configurável no painel. O site atual usa três números fixos por área; o responsável optou por simplificar o MVP com um contato único. Manter a tabela atende ao §14 e não impede o rodízio futuro.

**Impacto:** Trocar o número ou a mensagem não exige código. Nenhum telefone fica no código ou em variável de ambiente.

**Arquivos afetados:** `src/lib/whatsapp/`, migrations de `contacts` e `site_settings`.

---

## MDI-D013

**Data:** 2026-10-30

**Decisão:**
- Todos os design tokens ficam num único arquivo, `src/styles/tokens.css`, com **valores provisórios e neutros** (escala de cinza; verde, âmbar e vermelho apenas para estados funcionais).
- As cores são variáveis CSS semânticas (`--background`, `--foreground`, `--surface`, `--surface-elevated`, `--border`, `--muted`, `--accent`, `--accent-foreground`, `--success`, `--warning`, `--danger`, `--ring`), expostas ao Tailwind 4 por `@theme inline`.
- O tema claro é o padrão. Qualquer seção pode usar `data-theme="dark"` (ou `"light"`) e as classes passam a ler as variáveis daquele tema.
- A paleta padrão do Tailwind é desligada (`--color-*: initial`): só existem as cores do projeto. O lint bloqueia cores literais em classes (`bg-[#...]`, `text-[oklch(...)]`).
- Tipografia (pilha do sistema), espaçamento (`gutter`, `section`), containers (`narrow`, `content`, `wide`), raios e sombras também são tokens provisórios.
- Correspondência com o Brain §30: `text` → `foreground`, `text-muted` → `muted`.

**Motivo:** O Brain §30 exige tokens e proíbe inventar identidade antes do manual oficial, que ainda não chegou. O responsável determinou tokens neutros, centralizados e fáceis de substituir, sem cores espalhadas pelos componentes. Temas por seção atendem às seções claras e escuras do §7.1 e do §18 e ao campo `theme` dos blocos (MDI-D009).

**Impacto:** Aplicar a identidade definitiva = editar só `tokens.css`, sem tocar em componentes. Não existe modo escuro global automático (`prefers-color-scheme`), porque o Brain não o pede; o tema é escolhido por seção.

**Arquivos afetados:** `src/styles/tokens.css`, `src/styles/globals.css`, `eslint.config.mjs`.

---

## MDI-D014

**Data:** 2026-10-30

**Decisão:**
- **Gerenciador e runtime:** npm e Node 22 (`.nvmrc`, `engines`).
- **TypeScript:** strict + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`; `allowJs` desligado.
- **Lint:** ESLint (flat config do `eslint-config-next`) com `no-explicit-any` como erro, `consistent-type-imports` e bloqueio de cores literais.
- **Formatação:** Prettier com ordenação de classes Tailwind. Brain e `docs/` ficam fora da formatação automática.
- **Testes:** Vitest com dois projetos: `unit` (Node, `*.test.ts`) para regras puras e `components` (jsdom + Testing Library, `*.test.tsx`). Testes ficam ao lado do código.
- **E2E:** não instalado nesta etapa. Playwright entra na Etapa 09, ou antes, se a Etapa 05 exigir.
- **Typecheck:** `next typegen && tsc --noEmit`, para que os tipos de rota do Next existam sem build.
- **Comando agregado:** `npm run check` roda lint, typecheck, testes e formatação.
- As convenções estão documentadas em `docs/CONVENCOES.md`.

**Motivo:** O responsável pediu comandos claros para dev, build, lint, typecheck e test, proibição de `any` no código próprio e suporte a testes de regra de negócio e de componentes. Separar os ambientes deixa os testes de regra rápidos (sem DOM). O Vite 8, usado pelo Vitest 5, resolve os aliases do `tsconfig` e o JSX sozinho, dispensando `vite-tsconfig-paths` e `@vitejs/plugin-react`.

**Impacto:** Todo código novo passa pelos mesmos portões. O build também verifica os tipos dos arquivos de teste, porque o `tsc` do Next checa o projeto inteiro.

**Arquivos afetados:** `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.gitattributes`, `.nvmrc`, `vitest.config.mts`, `vitest.setup.ts`, `docs/CONVENCOES.md`.

---

## MDI-D015

**Data:** 2026-10-30

**Decisão:**
- As variáveis de ambiente são validadas com Zod em `src/config/env.ts`.
- Nesta fase existem só as públicas do Supabase: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Ambas são **opcionais**; string vazia conta como ausente.
- Valores presentes mas inválidos (URL malformada) derrubam `next dev` e `next build` logo ao carregar `next.config.ts`.
- O código que precisar do Supabase chama `requireSupabaseEnv()`, que falha com mensagem clara se faltar configuração.
- Cada variável é lida por extenso (`process.env.NEXT_PUBLIC_X`), condição para o Next embuti-la no bundle.
- Apenas `.env.example` é versionado.

**Motivo:** O responsável pediu validação tipada, só o necessário para a integração futura, e que o projeto rode sem as variáveis. Validar na configuração detecta erro antes do deploy.

**Impacto:**
- **Nome da chave pública:** segue a instrução do responsável (`ANON_KEY`), no lugar do `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` citado na auditoria da Etapa 00. É a mesma chave pública que a MDI-D011 chama de "publishable": tanto a chave legada `anon` quanto a nova `sb_publishable_…` cabem nela.
- **Chave secreta (`SUPABASE_SECRET_KEY`, server-only):** só será adicionada quando houver uso, na Etapa 02.
- **`NEXT_PUBLIC_SITE_URL`:** só será adicionada quando houver uso, na Etapa 07.

**Arquivos afetados:** `src/config/env.ts`, `src/config/env.test.ts`, `next.config.ts`, `.env.example`, `.gitignore`.

---

## MDI-D016

**Data:** 2026-10-30

**Decisão:**
- A visibilidade de cada chave de `site_settings` é definida **na migration**, por uma coluna gerada (`is_public`) que o painel não consegue alterar.
- O banco só aceita as chaves `whatsapp`, `store`, `footer`, `seo` e `media`.
- São públicas `whatsapp`, `store`, `footer` e `seo`. É privada `media` (regras internas de upload).
- O público lê só as chaves públicas.
- Tornar uma chave pública, ou criar uma nova, exige migration.
- Segredos nunca são guardados em `site_settings`.

**Motivo:** O responsável proibiu a leitura pública indiscriminada de `site_settings` e pediu uma estratégia explícita. A auditoria da Etapa 00 previa "leitura de todas as chaves". Uma flag editável no painel permitiria expor por engano uma configuração interna.

**Impacto:** As páginas públicas leem as configurações de que precisam com a chave pública, e configurações internas não vazam. A mudança de visibilidade passa por revisão de código.

**Arquivos afetados:** `supabase/migrations/20261030210800_contacts_and_settings.sql`, `supabase/migrations/20261030211100_rls.sql`.

---

## MDI-D017

**Data:** 2026-10-30

**Decisão:**
- **Identidade:** só `auth.users` do Supabase (e-mail e senha), sem senha paralela. Cadastro público desativado (`[auth] enable_signup = false`).
- **Login:** feito **no navegador**, com a chave pública. Assim o limite de tentativas do Supabase vale por IP do usuário, e não pelo IP do servidor. A sessão fica em cookies (`@supabase/ssr`), compartilhada com o servidor.
- **`src/proxy.ts`:** só renova a sessão e redireciona quem não tem sessão. Não é fronteira de segurança.
- **Autorização:** no servidor (`getAdminContext`), com JWT validado por `getClaims` e perfil lido com a sessão do próprio usuário (a RLS só devolve o perfil dele). A autorização final é sempre da RLS. Toda Server Action futura do painel também verifica o perfil.
- **Primeiro OWNER:** criado pela função `app.bootstrap_first_owner(email, nome)`, executada no SQL Editor do Dashboard (como `postgres`). Ela funciona só enquanto não existe OWNER e não é executável via API.
- **Service role:** a aplicação não usa `service_role`. A chave secreta só entrará quando houver necessidade real (ex.: convite de administradores pelo painel), e apenas no servidor.

**Motivo:** O Brain §22 diz que o front-end nunca é fronteira de segurança. O responsável pediu fundação de autenticação sem sistema de senha paralelo, primeiro OWNER sem e-mail no código e nenhum uso de `service_role` sem necessidade.

**Impacto:**
- No projeto remoto, desativar o cadastro e ajustar a política de senha exige configuração manual no Dashboard.
- Convidar administradores pelo painel (Etapa 04) exigirá a chave secreta no servidor, com nova revisão de segurança.

**Arquivos afetados:** `src/lib/supabase/{browser,server,proxy}.ts`, `src/proxy.ts`, `src/services/auth/*`, `src/components/admin/login-form.tsx`, `src/app/admin/**`, `supabase/config.toml`, `supabase/migrations/20261030210100_admin_profiles.sql`.

---

## MDI-D018

**Data:** 2026-10-30

**Decisão:** A implementação ajusta pontos do modelo descrito na auditoria (seção 5), sem contrariar as decisões D001–D012:

- **Auditoria:**
  - A tabela se chama `audit_logs`, com as colunas pedidas pelo responsável (`actor_user_id`, `entity_type`, `entity_id`, `operation`, `old_value`, `new_value`, `created_at`), mais `actor_role`, `source` e `changed_fields`.
  - As operações `PUBLISH` e `UNPUBLISH` passam a ser explícitas.
  - Alteração de preço e de disponibilidade é um `UPDATE` com o campo em `changed_fields`.
- **Proteções no banco contra dados forjados pelo cliente:**
  - `created_by`, `updated_by`, `deleted_by`, `created_at` e `updated_at` são sempre definidos por trigger.
  - `price_from` só muda pelo recálculo interno.
  - `published_at` só é preenchido na primeira publicação.
  - Registros filhos não podem trocar de produto.
- **Padrões seguros:** categorias e blocos da Home nascem inativos; produtos nascem `DRAFT`.
- **Enum × CHECK:** `media_slot` virou CHECK (uso em uma única tabela). `section_theme` continua enum (será reutilizado).
- **Funções do schema `app`:** nascem sem `EXECUTE` para `PUBLIC`; cada uso é concedido explicitamente.
- **Adiados para a etapa que os usa:**
  - `collections` e `collection_products`, com a coluna `homepage_sections.collection_id`: Etapa 05.
  - `product_sections`: Etapa 04, aba Conteúdo.
  - O desenho deles continua o da MDI-D009.
- **Storage:** mantido um bucket `media` com as pastas do Brain §20 (MDI-D007), no lugar dos cinco buckets sugeridos. As políticas por pasta dão o mesmo controle, e a biblioteca `media_assets` fica com uma origem única.
- **Leitura pública do bucket:** o bucket é público (URL direta via CDN), com caminhos em UUID. O anônimo não lista objetos, e os metadados de mídia não publicada ficam ocultos pela RLS. O arquivo de uma mídia ainda não publicada é acessível a quem souber a URL exata.

**Motivo:** São ajustes surgidos na implementação e nas instruções da Etapa 02, registrados para manter rastreabilidade com a auditoria.

**Impacto:** Novas tabelas devem seguir o mesmo padrão: RLS ativa na criação, grants explícitos, triggers de metadados e auditoria, e testes pgTAP. Esse padrão está em `docs/CONVENCOES.md`.

**Arquivos afetados:** `supabase/migrations/*`, `supabase/tests/*`, `docs/CONVENCOES.md`.

---

## MDI-D019

**Data:** 2026-10-31

**Decisão:** A matriz de privilégios do banco é totalmente explícita e não depende dos privilégios padrão do ambiente.
- `service_role` não tem nenhum privilégio nas tabelas do projeto. A aplicação não usa essa chave (MDI-D017). Se uma etapa futura precisar dela (por exemplo, a importação da Etapa 08), recebe o mínimo em migration própria.
- A sequence `audit_logs_id_seq` não tem privilégios para `anon`, `authenticated` nem `service_role`. A auditoria grava pelo trigger `SECURITY DEFINER`, que pertence ao `postgres`.
- Objetos futuros criados pelo `postgres` em `public` (tabelas, sequences e funções) nascem sem privilégios para `anon`, `authenticated` e `service_role`. Cada migration concede explicitamente o que for preciso.
- O teste pgTAP `07_privileges` fixa a matriz de grants por papel e tabela.

**Motivo:** Depois do primeiro `db push`, a comparação do catálogo local com o remoto mostrou que os padrões dos ambientes são diferentes.
- **Remoto (padrão clássico do Supabase):** concede `ALL` em tabelas novas a `anon`, `authenticated` e `service_role`, `SELECT/UPDATE/USAGE` em sequences e `EXECUTE` em funções.
- **Local (CLI 2.109):** não concede DML.

As migrations já zeravam `anon` e `authenticated`, mas `service_role` e a sequence ficavam com o que o ambiente desse. Pela regra do projeto, a divergência é corrigida por migration, nunca pelo Dashboard.

**Impacto:**
- Local e remoto ficam idênticos.
- A chave `service_role` fica sem acesso aos dados do catálogo, então um vazamento dela não expõe nem altera essas tabelas. Ela continua com acesso administrativo ao Auth e ao Storage, que é da plataforma.
- Tabelas criadas pelo Dashboard não ficam expostas pela API automaticamente. Pela regra do projeto, o Dashboard não altera o schema de qualquer forma.

**Arquivos afetados:** `supabase/migrations/20261031104058_explicit_privileges.sql`, `supabase/tests/07_privileges.test.sql`, `docs/CONVENCOES.md`.

---

## MDI-D020

**Data:** 2026-10-31

**Decisão:**
- **Modelo de cache:** o projeto adota o modelo recomendado do Next 16, **Cache Components** (`cacheComponents: true`, `partialPrefetching: true`). É a "API exata de cache" que a MDI-D011 deixou para confirmar.
  - As consultas públicas usam `'use cache'` + `cacheLife("hours")` + `cacheTag`. As tags são `catalog` (catálogo) e `settings` (contato padrão e configurações públicas).
  - Toda Server Action de escrita invalida a tag afetada com `updateTag`, para que a alteração apareça na leitura seguinte.
  - O `cacheLife("hours")` é rede de segurança para alterações que não passem pelas actions.
- **Painel:** as rotas `/admin` leem a sessão no topo do layout e recebem `export const instant = false` (autorizadas a bloquear no servidor). Não houve refatoração.
- **Páginas técnicas** `/[categorySlug]` e `/produto/[slug]`, no grupo `(site)`:
  - sem design final, com `robots: noindex`;
  - o conteúdo depende do slug e chega por streaming dentro de `<Suspense>`, com estado de carregamento;
  - o layout não consulta dados, então o build não depende do banco;
  - imagens via `next/image` com `unoptimized`.

**Motivo:**
- A MDI-D011 exige leitura pública cacheada e invalidada por tag.
- Na documentação do Next 16, `unstable_cache` pertence ao "modelo anterior".
- O responsável pediu páginas técnicas mínimas nesta etapa, o que trouxe as consultas cacheadas para o uso real.

**Impacto:**
- **Status HTTP:** com o streaming, um produto não publicado ou inexistente mostra a página "não encontrada", mas responde **200** com `noindex`. Foi testado; o status não pode mudar depois de iniciado o streaming. O 404 real exige `generateStaticParams` com verificação prévia, ou checagem no proxy, e fica para as Etapas 05/07 junto com SEO.
- **Cache no servidor:** é por instância (em memória) no modelo atual. A estratégia de cache distribuído fica para a Etapa 10, junto com o deploy.

**Arquivos afetados:** `next.config.ts`, `src/services/catalog/queries.ts`, `src/services/catalog/tags.ts`, `src/services/catalog/action-runner.ts`, `src/app/(site)/**`, `src/app/admin/(painel)/layout.tsx`, `src/app/admin/login/page.tsx`, `src/app/not-found.tsx`.

---

## MDI-D021

**Data:** 2026-10-31

**Decisão:** As regras de exibição ficam em `src/lib`, como fonte única, e chegam prontas aos componentes.
- **Preço** (`src/lib/pricing`):
  - centavos viram reais sem centavos quando o valor é inteiro ("R$ 8.999") e com duas casas quando não é ("R$ 549,90"), com espaço não separável após "R$";
  - a parcela sai como "ou {n}x de R$ {valor}". Quando `installment_text` está preenchido, **substitui** a linha gerada;
  - "Consulte valores" aparece quando `price_on_request` está ligado ou não há `price_cash`;
  - `price_old` só aparece (riscado, "de") se for maior que o preço à vista.
- **Preço do produto (cards):**
  - considera só variantes visíveis e não descontinuadas, o mesmo critério de `price_from`;
  - mostra "A partir de" + menor preço quando há preços diferentes, e o preço único quando todas custam o mesmo;
  - a parcela e o preço "de" vêm da variante mais barata.
- **Disponibilidade** (`src/lib/availability`): rótulos do Brain §12. A do produto é derivada pela prioridade da MDI-D006. `HIDDEN` nunca é exibida ao público.
- **Variante padrão efetiva** (`src/lib/catalog/variants`): a marcada como padrão, se visível; senão, a primeira visível na ordem. Rótulos: "256 GB / Preto" na interface e "256 GB Preto" na mensagem.
- **WhatsApp** (`src/lib/whatsapp`):
  - template de `site_settings.whatsapp` com `{produto}`, `{variante}` e `{origem}`; sem template, usa o texto do Brain §13;
  - link `https://wa.me/<dígitos>?text=…` com o contato padrão ativo. Sem contato padrão, não há botão;
  - a saída reproduz exatamente o exemplo do §13 (teste unitário).
- **Valor digitado no painel:** `parseBRLToCents` aceita "8.999", "8.999,90", "R$ 549,9". Ponto só como separador de milhar.

**Motivo:**
- O Brain §11 dá o formato de exibição e proíbe preço no JSX.
- O §13 dá o formato da mensagem.
- O Brain lista `installment_text` sem definir o uso; tratá-lo como substituto permite textos como "em até 12x sem juros".
- A MDI-D005 define o critério do "a partir de".

**Impacto:** Componentes não formatam valores. Mudar a regra de exibição é mudar um arquivo de `src/lib`, coberto por testes.

**Arquivos afetados:** `src/lib/pricing/`, `src/lib/availability/`, `src/lib/catalog/variants.ts`, `src/lib/whatsapp/`, `src/services/catalog/mappers.ts`.

---

## MDI-D022

**Data:** 2026-10-31

**Decisão:** Três invariantes do catálogo passam a ser garantidas pelo banco (migration `20261031171835_catalog_invariants`):
- **Variante padrão (completa a D005):**
  - a primeira variante **visível** de um produto vira padrão automaticamente (trigger);
  - a troca é atômica pela função `public.set_default_variant(uuid)`, `SECURITY INVOKER`: só quem edita variantes pela RLS consegue trocar, e a auditoria registra o autor;
  - variante oculta ou excluída não pode ser a padrão.
- **Pré-requisitos mantidos (completa a D006):**
  - produto publicado não pode ficar sem variante visível (ocultar ou excluir a última é bloqueado);
  - nem sem imagem principal (remover ou mover a principal é bloqueado; trocar o arquivo é permitido);
  - mídia excluída não pode ser vinculada.
- **Exclusão de categoria e família:** é bloqueada enquanto houver filhos ativos. Desativar a categoria (`is_active = false`) continua permitido; é a forma intencional de tirar uma linha do ar.

**Motivo:**
- A revisão da Etapa 03 encontrou lacunas entre decisões aprovadas e o banco:
  - a D005 pedia "exatamente uma padrão", mas o banco garantia só "no máximo uma";
  - a D006 só verificava os pré-requisitos na transição para publicado;
  - a exclusão de categoria tirava a linha inteira do site sem aviso.
- As lacunas foram registradas antes da alteração e aprovadas no plano.

**Impacto:**
- Para remover a última variante visível ou a imagem principal, é preciso despublicar antes.
- As mensagens chegam ao painel em português, associadas ao campo (`publish:*`, `catalog:*`, `media:*`, `variant:*`).
- Cobertura: pgTAP `08_catalog_invariants` e testes de integração.

**Arquivos afetados:** `supabase/migrations/20261031171835_catalog_invariants.sql`, `supabase/tests/08_catalog_invariants.test.sql`, `src/types/database.ts`.

---

## MDI-D023

**Data:** 2026-10-31

**Decisão:**
- **Funções existentes:** nenhuma função tem `EXECUTE` para `PUBLIC`. A migration 15 revoga o privilégio de todas as funções do schema `app` (os grants explícitos a `anon`/`authenticated` das funções usadas pela RLS continuam).
- **Funções futuras:** passam a nascer fechadas pelo padrão **global** do `postgres` (`alter default privileges for role postgres revoke execute on functions from public`).
- **Testes:** o `07_privileges` verifica as duas coisas e confere que `set_default_variant` só é executável por `authenticated`.

**Motivo:**
- A MDI-D018 afirmava que as funções de `app` nasciam sem `EXECUTE` para `PUBLIC`. **Não era verdade.** O `alter default privileges ... in schema app` da migration 01 não remove o padrão global do PostgreSQL: privilégio padrão por schema só acrescenta.
- A comparação de catálogo da Etapa 02 mostrou 11 funções abertas.
- **Gravidade baixa:** o schema `app` não é exposto pela API. Mesmo assim era uma garantia registrada que não valia.

**Impacto:**
- Esta decisão corrige o texto da D018, sem editá-la.
- Toda função nova precisa de `grant execute` explícito para quem a usa.

**Arquivos afetados:** `supabase/migrations/20261031171835_catalog_invariants.sql`, `supabase/tests/07_privileges.test.sql`, `docs/CONVENCOES.md`.

---

## MDI-D024

**Data:** 2026-10-31

**Decisão:** A camada de serviços do catálogo tem três partes:
- **Núcleo com cliente injetado** (`src/services/catalog/mutations/*`, `public-queries.ts`, `admin-queries.ts`, `src/services/media/mutations.ts`):
  - recebe o cliente Supabase e o input já validado, e devolve `CatalogResult`: `{ ok, data }` ou `{ ok: false, error: { code, message, field?, fieldErrors? } }`;
  - escritas usam a sessão do administrador (RLS + auditoria); leituras públicas usam o cliente público sem cookies;
  - como a RLS não gera erro em `UPDATE`, só filtra, toda escrita confere a linha afetada e responde "não encontrado ou sem permissão".
- **Server Actions finas** (`actions.ts`): recebem `unknown` e passam por `runCatalogAction`, que faz:
  1. sessão e papel (catálogo: OWNER/ADMIN/CATALOG_MANAGER; mídia: também CONTENT_EDITOR);
  2. validação com Zod (`src/lib/catalog/schemas.ts`);
  3. chamada ao núcleo;
  4. `updateTag`;
  5. retorno só de ids, slugs e mensagens.
- **Erros do banco** (`src/lib/catalog/errors.ts`): viram mensagens em português ligadas ao campo. Erro desconhecido vira mensagem genérica, sem detalhes internos.
- **Produto e status:** produto nasce `DRAFT` e muda de status só por `setProductStatus`. Publicar confere todas as pendências de uma vez (espelho de `app.assert_product_publishable`), e o banco continua garantindo.
- **Ordenação:** recebe a lista completa do escopo e grava 10, 20, 30… só nos itens que mudaram. As gravações são sequenciais.
- **Mídia nesta etapa:** só metadados (`registerMediaAsset`), alt, exclusão segura e vínculos ao produto. O envio do arquivo ao Storage entra na Etapa 04 (decisão do responsável).
- **Testes:** um alias do Vitest substitui `server-only` por um stub, para testar o núcleo contra o Supabase local.

**Motivo:**
- O guia de Server Actions do Next 16 trata cada action como entrada pública não confiável: autenticar, validar e restringir o retorno.
- Injetar o cliente permite testar as regras com sessões reais (RLS e triggers de produção) sem depender do runtime do Next.

**Impacto:**
- O painel da Etapa 04 só consome as actions.
- Regras novas entram no núcleo, com teste de integração.
- Server Actions sem tela não ficam expostas: o Next remove do bundle as actions não referenciadas.

**Arquivos afetados:** `src/services/catalog/**`, `src/services/media/**`, `src/lib/catalog/**`, `vitest.config.mts`, `tests/stubs/server-only.ts`, `tests/integration/**`.

---

## MDI-D025

**Data:** 2026-11-01

**Decisão:** O painel administrativo segue a estrutura abaixo.
- **Rotas:** as do Brain §6, em `src/app/admin/(painel)/`: dashboard, produtos (lista, novo, editor), categorias, mídia, contatos, configurações e usuários. `/admin` redireciona para o dashboard. Home, banners e coleções ficam para a Etapa 05; SEO, para a Etapa 07.
- **Permissões por área:** `src/lib/auth/permissions.ts` (`AREA_ROLES`) espelha a RLS. A mesma tabela alimenta:
  - o **menu**, que é só UX;
  - a **proteção de cada página no servidor** (`requireAdminPage(área)`: sem sessão → login; sem papel → "Sem permissão");
  - as **Server Actions**.

  A garantia final continua sendo a RLS.
- **Editor de produto:** abas por URL (`?aba=geral|comercial|variantes|midia|conteudo|seo`), cada uma renderizada no servidor.
  - Painel de publicação mostra as pendências antes; Publicar fica desabilitado enquanto houver alguma.
  - Pré-visualização usa as mesmas regras do site: preço, parcelamento, disponibilidade, variante selecionada e estado de publicação.
- **Formulários:** client components com `useActionState`. A conversão de FormData fica em `src/lib/forms` (reais → centavos, checkbox → booleano); a validação que vale é a do servidor.
  - Toda action de escrita chama `updateTag` (site público) e `refresh()` (telas do painel) no sucesso.
- **Componentes próprios em HTML nativo, sem biblioteca de UI** (decisão do responsável):
  - `<dialog>` nativo para diálogos e confirmações;
  - abas como links com `aria-current`;
  - ordenação por botões ↑↓;
  - campos com label, ajuda e erro ligados por `aria-describedby`.
- **Cache Components:**
  - as rotas do painel têm `instant = false`;
  - o cliente Supabase com sessão chama `connection()` antes de ler a sessão, para não rodar na pré-renderização da pré-busca (`Date.now()` do supabase-js).

**Motivo:**
- O Brain §15 pede painel para pessoa sem conhecimento técnico.
- O responsável pediu clareza, velocidade de operação, consistência, acessibilidade e notebook/tablet, sem visual "cinematográfico".
- Também pediu que o menu oculto nunca fosse fronteira de segurança.

**Impacto:**
- Uma única tabela de papéis por área.
- Telas novas seguem o mesmo kit (`src/components/admin/ui`) e o mesmo padrão de formulário (`docs/CONVENCOES.md`).

**Arquivos afetados:** `src/app/admin/(painel)/**`, `src/components/admin/**`, `src/lib/auth/permissions.ts`, `src/lib/forms/`, `src/lib/admin/`, `src/services/auth/page-guard.ts`, `src/services/admin/`, `src/services/catalog/action-runner.ts`, `src/lib/supabase/server.ts`.

---

## MDI-D026

**Data:** 2026-11-01

**Decisão:** O envio de arquivos é feito em três passos, sem dependência nova:
1. **Preparo** (`prepareMediaUploadAction`): o servidor valida papel, pasta do §20, formato, tamanho e "vídeo habilitado"; gera o caminho `<pasta>/<uuid>.<ext>`; e devolve uma URL de envio **temporária** (`createSignedUploadUrl` com a sessão do usuário, então a política de insert do Storage vale).
2. **Envio:** o navegador manda o arquivo direto ao Storage, sem passar pelo limite de 1 MB das Server Actions. Antes, mostra a prévia e lê as dimensões da imagem.
3. **Finalização** (`finalizeMediaUploadAction`): o servidor confere o objeto real e, se tudo estiver certo, registra em `media_assets`. Se a conferência ou o registro falharem, **apaga o arquivo**. A conferência verifica:
   - existência, tamanho e tipo (`storage.info`);
   - extensão igual à preparada;
   - os primeiros bytes (`lib/media/signature`: JPEG, PNG, WEBP, AVIF, MP4), que precisam bater com o tipo declarado.

Outras regras:
- Não existe action que registre um caminho de mídia sem essa verificação. O `registerMediaAssetAction` da Etapa 03 foi removido; o núcleo `registerMediaAsset` só é chamado pela finalização.
- As dimensões vêm do navegador, validadas como inteiros positivos com limite.
- A limpeza automática de arquivos órfãos (envio abandonado entre os passos 2 e 3) **não** foi implementada nesta etapa. Fica para a Etapa 09 (pedido do responsável).

**Motivo:** O responsável exigiu validar tamanho, tipo real e conteúdo, e apagar o arquivo se o registro falhar. O mime enviado pelo navegador não é confiável; a assinatura do arquivo é.

**Impacto:**
- **Arquivo falso é recusado:** HTML com extensão `.png` é rejeitado e apagado (teste de integração).
- **Risco residual baixo:** dimensões informadas pelo navegador afetam só o layout.
- **Possíveis órfãos no Storage** até a Etapa 09.

**Arquivos afetados:** `src/services/media/upload.ts`, `src/services/media/actions.ts`, `src/lib/media/signature.ts`, `src/lib/admin/schemas.ts`, `src/components/admin/media/*`.

---

## MDI-D027

**Data:** 2026-11-01

**Decisão:** A gestão de administradores não usa `service_role`, convite por e-mail nem SMTP (escolha do responsável). Migration 16 (`20261101001906_admin_panel`):
- **`public.list_admin_users()`** (`SECURITY DEFINER`): só OWNER e ADMIN. Devolve os perfis com e-mail e último acesso. O e-mail é dado pessoal e não é exposto a outros papéis.
- **`public.grant_admin_profile(email, nome, papel)`** (`SECURITY DEFINER`): só o OWNER.
  - Exige que o login exista e esteja confirmado; o responsável o cria em *Authentication → Users*.
  - Não duplica perfil.
  - A auditoria registra o OWNER como autor.
- **`public.set_default_contact(uuid)`** (`SECURITY INVOKER`): troca atômica do contato padrão, com a RLS de OWNER e ADMIN valendo. Mesmo motivo da variante padrão: o índice único parcial impede duas gravações.
- Trocar papel, ativar e desativar continua pela edição normal de `admin_profiles` (RLS de OWNER). As travas da migration 02 impedem alterar o próprio papel e ficar sem OWNER; as mensagens chegam traduzidas ao painel.
- As três funções têm `EXECUTE` só para `authenticated` (testado em `07_privileges`).

**Motivo:**
- Evitar a chave secreta na aplicação (MDI-D017, D019).
- O e-mail padrão do Supabase só entrega para a equipe, então convites dependeriam de SMTP próprio.

**Impacto:**
- Adicionar um administrador são dois passos (login no Dashboard, perfil no painel).
- Recuperação de senha por e-mail continua indisponível para outros administradores até haver SMTP.

**Arquivos afetados:** `supabase/migrations/20261101001906_admin_panel.sql`, `supabase/tests/09_admin_panel.test.sql`, `supabase/tests/07_privileges.test.sql`, `src/services/admin/*`, `src/components/admin/users/*`, `src/components/admin/contacts/*`.

---

## MDI-D028

**Data:** 2026-11-01

**Decisão:**
- Os blocos editoriais do produto (benefícios e seções editoriais, tabela `product_sections`) saem da Etapa 04 e entram na **Etapa 05**, junto com a Home e o design.
- Na Etapa 04, a aba Conteúdo do editor tem só as especificações.
- Ajusta a MDI-D018, que previa `product_sections` na Etapa 04.

**Motivo:**
- Os blocos usam o mesmo sistema da Home (MDI-D009) e só aparecem no site com o design da Etapa 05.
- Definir os campos de cada bloco antes de ver como aparecem arriscaria retrabalho.
- Decisão do responsável.

**Impacto:** Nenhuma tabela nova nesta etapa para conteúdo editorial. A aba Conteúdo avisa que os blocos chegam na Etapa 05.

**Arquivos afetados:** `src/components/admin/products/editor/specs-tab.tsx`.

---

## MDI-D029

**Data:** 2026-11-01

**Decisão:**
- **Adoção:** Playwright (`@playwright/test`, dependência de desenvolvimento) passa a cobrir os fluxos críticos do painel já na Etapa 04. Ajusta a MDI-D014, que o previa só na Etapa 09.
- **Ambiente controlado:** os testes rodam **só contra o Supabase local**.
  - `tests/e2e/serve.mjs` lê URL e chave pública do `supabase status`, recusa qualquer endereço que não seja local, faz o build de produção e sobe na porta 3100.
  - Usuários do seed local: OWNER, CONTENT_EDITOR (acrescentado ao seed) e conta sem perfil.
  - Um teste por vez, porque todos compartilham o mesmo banco.
- **Comando:** `npm run test:e2e`, que não faz parte do `npm run check` (exige Supabase local e navegador).
- **Fluxos cobertos:**
  - login; categoria e família; produto; variante com preço e parcelamento; envio de imagem verificado; publicação com pendências antes; página pública; edição de preço refletida no site (invalidação de cache ponta a ponta); despublicação; Sair;
  - recusas por papel pela URL; conta sem perfil; sem sessão;
  - painel no celular (viewport Pixel 7).

**Motivo:** O Brain §38 exige os fluxos de admin funcionando de ponta a ponta. O responsável autorizou e pediu a validação do cache do painel ao site sem deploy.

**Impacto:**
- O Chromium do Playwright é baixado uma vez para a máquina.
- Os artefatos (`test-results/`, `playwright-report/`) ficam fora do git.

**Arquivos afetados:** `package.json`, `playwright.config.ts`, `tests/e2e/**`, `supabase/seed.sql`, `.gitignore`, `.prettierignore`.

---

## MDI-D030

**Data:** 2026-11-01

**Decisão:** A Home é montada só pelos blocos de `homepage_sections` (MDI-D009), sem migration nova.
- **Definição por tipo** (`src/lib/home/blocks.ts`): para cada um dos 11 tipos do Brain §19, os campos que o painel mostra, os obrigatórios e os rótulos dos itens repetidos.
  - Colunas guardam o que é comum: título, subtítulo, texto, produto, categoria, imagem, vídeo e tema.
  - `settings_json` guarda o específico: texto de apoio, posição da imagem, origem e quantidade da grade, botões e itens.
- **Validação:**
  - na escrita, Zod com regras por tipo (ex.: grade por categoria exige a categoria);
  - na leitura, modo tolerante: campo inválido é descartado sem derrubar o bloco;
  - só os campos do tipo são gravados.
- **Botões sem endereço livre:** o admin escolhe o destino entre produto do bloco, categoria do bloco, WhatsApp, loja física, ofertas e lançamentos. Um destino sem o vínculo necessário some do site.
- **Renderização:**
  - bloco sem o essencial não aparece (produto despublicado, categoria inativa, mídia excluída, loja sem endereço);
  - sem nenhum bloco válido ativo, a Home usa uma composição padrão (linhas Apple, lançamentos, loja).
- **Grade de produtos:** origem lançamentos, promoções, destaques ou categoria (Brain §7.3), de 3 a 12 itens.
- **Painel:**
  - área `home` em `AREA_ROLES` = OWNER, ADMIN e CONTENT_EDITOR, espelhando a RLS de `homepage_sections`;
  - tela `/admin/home` com ordem, ativar/desativar, edição por tipo, exclusão com confirmação e aviso de vínculo não publicado.
- **Cache:** tag nova `home`. A Home depende de `home`, `catalog` e `settings`.

**Motivo:** O Brain §18–§19 exige que o admin selecione conteúdo, sem HTML e sem poder quebrar o layout. A tabela da Etapa 02 já tinha tudo o que os blocos precisam.

**Impacto:**
- Um tipo de bloco novo continua exigindo código e decisão própria.
- Banners (`/admin/banners`, Brain §6) continuam sendo blocos PROMO_BANNER/FULLSCREEN_MEDIA e são editados em `/admin/home`.

**Arquivos afetados:** `src/lib/home/*`, `src/services/home/*`, `src/components/sections/*`, `src/components/admin/home/*`, `src/app/admin/(painel)/home/`, `src/app/(site)/page.tsx`, `src/lib/auth/permissions.ts`, `src/services/catalog/tags.ts`.

---

## MDI-D031

**Data:** 2026-11-01

**Decisão:**
- **Chaves usadas:** loja física (`site_settings.store`) e rodapé (`site_settings.footer`), que já eram públicas desde a migration (MDI-D016). Não houve migration.
- **Loja física:**
  - campos: nome, apresentação, endereço, bairro, cidade, CEP, até 7 linhas de horário, até 6 fotos da biblioteca (pasta `store`), link do mapa e texto do botão de atendimento;
  - aparece no bloco STORE, em `/loja` e no rodapé.
- **Rodapé:**
  - campos: apresentação, até 6 redes sociais, razão social, CNPJ, aviso legal e copyright (vazio = "© <ano> Moça do iPhone…");
  - links de navegação e categorias são do sistema, não do painel.
- **Links externos restritos** (`src/lib/site/links.ts`):
  - só `https://`, sem usuário, senha ou porta;
  - só os domínios de cada uso: Google Maps, Apple Maps e Waze no mapa; o domínio próprio de cada rede social;
  - validados na escrita e de novo na leitura.
- **Atendimento geral:** mensagem nova `general_message` em `site_settings.whatsapp`, para botões sem produto (cabeçalho, loja, rodapé). Usa texto padrão se vazia e o mesmo contato padrão (MDI-D012).
- **Permissão:** OWNER e ADMIN, como já define a RLS de `site_settings`.
- **Correção:** a leitura pública do WhatsApp passou a aceitar `null` nos campos. Antes, salvar a origem vazia invalidava a configuração inteira, e template e origem voltavam ao padrão.

**Motivo:** O Brain §7.7 e §7.8 pedem loja e footer administráveis, sem dado comercial no código, e o §18 proíbe HTML livre.

**Impacto:**
- Endereço, horários, redes e dados legais mudam pelo painel.
- As fotos da loja aparecem em "onde é usada" na biblioteca. O banco já impedia excluí-las (referência por JSON, migration 11).

**Arquivos afetados:** `src/lib/site/*`, `src/lib/whatsapp/whatsapp.ts`, `src/services/site/*`, `src/services/admin/{queries,mutations,actions}.ts`, `src/services/catalog/public-queries.ts`, `src/components/admin/settings/*`, `src/components/layout/*`, `src/app/(site)/loja/`.

---

## MDI-D032

**Data:** 2026-11-01

**Decisão:**
- **Otimização:** as imagens do site público passam pelo otimizador do next/image (`SiteImage`, `ArtDirectedImage`).
  - `sizes` por layout;
  - carregamento sob demanda fora da primeira dobra;
  - `preload` só na imagem principal (LCP);
  - a imagem mobile do produto usa `<picture>` (art direction do next/image).
- **Origem permitida:** `images.remotePatterns` aceita **só** o caminho público do bucket `media` do projeto configurado (`src/config/images.ts`). `dangerouslyAllowLocalIP` fica ligado só quando o Supabase é local (desenvolvimento e E2E).
- **Painel:** continua com `unoptimized` (miniaturas, inclusive de mídia ainda não publicada).
- **Vídeos:** sem reprodução automática e com `preload="none"`.

**Motivo:** O pedido da Etapa 05 inclui next/image com tamanhos responsivos. O otimizador do Next não exige plano pago no Supabase e reduz o peso das fotos de produto (Brain §27).

**Impacto:** Antecipa parte da estratégia de imagem prevista para a Etapa 07. A Etapa 07 continua responsável por revisar o custo do otimizador na Vercel ou trocá-lo pelo transformador do Supabase.

**Arquivos afetados:** `next.config.ts`, `src/config/images.ts`, `src/components/media/site-image.tsx`.

---

## MDI-D033

**Data:** 2026-11-01

**Decisão:**
- **Identidade:** sem manual de marca, continua **neutra**, refinada para o site público: monocromática premium (preto, branco, cinzas), botões em pílula, cards em superfície clara e seções claras ou escuras por bloco.
- **Tokens novos** em `tokens.css`: `text-lead`, `text-eyebrow`, `section-tight`, `header`, `container-text`, `radius-pill` e `ease-premium`. Valores de cor e contraste também foram ajustados.
- **Movimento:** só CSS (hover, foco, pressão do botão), com `prefers-reduced-motion` já global. Sem GSAP e sem Framer Motion nesta etapa.
- **Marca:** texto (`siteConfig.name`) no cabeçalho e no rodapé até existir o logo oficial.

**Motivo:** O Brain §30 proíbe inventar identidade definitiva. O pedido da Etapa 05 permite só transições discretas e microinterações simples.

**Impacto:**
- Cores, fonte e logo oficiais entram trocando `tokens.css` e o arquivo do logo, sem mexer nos componentes.
- O motion de storytelling fica para a Etapa 06.

**Arquivos afetados:** `src/styles/tokens.css`, `src/styles/globals.css`, `src/components/ui/*`.

---

## MDI-D034

**Data:** 2026-11-01

**Decisão:**
- **Páginas estáticas:** `/produto/[slug]` e `/[categorySlug]` usam `ensureStatic = "navigation"` e `generateStaticParams` (slugs publicados e categorias ativas). Toda leitura delas é cacheada, e `notFound()` acontece antes de qualquer streaming.
- **404 real:** produto inexistente, rascunho ou excluído, e categoria inexistente ou inativa, respondem **404 de verdade**. Testado no build de produção e no E2E. Fecha a pendência da MDI-D020.
- **Catálogo vazio:** sem nada publicado, `generateStaticParams` devolve um parâmetro inválido (`_`), porque o Next exige ao menos um. Essa página responde 404.
- **Corrige a D020:** o build passa a ler o banco, com a mesma leitura anônima do site, para gerar a Home, o cabeçalho, o rodapé e as páginas listadas. Banco indisponível no build = build falha.
- **Regra:** `(site)` não pode ter `loading.tsx`, que iniciaria o streaming e faria o status voltar a 200.

**Limitação conhecida:**
- **Cenário:** alguém abriu o endereço de um produto antes da publicação, e o 404 gerado sob demanda não guarda as tags de cache.
- **Efeito:** depois de publicar, **a primeira requisição** a esse endereço ainda pode receber o 404, enquanto o Next regera a página em segundo plano. As seguintes respondem 200.
- **Testado:** `updateTag` e `revalidatePath` não alcançam essa entrada.
- **Sem a limitação:** as páginas já geradas (200) são atualizadas na hora pelas tags, inclusive ao despublicar (viram 404).

**Motivo:** O pedido da Etapa 05 exigiu investigar o 404. O guia de streaming do Next 16 mostra que o status só pode ser decidido antes de o streaming começar.

**Impacto:** As páginas de produto e categoria são servidas estáticas e atualizadas pelas tags. A estratégia de cache distribuído continua na Etapa 10.

**Arquivos afetados:** `src/app/(site)/produto/[slug]/page.tsx`, `src/app/(site)/[categorySlug]/page.tsx`, `src/app/(site)/not-found.tsx`, `src/lib/site/routes.ts`, `src/services/catalog/public-queries.ts`.

---

## MDI-D035

**Data:** 2026-11-01

**Decisão:**
- **Coleções** (`collections`, `collection_products`, `homepage_sections.collection_id`) não foram criadas. A grade de produtos usa as vitrines do catálogo (lançamento, promoção, destaque) e a categoria.
- **Blocos editoriais do produto** (`product_sections`) também não. A página de produto pedida nesta etapa usa descrição, especificações e relacionados.
- **Ajustes:** D009 (o desenho continua o mesmo), D018 e D028, que previam as duas tabelas para esta etapa.

**Motivo:**
- O pedido da Etapa 05 manda acrescentar ao modelo só o que a Home e as páginas públicas precisam.
- Nenhum requisito desta etapa depende de lista curada nem de blocos por produto.
- Criar as tabelas antes do uso real arrisca retrabalho (o mesmo motivo da D028).

**Impacto:**
- Nenhuma migration nesta etapa e nenhum push remoto.
- As duas tabelas entram, com migration e pgTAP, quando uma etapa precisar delas (provavelmente a Etapa 06, com o storytelling por produto).

**Arquivos afetados:** nenhum (decisão de escopo).
