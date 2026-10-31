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
| Reset completo do zero (13 migrations + seed) | ✅ |
| `supabase db lint` | ✅ Nenhum erro de schema |
| pgTAP (`npm run db:test`) | ✅ 169 testes em 6 suítes: constraints (32), acesso público (44), papéis (40), regras do catálogo (22), auditoria (17), Storage (14) |
| Teste de mutação | ✅ Leitura pública de produtos liberada e `DELETE` concedido de propósito → 6 testes falharam nos pontos certos; banco recriado depois |
| Integração com a API real (`npm run test:integration`) | ✅ 9 testes: anônimo, cadastro bloqueado (`signup_disabled`), senha errada, OWNER, usuário sem perfil, auditoria com autor |
| Fluxo de UI por HTTP com cookie de sessão real | ✅ Sem sessão → 307 para o login · OWNER → painel com e-mail e "Proprietário (OWNER)" · sem perfil → "Acesso não autorizado" · OWNER no login → 307 para `/admin` · cookie forjado → 307 para o login |
| `npm run test` (unit + componentes) | ✅ 20 testes (env, trava de chave secreta, login, formulário) |
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

## Pendências

1. **Bloqueante para usar o projeto remoto:** trocar `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local` pela chave anon/publishable. Até lá, o app recusa iniciar com esse arquivo.
2. **Aplicar as migrations no projeto remoto** (`supabase link` + `supabase db push`). Não foi feito porque altera o banco remoto e depende da sua confirmação. Depois: criar o primeiro OWNER (passos acima) e ajustar o Auth no Dashboard (cadastro desativado, política de senha).
3. **Validar o botão "Sair" no navegador:** a extensão do Chrome não estava conectada. O botão está no HTML e a action segue o padrão oficial, mas não foi acionado ponta a ponta.
4. **`collections`, `collection_products`, `product_sections`:** entram nas Etapas 04/05 (MDI-D018).
5. **Supabase CLI:** a versão instalada é a 2.109.1; há a 2.122.0 disponível. Atualizar quando conveniente.
6. **`assets-21/macbook.txt`:** fora do escopo, intocado e não versionado, conforme instrução.

## Riscos

- **Chave `service_role` no `.env.local`:** se for para um deploy com o prefixo `NEXT_PUBLIC_`, o banco fica exposto. Mitigado pela trava em `env.ts`, que impede o build. Corrigir o arquivo é necessário (Pendência 1).
- **Configurações do Auth remoto ficam fora das migrations:** se o cadastro público não for desativado no Dashboard, qualquer pessoa cria uma conta. Ela não administra nada (sem perfil, RLS), mas é ruído e superfície desnecessária.
- **Login com limite só do Supabase:** não há rate limiting próprio nem CAPTCHA. Avaliar na Etapa 09.
- **Mídia não publicada acessível por URL exata** (bucket público com caminhos UUID). Aceito na MDI-D018; reavaliar se surgir conteúdo sigiloso (ex.: lançamento sob embargo).
- **Ambiente local × remoto:** o Postgres local é a versão 17. Confirmar a versão do projeto remoto antes do `db push`.
