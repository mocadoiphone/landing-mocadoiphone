# ETAPA 02 — Banco de dados e autenticação

> **Projeto:** Moça do iPhone 2.0 · **Data:** 2026-10-30 · **Status:** concluída no ambiente local, aguardando aprovação para a Etapa 03
> **Referências:** [Brain](../../moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md) · [Auditoria (seção 5)](../auditoria/ETAPA-00-AUDITORIA.md) · [Decisões](../decisoes/REGISTRO-DE-DECISOES.md) · [Convenções](../CONVENCOES.md)

## Objetivo

Criar a fundação de dados e autenticação: estrutura Supabase versionada, migrations, enums, tabelas, constraints, índices, RLS, Storage, perfis administrativos, auditoria, soft delete, login administrativo e testes de segurança.

## Resultado em uma frase

O banco é recriado do zero pelas 13 migrations e o seed. São 169 testes pgTAP, 9 testes de integração contra a API real, um teste de mutação que confirmou que a suíte detecta regressões, e o fluxo de login validado por HTTP. Tudo passou no Supabase **local**. O projeto remoto ainda não recebeu as migrations (ver Pendências).

## ⚠️ Achado crítico na validação do `.env`

- As credenciais estão em `.env.local` (não existe `.env`). O arquivo está corretamente ignorado pelo git.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` contém um **JWT com `role: service_role`**: a chave administrativa, que ignora a RLS.
  - Com o prefixo `NEXT_PUBLIC_`, ela seria embutida no JavaScript enviado ao navegador e daria acesso total ao banco a qualquer visitante.
- Verificado:
  - a chave não está em nenhum build nem em arquivo versionado;
  - o host do projeto responde (HTTP 401 sem chave).
  - A comunicação autenticada **não** foi testada, para não usar a `service_role`.
- **Proteção permanente adicionada:** `src/config/env.ts` aceita na variável pública **somente** uma chave pública íntegra: `sb_publishable_…`, ou JWT de exatamente 3 segmentos com `role: anon`.
  - Qualquer segmento com `service_role` (mesmo colado a outra chave), `sb_secret_…` ou formato desconhecido faz `next dev`, `next build` e `npm run typecheck` pararem com mensagem clara.
  - A primeira versão olhava só o 2º segmento do JWT e foi reforçada depois de um segundo incidente: chave `anon` seguida do restante da `service_role` (ver "Sincronização com ambiente remoto").
- **Correção (ação do responsável):** em *Project Settings → API Keys*, copiar a chave **anon** ou **publishable** para `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Como a chave secreta nunca saiu da máquina, rotacioná-la só é necessário se ela tiver sido compartilhada em outro lugar.

Nesta etapa, todas as validações do app rodaram contra o Supabase local. As variáveis do processo têm prioridade sobre o `.env.local`, e os valores são lidos de `supabase status` sem serem impressos.

## Estrutura criada

```txt
supabase/
├── config.toml          configuração local (cadastro desativado, senha forte, serviços não usados desligados)
├── migrations/          13 migrations versionadas (abaixo)
├── seed.sql             dados SOMENTE de desenvolvimento local
└── tests/               pgTAP: _fixtures.psql + 6 suítes
src/
├── lib/supabase/        browser.ts · server.ts · proxy.ts (renovação de sessão)
├── lib/auth/            roles.ts (rótulos) · sign-in.ts (validação e mensagens de login)
├── services/auth/       session.ts (getAdminContext) · actions.ts (sair)
├── components/admin/    login-form.tsx · sign-out-button.tsx
├── app/admin/           layout (noindex) · login/ · (painel)/ (layout autorizado + página mínima)
├── types/database.ts    tipos gerados do schema (npm run db:types)
└── proxy.ts             proxy do Next 16 para /admin
tests/integration/       testes contra a API real do Supabase local
```

## Migrations

| # | Arquivo | Conteúdo |
|---|---|---|
| 01 | `20261030210000_foundation.sql` | Schema privado `app` (não exposto pela API), enums, triggers de metadados e de soft delete |
| 02 | `20261030210100_admin_profiles.sql` | Perfis, helpers de papel (`has_role`, `is_staff`), travas (último OWNER, autoalteração), bootstrap do 1º OWNER |
| 03 | `20261030210200_media_assets.sql` | Biblioteca de mídia (alt obrigatório, tipo, tamanho, dimensões, pastas do §20) |
| 04 | `20261030210300_catalog.sql` | `categories`, `product_families`, `products` + índices |
| 05 | `20261030210400_product_variants.sql` | Variantes: preço em centavos, parcelamento, disponibilidade, unicidades |
| 06 | `20261030210500_product_media_and_specs.sql` | `product_media` (slots), `product_specs` |
| 07 | `20261030210600_catalog_rules.sql` | Visibilidade pública, pré-requisitos de publicação, `price_from` derivado, slot × tipo de mídia |
| 08 | `20261030210700_homepage.sql` | `homepage_sections` (blocos tipados) |
| 09 | `20261030210800_contacts_and_settings.sql` | `contacts` (padrão único), `site_settings` (chaves e visibilidade fixas) |
| 10 | `20261030210900_audit.sql` | `audit_logs` + trigger genérico em 11 tabelas |
| 11 | `20261030211000_media_rules.sql` | Contagem de referências, mídia pública, bloqueio de exclusão de mídia em uso |
| 12 | `20261030211100_rls.sql` | Grants explícitos e as 38 políticas RLS |
| 13 | `20261030211200_storage.sql` | Bucket `media` + 4 políticas de Storage |
| 14 | `20261031104058_explicit_privileges.sql` | Privilégios independentes do ambiente (MDI-D019): `service_role` sem acesso às tabelas, sequence da auditoria fechada, privilégios padrão de `public` zerados |

Cada migration traz no cabeçalho a estratégia de reversão (agente de modelagem).

## Tabelas e relacionamentos

```txt
auth.users ─1:1─ admin_profiles (role, is_active)

categories ─1:N─ product_families ─1:N─ products ─1:N─ product_variants
     │                                    │  └─1:N─ product_specs
     │                                    └─1:N─ product_media ─N:1─ media_assets
     │                                              └─(opcional) variante do MESMO produto
     └─ image_asset_id ───────────────────────────────────────────→ media_assets
products.og_image_asset_id, homepage_sections.media/video_asset_id, contacts.avatar_asset_id → media_assets
homepage_sections → product / category (opcionais)
site_settings (key: whatsapp|store|footer|seo|media) · audit_logs (append-only)
```

**Enums:** `admin_role`, `publication_status` (DRAFT/REVIEWED/PUBLISHED), `availability_status` (6 estados do §12), `media_kind`, `content_block_type` (11 tipos do §19), `section_theme`, `audit_operation`. Listas de uso único usam CHECK (ex.: slot de mídia).

**Constraints principais:**
- slugs em minúsculas com hífen;
- slug único entre não excluídos: categoria (global, sem slugs de rotas fixas), família (por categoria), produto (global);
- família da mesma categoria do produto (FK composta);
- preços ≥ 0;
- preço "de" maior que o preço à vista;
- parcela e quantidade de parcelas juntas, de 1 a 36;
- uma variante padrão por produto e nenhuma combinação capacidade × cor repetida;
- uma imagem MAIN e uma MOBILE por produto/variante;
- mídia de variante do mesmo produto;
- WhatsApp só com dígitos e DDI;
- um contato padrão, sempre ativo.

**Índices:** criados para consultas previstas: slugs (únicos parciais), página de categoria, vitrines (lançamentos, promoções, destaques), filtro do painel (status + atualização), variantes por produto, mídia por produto/slot, referências de mídia, Home ativa, histórico de auditoria. `published_at` e `deleted_at` não têm índice próprio: o filtro de publicados entra como predicado dos índices parciais, que já excluem registros apagados.

## Regras garantidas pelo banco

- **Preço (MDI-D005):** `price_from` = menor `price_cash` entre variantes não excluídas, fora de HIDDEN/DISCONTINUED e sem "consulte valores". Recalculado por trigger. Valor enviado pelo cliente é ignorado.
- **Publicação (MDI-D006):** só publica com categoria ativa, família não excluída, ao menos uma variante visível e imagem principal. `published_at` registra a primeira publicação. Produto não nasce publicado.
- **Soft delete (MDI-D010):** "excluir" = preencher `deleted_at`. `deleted_by` vem da sessão. `DELETE` físico não é concedido em categorias, famílias, produtos, variantes, mídia e contatos. Registro excluído some do público.
- **Autoria:** `created_by`, `updated_by` e as datas são definidos por trigger, nunca pelo cliente.
- **Mídia:** mídia em uso não pode ser excluída. Arquivo do Storage só pode ser apagado se nenhuma mídia ativa apontar para ele.
- **Perfis:** sempre resta um OWNER ativo, e ninguém altera o próprio papel nem desativa a própria conta.

## RLS (ativa nas 12 tabelas)

| Tabela | Público (anônimo / sem perfil) | Escrita |
|---|---|---|
| categories | ativas e não excluídas | OWNER, ADMIN, CATALOG_MANAGER |
| product_families | não excluídas, de categoria pública | idem |
| products | publicadas, não excluídas, categoria e família públicas | idem |
| product_variants | não excluídas, não HIDDEN, de produto público | idem |
| product_media / product_specs | de produto público (e variante pública) | idem (+ exclusão física) |
| media_assets | só se usada por conteúdo público | OWNER, ADMIN, CATALOG_MANAGER, CONTENT_EDITOR |
| homepage_sections | ativas | OWNER, ADMIN, CONTENT_EDITOR (+ exclusão física) |
| contacts | ativos e não excluídos | OWNER, ADMIN |
| site_settings | só chaves públicas (MDI-D016) | OWNER, ADMIN |
| admin_profiles | nada | OWNER (cada usuário lê o próprio perfil; OWNER/ADMIN leem todos) |
| audit_logs | nada | ninguém (só o trigger); leitura OWNER, ADMIN |

- **Staff:** qualquer perfil ativo lê também rascunhos e excluídos, para montar a Home e restaurar registros.
- **Admin inativo:** não administra nada.
- **Grants:** tudo é revogado de `anon` e `authenticated` e concedido explicitamente.
  - `service_role` não tem acesso às tabelas.
  - Objetos novos em `public` nascem sem privilégios padrão para os papéis da API (MDI-D019).
  - A matriz é fixada pelo teste `07_privileges`.

## Storage

- **Bucket:** `media` (público para leitura por URL), com limite de 50 MB e tipos JPG, PNG, WEBP, AVIF e MP4.
- **Upload e edição:** só perfis administrativos, nas pastas `products`, `categories`, `home`, `banners`, `store` e `seo`.
- **Anônimo:** não lista nem envia arquivos.
- **Exclusão:** só de arquivo sem mídia ativa.
- **Ressalva:** o arquivo de uma mídia ainda não publicada é acessível a quem souber a URL exata, mas os caminhos usam UUID e os metadados ficam ocultos (MDI-D018).

## Autenticação (MDI-D017)

1. `/admin/*` passa pelo `src/proxy.ts`, que renova a sessão e manda quem não tem sessão para `/admin/login`.
2. O login é feito no navegador, com chave pública e mensagens seguras em português (não revela se o e-mail existe).
3. O layout do painel chama `getAdminContext()` no servidor: JWT validado + perfil lido com a sessão do usuário.
   - Sem sessão → login.
   - Sem perfil ativo → "Acesso não autorizado" + botão Sair.
   - Autorizado → painel.
4. `/admin` mostra "Painel administrativo", o usuário autenticado e o perfil.
5. Todo o `/admin` tem `noindex`.

### Primeiro OWNER no projeto remoto (processo manual e seguro)

1. Dashboard → *Authentication → Users → Add user*: e-mail do responsável, senha forte, marcar *Auto Confirm User*.
2. Dashboard → *SQL Editor*: `select app.bootstrap_first_owner('email-do-responsavel', 'Nome');`
3. A função recusa se já existir um OWNER. Ela não é executável via API, e nenhum e-mail fica no código.

### Configurações do Auth no Dashboard remoto (não são migrations)

- *Authentication → Sign In / Providers*: **desativar "Allow new users to sign up"**, mantendo o provedor de e-mail ativo.
- Política de senha: mínimo de 10 caracteres, com maiúsculas, minúsculas e dígitos (igual ao local).
- *URL Configuration*: Site URL e Redirect URLs do domínio final (Etapa 10).

## Auditoria

- **O que registra:** `INSERT`, `UPDATE`, `DELETE`, `SOFT_DELETE`, `RESTORE`, `PUBLISH` e `UNPUBLISH`, com autor (`actor_user_id`), papel, origem (`admin`/`system`/`seed`/`bootstrap`/`migration`), entidade, registro, campos alterados e valores antes e depois. Em UPDATE guarda só os campos que mudaram.
- **Preço e disponibilidade:** filtrar por `changed_fields`. O recálculo de `price_from` também é auditado, com o mesmo autor.
- **O que não registra:** atualização sem mudança real.
- **Imutável via API**, mesmo para OWNER.

## Seed (somente local)

- **Usuários:** `dono@local.test` (OWNER, criado pelo próprio bootstrap) e `visitante@local.test` (sem perfil), com senha de desenvolvimento definida em `supabase/seed.sql`.
- **Catálogo de teste:**
  - as 8 categorias do Brain;
  - uma família de teste;
  - um produto rascunho e um publicado, ambos "Consulte valores" e sem preço;
  - um contato fictício (DDD 00) e configurações de exemplo.
- **Remoto:** o seed **não** roda no projeto remoto.

## Comandos

```bash
npm run db:start          # sobe o Supabase local (Docker)
npm run db:reset          # recria o banco local: migrations + seed
npm run db:test           # testes pgTAP (RLS, constraints, regras, auditoria, Storage)
npm run db:lint           # linter de schema do Supabase
npm run db:types          # regenera src/types/database.ts
npm run db:stop           # para o Supabase local
npm run test              # unitários + componentes (sem Docker)
npm run test:integration  # API real do Supabase local (exige db:start + db:reset)
```

**Para rodar o app contra o Supabase local:** crie `.env.development.local` (ignorado pelo git) com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` tirados de `supabase status`. Esse arquivo tem prioridade sobre o `.env.local` no `npm run dev`.

## Testes realizados

| Verificação | Resultado |
|---|---|
| Reset completo do zero (14 migrations + seed) | ✅ |
| `supabase db lint` | ✅ Nenhum erro de schema |
| pgTAP (`npm run db:test`) | ✅ 209 testes em 7 suítes: constraints (32), acesso público (44), papéis (40), regras do catálogo (22), auditoria (17), Storage (14), privilégios (40) |
| Teste de mutação | ✅ Leitura pública de produtos liberada e `DELETE` concedido de propósito → 6 testes falharam nos pontos certos; banco recriado depois |
| Integração com a API real (`npm run test:integration`) | ✅ 9 testes: anônimo, cadastro bloqueado (`signup_disabled`), senha errada, OWNER, usuário sem perfil, auditoria com autor |
| Fluxo de UI por HTTP com cookie de sessão real | ✅ Sem sessão → 307 para o login · OWNER → painel com e-mail e "Proprietário (OWNER)" · sem perfil → "Acesso não autorizado" · OWNER no login → 307 para `/admin` · cookie forjado → 307 para o login |
| `npm run test` (unit + componentes) | ✅ 23 testes (env, trava de chave pública por lista de permitidos, login, formulário) |
| `npm run build` | ✅ (com as variáveis do Supabase local) |
| `npm run typecheck` · `npm run lint` · `npm run format:check` | ✅ |
| Segredos no bundle do cliente | ✅ Nenhuma chave; só aparecem os literais `sb_secret_`/`service_role` das funções que detectam chaves |
| Tipos gerados × schema | ✅ Em sincronia |

**Problemas encontrados e corrigidos durante a etapa:**
- O bootstrap marcava como `bootstrap` tudo o que vinha depois dele na mesma transação. Agora restaura a origem anterior.
- `[auth.email] enable_signup = false` desligava o login por e-mail inteiro. O cadastro agora é bloqueado só por `[auth] enable_signup = false`, com comentário explicando no `config.toml`.
- Dois testes passavam pelo motivo errado e foram endurecidos:
  - auditoria `system`: casava com o INSERT das fixtures;
  - cadastro bloqueado: passava porque o e-mail estava desligado.
- As claims de JWT agora são limpas a cada troca de papel nos testes.

## Decisões

- **MDI-D016:** configurações públicas definidas por chave, na migration.
- **MDI-D017:** fluxo de autenticação administrativa (login no navegador, autorização no servidor + RLS, bootstrap do OWNER, sem `service_role`).
- **MDI-D018:** ajustes ao modelo da Etapa 00:
  - `audit_logs` e operações de publicação;
  - proteções contra dados forjados;
  - padrões seguros;
  - `collections` e `product_sections` adiados;
  - bucket único mantido.
- **MDI-D019:** privilégios explícitos e independentes do ambiente (`service_role` sem acesso às tabelas; objetos novos em `public` sem privilégios padrão para os papéis da API).

## Sincronização com ambiente remoto

**Status em 2026-10-31: CONCLUÍDA.**
- Schema aplicado e validado: o remoto está idêntico ao local.
- OWNER criado e auditado.
- Cadastro público desativado.
- Login, sessão, `/admin` e Sair validados no remoto.
- Ficam recomendações de segurança para decisão do responsável (Pendências 1 a 4).

| Item | Situação |
|---|---|
| Commit da Etapa 02 | ✅ `5959ccd` (sem `.env`, sem segredos, sem `assets-21/`) |
| Chave pública no `.env.local` | ✅ JWT `anon` de 3 segmentos |
| Token do CLI (`.env.supabase.local`) | ✅ Substituído por token com acesso total; validado sem exibição (projeto, pooler, Auth, migrations e Storage: 200) |
| `supabase link` | ✅ `landing-mocadoiphone`, ref `dels…psvl`, `sa-east-1`, Postgres 17.11 (igual ao local, 17), `ACTIVE_HEALTHY` |
| Conferência antes do push | ✅ 13 migrations pendentes, nenhuma aplicada. O banco estava vazio: 0 tabelas, 0 tipos, sem schema `app`, 0 buckets, 0 objetos, 0 usuários, sem histórico de migrations |
| `supabase db push` | ✅ 2026-10-31: 13 migrations aplicadas, sem seed. Depois, a migration 14 corrigiu a divergência de privilégios (abaixo) |
| Validação do schema remoto | ✅ `migration list` 14/14 · `db diff --linked` (`public`, `app`): "No schema changes found" · comparação do catálogo local × remoto: idêntico, exceto a função da plataforma (abaixo) |
| RLS e Storage (anônimo, HTTP) | ✅ Detalhes abaixo |
| Primeiro OWNER | ✅ 2026-10-31. O responsável criou o usuário no Dashboard (1 usuário, confirmado). O agente executou `app.bootstrap_first_owner` pelo CLI com o e-mail por subconsulta, sem digitá-lo nem exibi-lo. Resultado: 1 perfil `OWNER` ativo, vinculado ao usuário criado, com o nome de exibição padrão (parte do e-mail antes do @) |
| Auditoria do bootstrap | ✅ 1 registro: `admin_profiles` · `INSERT` · `source=bootstrap` · valor novo com `role=OWNER`. O autor fica nulo porque o bootstrap roda como `postgres`, sem sessão. A origem da auditoria foi restaurada depois |
| Cadastro público desativado | ✅ Management API: só `disable_signup=true` (status 200). O endpoint público do Auth mostra `disable_signup: true`, login por e-mail ativo, sem login anônimo nem por telefone |
| Rotas sem sessão (build de produção, `.env.local` → remoto) | ✅ `/admin` → 307 para `/admin/login` · cookie forjado → 307 · `/admin/login` 200 com `noindex` |
| Login, sessão e `/admin` no remoto | ✅ O responsável entrou no navegador. O painel exibiu "Painel administrativo", o usuário autenticado e "Proprietário (OWNER)". O perfil é lido com a sessão do próprio usuário, então a RLS autenticada foi validada no remoto. O banco registra a sessão criada no login, sem dados pessoais (só contagens e horários) |
| Sair no remoto | ✅ A sessão do primeiro login (13:19, horário de Brasília) foi removida de `auth.sessions`, o que só acontece com o encerramento da sessão. O login seguinte (13:51) criou uma sessão nova |
| Bloqueio de usuário sem perfil | ✅ Local (HTTP e integração). No remoto, o primeiro login (13:19) aconteceu antes do bootstrap (13:23), quando a conta ainda não tinha perfil. A tela exibida nesse momento não foi confirmada pelo responsável |
| Botão "Sair" | ✅ Validado ponta a ponta no ambiente local (abaixo) e no remoto |
| Validação final | ✅ `npm run check` (lint, typecheck, 23 testes, formatação) · `npm run build` com o `.env.local` remoto · nenhum token ou chave secreta no `.next` · pgTAP 209/209 e integração 9/9 só no local. Nenhum teste destrutivo rodou no remoto |

### Validação do schema remoto

A validação não se apoiou só no sucesso do comando. Uma consulta somente leitura gerou uma "impressão digital" do catálogo, executada no local e no remoto e comparada linha a linha (486 itens). Ela cobre:
- schemas e seus privilégios;
- tabelas, RLS e owner;
- colunas, tipos, defaults e colunas geradas;
- enums;
- constraints;
- índices;
- policies, inclusive as de `storage.objects`;
- funções (assinatura, `SECURITY DEFINER`, `search_path`, owner e hash do corpo) e `EXECUTE` por papel;
- triggers;
- grants por tabela e por coluna;
- privilégios padrão;
- o bucket `media`.

Resultado: 12 tabelas com RLS, 42 policies (4 no Storage), 36 triggers, 39 índices, 115 constraints, 21 funções em `app`, 7 enums e o bucket `media` (público, 50 MB, jpeg/png/webp/avif/mp4). Tudo é igual ao local.

**Única diferença restante (da plataforma, aceita):** a função `public.rls_auto_enable()` e o event trigger `ensure_rls`.
- Eles vêm do recurso do Supabase que ativa a RLS automaticamente em tabelas novas de `public`.
- Não vêm das migrations e não existem no local.
- São compatíveis com o projeto, porque todas as tabelas já ativam RLS explicitamente.
- Não foram alterados.

**Aviso não bloqueante do CLI:** depois do primeiro push, o CLI 2.109 emitiu "failed to cache migrations catalog" (`pg-delta`, certificado ausente em `supabase/.temp`). É um cache local do CLI, emitido depois da última migration, e não afeta o banco.

### Divergência encontrada e corrigida (MDI-D019)

1. **Parada:** a primeira comparação mostrou que, no remoto, o `service_role` tinha `SELECT/INSERT/UPDATE/DELETE` nas 12 tabelas. A sequence `audit_logs_id_seq` também tinha `SELECT/USAGE` a mais para `anon`, `authenticated` e `service_role`.
2. **Causa:** os privilégios padrão do schema `public` são diferentes nos dois ambientes.
   - O remoto usa o padrão clássico: `ALL` em tabelas novas para os três papéis.
   - O CLI local usa o padrão novo, sem DML.
   - As migrations já zeravam `anon` e `authenticated`, mas não o `service_role` nem a sequence.
3. **Registro:** decisão MDI-D019.
4. **Migration:** `20261031104058_explicit_privileges.sql`. Ela revoga o `service_role` das tabelas, fecha a sequence e zera os privilégios padrão de `public` para os papéis da API.
5. **Teste local:**
   - suíte nova `07_privileges` (40 testes), que antes da migration falhou nos 16 pontos esperados;
   - `db:reset` + `db:test` com 209/209;
   - `db:lint` limpo;
   - integração 9/9;
   - tipos sem mudança.
6. **Reaplicação:** `db push` só da migration 14. A comparação seguinte saiu idêntica.

Nada foi alterado pelo Dashboard.

### RLS e Storage no remoto (sondagens HTTP anônimas com a chave pública)

Nenhum dado foi gravado. As tentativas de escrita usaram conteúdo que também violaria constraints.

| Sondagem | Resultado |
|---|---|
| Leitura das 10 tabelas públicas | ✅ 200, listas vazias (banco sem conteúdo) |
| `admin_profiles`, `audit_logs` | ✅ 401 / `42501` (sem privilégio) |
| `POST` em `categories`, `products`, `site_settings`, `admin_profiles`; `PATCH` em `categories`; `DELETE` em `products` | ✅ 401 / `42501` |
| RPC `bootstrap_first_owner`, `has_role` | ✅ 404: o schema `app` não é exposto pela API |
| Metadados do bucket `media` | ✅ Ocultos para o anônimo |
| Listagem de objetos | ✅ Vazia |
| Upload anônimo (pasta proibida e `products/`) | ✅ 403, "new row violates row-level security policy" |
| Auth | ✅ Login por e-mail ativo. Cadastro desligado depois do OWNER |
| Repetição após o OWNER | ✅ `admin_profiles` e `audit_logs` continuam 42501. `PATCH`/`POST` anônimo em `admin_profiles` dá 42501 |

### Segundo incidente com a chave

- Depois da troca, `NEXT_PUBLIC_SUPABASE_ANON_KEY` passou a ter **5 segmentos**:
  - a chave `anon` completa;
  - seguida de `.payload.assinatura` da `service_role` antiga.
- **Por que é grave:** o cabeçalho de um JWT é padrão, então a chave secreta pode ser reconstruída a partir desse valor. Por isso ele também é inválido, e o remoto responde 401.
- **Resposta:** a trava de `env.ts` virou lista de permitidos e passou a examinar todos os segmentos. Agora ela bloqueia esse caso, com teste dedicado.
- **Exposição:** nenhuma. O valor está só no arquivo local, ignorado pelo git, e não aparece em builds nem no commit.

### Botão "Sair" validado localmente (HTTP, Server Action real)

1. `/admin` autenticado como OWNER do seed → 200, painel exibido.
2. A página contém o formulário Sair com a Server Action.
3. POST do formulário → 303 para `/admin/login` e o cookie de sessão é apagado.
4. `/admin` em seguida → 307 para `/admin/login`.
5. Reusar o refresh token antigo falha com `refresh_token_not_found`: a sessão é revogada no servidor.

O mesmo teste será repetido no remoto pelo responsável, no navegador.

### Próximos passos

Todos concluídos: usuário do OWNER, bootstrap, auditoria, cadastro desativado, login e Sair no remoto.

## Pendências

1. **E-mail do OWNER (segurança, recomendado antes da Etapa 04):** o OWNER usa um endereço genérico, de um domínio que não pertence à Moça do iPhone.
   - **Risco:** o Auth permite recuperação de senha e magic link para usuários existentes. Quem controlar a caixa desse domínio poderia receber o link e entrar como OWNER. O endereço também é fácil de adivinhar.
   - **Mitigação atual:** sem SMTP próprio, o serviço de e-mail padrão do Supabase só entrega para membros da equipe da organização.
   - **Quando o risco aparece:** assim que um SMTP próprio for configurado, o que será necessário para convites e recuperação de senha.
   - **Ação:** trocar para uma caixa real do responsável.
2. **Política de senha do Auth remoto:** está no padrão do Supabase (mínimo de 6, sem exigência de caracteres). No local é mínimo de 10, com maiúsculas, minúsculas e dígitos. Ajustar exige mudar a configuração do Auth; aguardando a decisão do responsável. Vale para senhas novas.
3. **Segurança:** o `.env.local` ainda contém um `SUPABASE_ACCESS_TOKEN`.
   - É **diferente** do token atual e **continua válido**: é o token limitado anterior, que não foi revogado.
   - Revogue-o no Dashboard (*Account → Access Tokens*) e remova a linha do `.env.local`. O Next carrega esse arquivo no servidor.
4. **Segurança:** o token de acesso total em `.env.supabase.local` dá controle sobre a conta Supabase. Revogue-o, ou deixe expirar, ao fechar a Etapa 02, e gere outro só quando houver nova migration.
5. **`collections`, `collection_products`, `product_sections`:** entram nas Etapas 04/05 (MDI-D018).
6. **Supabase CLI:** a versão instalada é a 2.109.1; há a 2.122.0 disponível. Atualizar quando conveniente.
7. **`assets-21/`** (`macbook.txt`, `modelo-tela.jpg`): fora do escopo, intocados e não versionados, conforme instrução.

## Riscos

- **Chave privilegiada em variável pública:** o `.env.local` já foi corrigido (JWT `anon` íntegro). A trava permanente em `env.ts` (lista de permitidos) continua impedindo `dev` e `build` se o erro se repetir. Além disso, desde a MDI-D019 a `service_role` não tem acesso às tabelas do projeto.
- **Configurações do Auth remoto ficam fora das migrations:** o `supabase/config.toml` vale só para o local. No remoto, o cadastro foi desativado pela Management API em 2026-10-31.
  - Não usar `supabase config push`: ele enviaria também o `site_url` local.
  - Qualquer mudança futura no Auth remoto deve ser feita campo a campo e registrada aqui.
- **Login com limite só do Supabase:** não há rate limiting próprio nem CAPTCHA. Avaliar na Etapa 09.
- **Mídia não publicada acessível por URL exata** (bucket público com caminhos UUID). Aceito na MDI-D018; reavaliar se surgir conteúdo sigiloso (ex.: lançamento sob embargo).
- **Ambiente local × remoto:** os dois usam Postgres 17. Os privilégios padrão diferiam e foram igualados pela MDI-D019. A função da plataforma `rls_auto_enable` existe só no remoto. Depois de cada `db push`, repetir a comparação do catálogo (`docs/CONVENCOES.md`).
