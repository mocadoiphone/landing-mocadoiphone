# ETAPA 03 — Catálogo

> Data: 2026-10-31 · Papéis: `engenheiro-software.md` (plano), `modelagem-dados.md`, `desenvolvedor.md`, `seguranca.md`, `qa.md` · Plano aprovado pelo responsável antes da implementação.

## Objetivo

Construir o núcleo funcional do catálogo, para que o painel da Etapa 04 só precise de telas:
- **domínio:** categorias, famílias, produtos, variantes, preços, disponibilidade, mídias, especificações, publicação e ordenação;
- **leitura:** consultas públicas;
- **qualidade:** regras de negócio e testes.

**Fora do escopo:** painel administrativo completo, Home final, motion/GSAP, migração do Wix, SEO final, deploy final.

**Escolhas do responsável nesta etapa:**
- páginas **técnicas mínimas** de categoria e produto;
- mídia só com regras e vínculos (o **envio de arquivo fica para a Etapa 04**);
- a regra do **WhatsApp entra agora**.

## Revisão antes de codificar

O Brain, as decisões MDI-D001 a D019 e o schema foram revisados.

**Não houve conflito entre o Brain e o schema.** Os desvios do §21 já tinham decisão:
- mídia por FK (D007);
- `installment_text` e `price_on_request` na variante (D005);
- status unificado (D006).

**Quatro lacunas entre decisões e o banco.** Foram registradas no plano **antes** de qualquer alteração e corrigidas depois da aprovação:

| # | Lacuna | Correção |
|---|---|---|
| L1 | A D005 pede "exatamente uma variante padrão"; o banco só garantia "no máximo uma", e a troca não era atômica | Primeira variante visível vira padrão; troca atômica por `public.set_default_variant` (MDI-D022) |
| L2 | Os pré-requisitos de publicação (D006) só eram checados ao publicar | Produto publicado não perde a última variante visível nem a imagem principal (MDI-D022) |
| L3 | Categoria ou família com produtos ativos podia ser excluída | Exclusão bloqueada; desativar continua permitido (MDI-D022) |
| L4 | A D018 dizia que funções de `app` nasciam sem `EXECUTE` para `PUBLIC`; 11 estavam abertas | Revogado e padrão global corrigido (MDI-D023) |

## Funcionalidades implementadas

### Regras puras (`src/lib`, sem I/O, com teste unitário)

| Módulo | O que faz |
|---|---|
| `pricing/` | Formata centavos ("R$ 8.999", "R$ 549,90"), monta a parcela ("ou 18x de R$ 549,90"), "Consulte valores", preço "de", "A partir de" e converte o valor digitado (`parseBRLToCents`) |
| `availability/` | Rótulos do §12; disponibilidade do produto derivada das variantes; visível × vendável |
| `slug/` | `slugify` (acentos, "&" → "e", hífens) e validação no formato do banco |
| `whatsapp/` | Mensagem por template (`{produto}`, `{variante}`, `{origem}`) e link `wa.me`. Sem contato padrão, não há link |
| `media/` | Pastas do §20, formatos e limites, slot × tipo, alt efetivo, URL pública do bucket |
| `catalog/variants` | Rótulos "256 GB / Preto" e "256 GB Preto"; ordem natural; variante padrão efetiva |
| `catalog/publication` | Lista de pendências para publicar, todas de uma vez |
| `catalog/ordering` | Valida a nova ordem e calcula 10, 20, 30… só para o que mudou |
| `catalog/schemas` | Zod de todos os inputs, espelhando as constraints do banco |
| `catalog/errors` | Erro do Postgres/PostgREST → mensagem em português ligada ao campo, sem detalhes internos |

### Consultas públicas (`src/services/catalog`)

- Usam o cliente **público sem cookies**: enxergam só o que a RLS libera para o anônimo.
- Funções:
  - `listPublicCategories`;
  - `getPublicCategoryPage` (produtos agrupados por família);
  - `getPublicProduct` (variantes, mídias por posição, especificações agrupadas, relacionado, WhatsApp por variante);
  - `listPublicShowcase` (lançamentos, promoções, destaques);
  - `getPublicWhatsAppConfig`.
- **Versões cacheadas** em `queries.ts`: `'use cache'` + `cacheLife("hours")` + `cacheTag("catalog" | "settings")` (MDI-D020).

### Escritas (núcleo + Server Actions, MDI-D024)

| Domínio | Operações |
|---|---|
| Categorias | criar (nasce inativa), editar (inclui ativar/desativar), excluir, restaurar, ordenar |
| Famílias | criar, editar, excluir, restaurar, ordenar dentro da categoria |
| Produtos | criar (sempre `DRAFT`), editar (dados, destaques, relacionado, SEO), mudar status (publicar confere pendências), excluir, restaurar, ordenar dentro da categoria |
| Variantes | criar (a primeira visível vira padrão), editar preço e disponibilidade, trocar a padrão (atômico), excluir, restaurar, ordenar |
| Especificações | criar, editar, excluir, ordenar |
| Mídia do produto | vincular (principal, galeria, mobile, vídeo; por produto ou variante), trocar arquivo/alt, desvincular, ordenar |
| Biblioteca de mídia | registrar metadados, editar alt, excluir (bloqueado se em uso), restaurar |

- **Fluxo de cada action:**
  1. sessão e papel (catálogo: OWNER/ADMIN/CATALOG_MANAGER; mídia: também CONTENT_EDITOR);
  2. Zod;
  3. escrita com a sessão do usuário (RLS + auditoria);
  4. `updateTag`;
  5. retorno só de ids, slugs e mensagens.
- **Sem telas nesta etapa:** o Next remove do bundle as actions não usadas, então nenhuma fica exposta antes do painel.

### Páginas técnicas (`src/app/(site)`, sem design final)

- **`/[categorySlug]`:** produtos publicados agrupados por família, estado vazio e links para as outras linhas.
- **`/produto/[slug]`:**
  - preço, disponibilidade, variantes com WhatsApp contextual;
  - galeria e vídeos, especificações, relacionado.
- **Estados:** carregamento (`<Suspense>`), erro (`error.tsx`), não encontrado em português (`not-found.tsx`), indisponível (rótulo do §12).
- `robots: noindex` até a Etapa 07. O layout não consulta dados (o build não depende do banco).

## Regras de negócio criadas

- **Preço (MDI-D021):**
  - inteiros sem centavos; parcela gerada ou texto livre;
  - "Consulte valores" sem preço ou quando marcado;
  - "A partir de" só com preços diferentes;
  - parcela e preço "de" vêm da variante mais barata.
- **Disponibilidade:**
  - a do produto é a melhor entre as variantes visíveis (AVAILABLE > PRE_ORDER > ON_REQUEST > OUT_OF_STOCK > DISCONTINUED);
  - `HIDDEN` nunca aparece ao público.
- **Variante padrão:** automática na primeira visível; troca atômica; oculta não pode ser padrão. Na exibição, se a padrão estiver oculta, vale a primeira visível.
- **Publicação:**
  - produto nasce rascunho;
  - publicar exige categoria ativa, família válida, variante visível e imagem principal (todas as pendências de uma vez);
  - depois de publicado, não perde variante visível nem imagem principal.
- **Exclusão:** categoria e família só sem filhos ativos; mídia só sem uso; tudo reversível (soft delete).
- **Ordenação:** lista completa do escopo; grava só o que mudou.
- **WhatsApp:** contato padrão + template do painel; reproduz o exemplo do §13.

## Banco de dados

**Migration 15:** `supabase/migrations/20261031171835_catalog_invariants.sql`

| Objeto | Função |
|---|---|
| `app.ensure_default_variant` (trigger) | Primeira variante visível vira padrão |
| `public.set_default_variant(uuid)` | Troca atômica, `SECURITY INVOKER`, `EXECUTE` só para `authenticated` |
| `app.guard_published_variant` (trigger) | Bloqueia ocultar/excluir a última variante visível de produto publicado |
| `app.guard_published_main_image` (trigger) | Bloqueia remover/mover a imagem principal de produto publicado |
| `app.check_product_media_kind` (substituída) | Também recusa vincular mídia excluída |
| `app.guard_category_soft_delete`, `app.guard_family_soft_delete` | Bloqueiam exclusão com filhos ativos |
| Privilégios | `revoke execute ... from public` em `app` + padrão global do `postgres` |

**Reversão:** descrita no cabeçalho da migration.

**Tipos:** `src/types/database.ts` regenerado (a função nova entrou).

## Testes

| Camada | Resultado |
|---|---|
| pgTAP (`npm run db:test`) | ✅ **241** em 8 suítes. Novas: `08_catalog_invariants` (27); `07_privileges` passou de 40 para 45 (funções). As 209 anteriores continuaram verdes depois de revogar `EXECUTE` de `PUBLIC` |
| Unitários + componentes (`npm run test`) | ✅ **125** em 16 arquivos (antes 23). Inclui o exemplo exato do §11 e do §13 |
| Integração (`npm run test:integration`, Supabase LOCAL) | ✅ **30** (antes 9). Ver o detalhamento abaixo da tabela |
| Teste de mutação | ✅ Com a trava da última variante removida de propósito no banco local: 2 testes de integração e 2 pgTAP falharam nos pontos certos. Banco recriado depois |
| HTTP (build de produção apontando para o Supabase local) | ✅ Ver o detalhamento abaixo da tabela |
| Cache | ✅ Um `UPDATE` direto no banco (sem action) não aparece na página: a leitura vem do cache até a invalidação |
| `npm run build` | ✅ Cache Components ativo; páginas do catálogo em prerender parcial; painel dinâmico |
| `npm run lint` · `npm run typecheck` · `npm run format:check` · `db:lint` | ✅ |

**O que a integração cobre:**
- consultas públicas sobre o seed;
- ciclo completo pelo OWNER: categoria → família → produto → 2 variantes → padrão automática → publicar sem requisitos (pendências) → mídia principal + categoria ativa → publicar;
- leitura anônima com "A partir de R$ 8.999 / ou 18x de R$ 549,90";
- troca de padrão, preço "de", relacionado público × rascunho;
- bloqueios L2/L3 com mensagem e campo;
- ordenação, especificações, auditoria `PUBLISH`;
- conflitos traduzidos;
- recusas de usuário sem perfil e anônimo;
- roda repetidas vezes sem reset.

**O que o smoke HTTP mostrou:**
- `/iphone` lista só o publicado;
- produto com variante, "Consulte valores" e link `wa.me` com a mensagem do §13;
- categoria vazia mostra o estado vazio;
- rascunho e slug inexistente mostram "Página não encontrada" com `noindex`;
- `/admin` continua redirecionando para o login.

**Ajuste durante a etapa:** tentei fazer as páginas técnicas bloquearem no servidor para responder 404 real. Não muda nada, porque a casca do layout já sai com status 200. Voltei para `<Suspense>`, que ao menos dá estado de carregamento; o risco está registrado abaixo.

## Decisões

- **MDI-D020:** Cache Components + páginas técnicas.
- **MDI-D021:** regras de exibição de preço, disponibilidade, variante e WhatsApp.
- **MDI-D022:** invariantes do catálogo no banco (L1–L3).
- **MDI-D023:** funções sem `EXECUTE` para `PUBLIC` (L4, corrige a D018).
- **MDI-D024:** camada de serviços (núcleo com cliente injetado, actions finas, erros traduzidos, mídia sem upload).

## Pendências

1. **Envio de arquivo de mídia:** upload ao Storage com validação real do arquivo, leitura de dimensões e preview. Entra na Etapa 04, com a tela de mídia (escolha do responsável).
2. **Invalidação do cache ponta a ponta:** as actions chamam `updateTag`, mas só podem ser exercitadas pelo navegador quando o painel (Etapa 04) existir.
3. **Status 404 real e SEO das páginas** (`generateStaticParams`, metadata, canonical): Etapas 05/07.
4. **Catálogo real no remoto:** o remoto não tem categorias nem produtos. Entram pelo painel (Etapa 04) ou pela migração (Etapa 08), sem publicação automática (§35).
5. **Artigo da mensagem do WhatsApp:** o template padrão diz "o {produto}" ("o iPhone"). Para "a Apple Watch", o texto é ajustável no template do painel; não há regra de gênero no código.
6. **Herdadas da Etapa 02:** e-mail do OWNER, política de senha remota, revogação de tokens.
7. **Origem da execução manual das 15:43** (seção "Sincronização com ambiente remoto"): verificar o histórico do SQL Editor, os membros do projeto e os tokens da conta.

## Riscos

- **Status HTTP com streaming:** produto não publicado ou inexistente mostra "não encontrado" com status 200 e `noindex` (MDI-D020). Sem impacto agora (as páginas são `noindex`); precisa de solução antes do SEO.
- **Reordenação não atômica:** as gravações são sequenciais; uma falha deixa a ordem parcial, sem perda de dados.
- **Troca de slug de produto publicado quebra a URL antiga:** redirects nas Etapas 07/08.
- **Cache em memória por instância:** em ambiente serverless, cada instância tem o seu. A estratégia de cache distribuído fica para a Etapa 10, junto com o deploy.
- **Alteração do remoto fora do fluxo de migrations:** já aconteceu uma vez, com origem desconhecida. Mitigações:
  - migrations novas idempotentes sempre que possível (`docs/CONVENCOES.md`);
  - comparação do catálogo depois de cada push;
  - revisão de acessos e tokens (Pendência 7).
- **Duplicação controlada de regras** (pendências de publicação, limites de campo): existem no banco (garantia) e em `src/lib` (mensagem). Os testes de integração verificam os dois lados juntos.

## Sincronização com ambiente remoto

**Status em 2026-10-31: CONCLUÍDA.**
- Migration 15 aplicada pelo CLI e registrada.
- Remoto idêntico ao local.
- Houve uma **execução manual de origem desconhecida**, detalhada abaixo.

| Item | Resultado |
|---|---|
| Conferência antes do push | ✅ `landing-mocadoiphone` (ref `dels…psvl`), produção, `sa-east-1`, Postgres 17.11; 1 migration pendente (`20261031171835_catalog_invariants`); dry-run listando só ela; sem alteração de dados |
| 1º `db push` (autorizado) | ❌ Falhou na 1ª instrução: `function "ensure_default_variant" already exists`. Nada foi aplicado; a transação foi desfeita |
| Diagnóstico (somente leitura) | O SQL da migration 15 **já tinha sido executado no remoto às 15:43:28 (Brasília), fora do CLI**, sem registro no histórico. Ver a subseção abaixo |
| Correção | Migration 15 tornada idempotente (`create or replace` em funções e triggers, mesma lógica), commit `2bea831` |
| Teste local da correção | ✅ Do zero: pgTAP 241/241. Reaplicada por cima dos objetos existentes (simulando o remoto): sem erro, pgTAP 241/241, integração 30/30 |
| 2º `db push` | ✅ Dry-run + push pelo CLI: "Applying migration 20261031171835… Finished" |
| Migrations | ✅ **15/15** sincronizadas |
| `db diff --linked` (`public`, `app`) | ✅ "No schema changes found" |
| Comparação de schema local × remoto | ✅ 503 itens idênticos. Única diferença: `public.rls_auto_enable`, da plataforma (aceita na Etapa 02) |
| Funções e permissões da migration 15 | ✅ 0 funções de `app` com `EXECUTE` para `PUBLIC`; `set_default_variant` executável só por `authenticated`; 5 triggers novos; mídia excluída bloqueada; nenhum corpo de função com CRLF |
| Testes anônimos (sem escrita efetiva) | ✅ Ver a tabela abaixo |

**Testes anônimos (nenhum dado foi gravado):**

| Sondagem | Resultado |
|---|---|
| Leitura das 10 tabelas públicas | 200, listas vazias (sem catálogo no remoto) |
| `admin_profiles`, `audit_logs` | 42501 |
| Escrita em `categories`, `product_variants`, `products`, `product_media` | 42501 |
| RPC `set_default_variant` | 42501 "permission denied" |
| Funções internas (`ensure_default_variant`, `bootstrap_first_owner`, `refresh_product_price_from`) | 404, não expostas |
| Storage | Bucket oculto, listagem vazia, upload anônimo 403 pela RLS |
| Auth | Login por e-mail ativo; cadastro desligado; sem login anônimo |

### Execução manual de origem desconhecida (registrada)

- **O que aconteceu:**
  - Às **15:43:28 de 2026-10-31 (Brasília)**, o SQL da migration 15 foi executado no banco remoto como `postgres`, **fora do Supabase CLI**, e o histórico de migrations não registrou a versão.
  - O push do agente antes disso estava bloqueado pela proteção da sessão e não rodou: não há registro dele no banco.
  - O responsável não soube identificar a origem.
- **Evidências (somente leitura):**
  - O `pg_stat_statements` mostra as instruções da migration 15 executadas uma vez, nesse horário, e a inserção no histórico com 14 execuções em vez de 15.
  - Os corpos das 7 funções tinham quebras CRLF, que o CLI não produz (os mesmos objetos aplicados pelo CLI saem com LF). Isso é compatível com texto colado, por exemplo no SQL Editor do Dashboard.
  - A lógica, a segurança, os triggers e as permissões eram idênticos ao repositório.
  - A consulta aos logs do projeto pela Management API não retornou eventos para o período, então não foi possível identificar a origem por esse caminho.
- **Correção:** foi feita pelo fluxo normal, sem SQL manual. A migration ficou idempotente, foi testada no local e reaplicada pelo CLI, o que regularizou o histórico e o texto das funções.
- **Recomendação ao responsável:**
  - revisar no Dashboard o histórico do SQL Editor e os membros com acesso ao projeto;
  - revisar os tokens de acesso da conta, revogando os que não estiverem em uso. Já constam como pendentes desde a Etapa 02: o token antigo do `.env.local` e o token de acesso total.

**Servidor de desenvolvimento:** o `next dev` deste projeto já estava rodando na porta 3000, iniciado às 15:34, depois da mudança do `next.config.ts` (14:38). Portanto já usa a configuração nova (Cache Components) e não precisou ser reiniciado. O da porta 3001 não existia mais.
