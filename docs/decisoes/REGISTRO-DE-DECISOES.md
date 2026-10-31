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
