# ETAPA 04 — Painel Administrativo

> Data: 2026-11-01 · Papéis: `engenheiro-software.md` (plano), `ui-ux-motion.md` (interface do painel), `desenvolvedor.md`, `modelagem-dados.md`, `seguranca.md`, `qa.md` · Plano aprovado pelo responsável, com as decisões MDI-D025 a D029 validadas antes da implementação · **Etapa aprovada e encerrada pelo responsável em 2026-11-01, após a sincronização remota.**

## Objetivo

Dar ao catálogo uma interface para uma pessoa sem conhecimento técnico (Brain §15) e fechar os critérios de admin do §38:
- cadastrar produto, alterar preço e disponibilidade, publicar e despublicar, enviar imagens;
- as alterações aparecem no site sem mudança de código.

**Prioridade funcional pedida:** produtos, variantes, preços, disponibilidade, mídia, publicação, categorias e famílias. Contatos, configurações e usuários também foram entregues; não houve redução para uma Etapa 04b.

**Fora do escopo** (não iniciado): Home final, storytelling, GSAP, migração do Wix, conteúdo editorial avançado e SEO público final.

**Escolhas do responsável:**
- usuários sem chave secreta;
- blocos editoriais na Etapa 05;
- Playwright agora, só no ambiente local;
- componentes próprios com HTML nativo.

## O que foi entregue

### Telas (`/admin`, rotas do Brain §6)

| Tela | O que faz |
|---|---|
| **Dashboard** | Publicados, em preparação, **indisponíveis** (publicados sem como comprar), **sem preço** ("Consulte valores"), lançamentos e promoções. Cada cartão abre a lista já filtrada. **Alterações recentes** da auditoria (só OWNER/ADMIN, como na RLS) |
| **Produtos** | Tabela do §16 (produto, categoria, preço "a partir de", disponibilidade derivada, destaques, status, ações). Filtros na URL (categoria, status, disponibilidade, lançamento, destaque, promoção, sem preço), busca sem acento, paginação de 50, lixeira com Restaurar |
| **Novo produto** | Nome, slug opcional, categoria → família dependente, resumo. Nasce **rascunho** e abre na aba Comercial |
| **Editor de produto** | Seis abas por URL (§17), painel de publicação e pré-visualização. Detalhes abaixo da tabela |
| **Categorias e famílias** | Ordem ↑↓, ativar/desativar, editar (com imagem), excluir/restaurar. A mensagem do banco aparece quando há filhos ativos |
| **Mídia** | Envio verificado com escolha de pasta, grade com filtros (tipo, em uso/sem uso, excluídas). Detalhe com alt editável, dimensões, tamanho e "onde é usada". Excluir só sem uso; restaurar |
| **Contatos** | WhatsApp e telefone digitados livremente e gravados com DDI; contato **padrão** (troca atômica); ordem; foto; excluir/restaurar |
| **Configurações** | Template do WhatsApp com pré-visualização ao vivo (reproduz o exemplo do §13); origem do lead; "Permitir envio de vídeo MP4" (§20) |
| **Usuários** | Lista com e-mail e último acesso (OWNER/ADMIN). O OWNER concede acesso a um login já criado no Dashboard, troca papel e desativa, com confirmação |

**Abas do editor de produto:**
- **Geral:** nome, slug, categoria/família, resumo, descrição, selo, relacionado.
- **Comercial:** destaques; preço, parcelas, valor da parcela, texto de parcelamento, "Consulte valores" e disponibilidade da variante única, com **prévia ao vivo** enquanto digita.
- **Variantes:** tabela, padrão, ordem, criar/editar com prévia, excluir/restaurar.
- **Mídia:** principal e mobile (trocar sem remover), galeria e vídeo com ordem, imagens por variante, alt próprio, escolher da biblioteca ou enviar ali mesmo.
- **Conteúdo:** especificações. Os blocos editoriais entram na Etapa 05.
- **SEO:** meta title/description com contador, imagem OG, canonical.

**Estados em todas as telas:**
- carregando, vazio, erro sem detalhes internos, sucesso (`role="status"`);
- sem permissão; sessão expirada, com link para entrar;
- "não publicado" e "indisponível" como selos;
- confirmação em excluir, despublicar e trocar papel.

### Publicação e pré-visualização (pontos 5 e 6 do pedido)

- **Pendências antes do clique:** o painel de publicação lista **antes** o que falta, cada item com link para a aba que resolve:
  - categoria ativa;
  - família válida;
  - variante visível;
  - imagem principal.

  **Publicar fica desabilitado** enquanto houver pendência, e as abas com problema ganham um selo "!". O usuário não descobre a regra por um erro do banco, que continua garantindo a mesma regra.
- **Pré-visualização lateral**, com as mesmas funções do site (MDI-D021):
  - card do produto (imagem, preço "a partir de", parcelamento, disponibilidade derivada);
  - **seletor de variante** (preço, parcela e disponibilidade daquela variante; aviso se estiver oculta);
  - estado de publicação.

### Segurança (ponto 2 do pedido)

- **Autorização no servidor em três camadas:**
  1. cada página chama `requireAdminPage(área)`;
  2. cada Server Action passa por `runCatalogAction` (sessão + papel + Zod);
  3. a RLS do banco.
- **Menu por papel é só UX:** o E2E confirma que o editor de conteúdo é barrado em `/admin/produtos` e `/admin/usuarios` pela URL.
- **Nenhuma chave privilegiada no projeto:** sem `service_role`. A gestão de usuários usa funções do banco com checagem de papel (MDI-D027). O build não contém token nem chave secreta.
- **Nenhuma operação depende só do cliente:** as checagens no navegador (formato, tamanho, campos) só orientam; o servidor revalida tudo.
- **E-mails de administradores:** visíveis só para OWNER e ADMIN.

### Mídia (ponto 3 do pedido, MDI-D026)

- **Fluxo:** preparar no servidor → enviar **direto ao Storage pela URL temporária** → o servidor confere o arquivo real e só então registra.
  - Confere existência, tamanho, tipo, extensão e **assinatura dos primeiros bytes** (JPEG, PNG, WEBP, AVIF, MP4).
  - Se a conferência ou o registro falham, **apaga o arquivo enviado**.
- **Removido:** o `registerMediaAssetAction` da Etapa 03, que registrava caminho sem conferir arquivo.
- **Não implementado (pedido do responsável):** limpeza automática de órfãos. É pendência registrada para a Etapa 09.

### Cache (ponto 7 do pedido)

Validado ponta a ponta no navegador (Playwright, banco local): alteração no painel → gravação no banco (`price_from` recalculado) → `updateTag('catalog')` na action → a página pública mostra o novo preço na visita seguinte, sem deploy.

A Etapa 03 já havia provado que a página vem do cache: um `UPDATE` direto no banco, sem action, não aparece. Isso fecha a pendência de cache da Etapa 03.

## Banco de dados

**Migration 16:** `supabase/migrations/20261101001906_admin_panel.sql` (MDI-D027).
- Três funções novas, todas com `EXECUTE` só para `authenticated`:

| Função | Tipo | Regra |
|---|---|---|
| `public.list_admin_users()` | `SECURITY DEFINER` | Só OWNER/ADMIN. Perfis + e-mail + último acesso |
| `public.grant_admin_profile(email, nome, papel)` | `SECURITY DEFINER` | Só OWNER. Login existente e confirmado; não duplica; auditado com autor |
| `public.set_default_contact(uuid)` | `SECURITY INVOKER` | Troca atômica do contato padrão; RLS de OWNER/ADMIN |

- Usam `create function` sem `or replace`, de propósito: se já existirem no remoto, é drift e o push falha (regras de banco da Etapa 03).
- **Seed local:** ganhou `conteudo@local.test` (CONTENT_EDITOR) para os testes de papel.

## Testes

| Camada | Resultado |
|---|---|
| pgTAP (`npm run db:test`) | ✅ **270** em 9 suítes (antes 241). Nova `09_admin_panel` (20); `07_privileges` ampliado com as três funções |
| Unitários + componentes (`npm run test`) | ✅ **169** em 24 arquivos (antes 125). Ver o detalhamento abaixo da tabela |
| Integração (Supabase LOCAL) | ✅ **44** em 3 arquivos (antes 30). Ver o detalhamento abaixo da tabela |
| **E2E Playwright (local)** | ✅ **5**. Ver o detalhamento abaixo da tabela |
| `npm run check` · `npm run build` · `db:lint` | ✅ |

**Unitários e componentes cobrem:**
- adaptadores de formulário, métricas e filtros do painel, assinatura de arquivo, telefone, permissões por área;
- campos acessíveis, diálogo de confirmação, abas, ordenação;
- painel de publicação (pendências e Publicar desabilitado), pré-visualização (variante selecionada e oculta), preço ao vivo, prévia do WhatsApp.

**Integração cobre:**
- leituras do painel;
- contatos: padrão atômico, contato padrão protegido, reordenação;
- template refletido na configuração pública;
- usuários: login inexistente, perfil duplicado, trava do próprio papel;
- **envio real ao Storage local:** preparar → enviar → conferir → registrar;
- **arquivo falso recusado e apagado**;
- tamanho, vídeo desativado e usuário sem perfil recusados.

**E2E cobre:**
- **fluxo completo do OWNER:** login → categoria e família → produto → variante com preço e parcelamento → envio de imagem → publicar (com pendências antes) → página pública → editar preço e ver no site → despublicar → Sair;
- editor de conteúdo só em Mídia e barrado pela URL;
- conta sem perfil;
- sem sessão;
- **celular** (viewport Pixel 7).

**Problemas encontrados e corrigidos durante a etapa:**
- **Storage local incompatível (só ambiente local):** depois do `supabase link` (Etapa 02), o banco local passou ao nível de migrations do Storage do remoto (v1.80.2), mas o container local continuava na v1.62.5. Todo upload falhava com `42P10` (`ON CONFLICT` sem índice único). A stack local foi reiniciada para subir o Storage na mesma versão do remoto. Nada mudou no projeto nem no remoto.
- **Aviso de `Date.now()` na pré-busca:** o Partial Prefetching renderizava a casca das rotas do painel, e o supabase-js lê o relógio ao carregar a sessão. Corrigido com `connection()` no cliente com sessão (MDI-D025).
- **Envio travado em "Conferindo o arquivo…" (achado pelo E2E):** dentro do Next, cancelar a leitura do corpo do `fetch` ficava esperando a cópia interna da resposta. A leitura passou a consumir a resposta de 32 bytes inteira. A tela também passou a tratar exceções, para nunca ficar presa.

## Decisões

- **MDI-D025:** estrutura do painel (rotas, permissões por área, abas por URL, formulários, componentes nativos, `refresh()`, `connection()`).
- **MDI-D026:** envio de mídia verificado em três passos; órfãos para a Etapa 09.
- **MDI-D027:** administradores sem `service_role`; contato padrão atômico (migration 16).
- **MDI-D028:** blocos editoriais do produto na Etapa 05 (ajusta a D018).
- **MDI-D029:** Playwright antecipado, só local (ajusta a D014).

## Pendências

1. ~~Aplicar a migration 16 no remoto~~: concluído em 2026-11-01 (seção abaixo).
2. **Limpeza de arquivos órfãos no Storage:** envio abandonado entre o envio e a conferência. Etapa 09.
3. **Blocos editoriais do produto, Home, banners, coleções e configurações de loja/rodapé:** Etapa 05.
4. **SMTP próprio:** sem ele, não há recuperação de senha por e-mail para outros administradores. O OWNER redefine pelo Dashboard. Ligado ao e-mail genérico do OWNER (Etapa 02).
5. **Herdadas:**
   - status 404 real e SEO (Etapas 05/07);
   - política de senha do Auth remoto;
   - revogação de tokens;
   - atualização do Supabase CLI (2.109 → 2.122).

## Riscos

- **O `npm run dev` usa o `.env.local`, que aponta para produção:** o que for cadastrado no painel local vai para o banco real. É o objetivo (catálogo real); os testes automatizados usam sempre o banco local.
- **Dimensões das imagens informadas pelo navegador:** baixo risco; afetam só o layout.
- **Lista de produtos carregada inteira e filtrada no servidor:** adequado para centenas de itens. Com milhares, mover filtros para a consulta.
- **Reordenação não atômica** (herdado da Etapa 03).

## Sincronização com ambiente remoto

**Status em 2026-11-01: CONCLUÍDA.**
- A migration 16 foi aplicada pelo CLI depois da autorização explícita do responsável.
- Remoto idêntico ao local.
- Nenhuma execução manual.

| Item | Resultado |
|---|---|
| Conferência antes do push (somente leitura) | ✅ `landing-mocadoiphone` (ref `dels…psvl`), produção, `sa-east-1`, Postgres 17.11; 15 aplicadas, 1 pendente; **sem drift**: comparação de catálogo igual ao estado das 15 migrations e nenhuma das funções novas existia no remoto; dry-run listando só a migration 16 |
| `db push` | ✅ "Applying migration 20261101001906_admin_panel.sql… Finished" |
| Migrations | ✅ **16/16** sincronizadas |
| `db diff --linked` (`public`, `app`) | ✅ "No schema changes found" |
| Comparação de schema local × remoto | ✅ 509 itens idênticos, inclusive o corpo das três funções novas. Única diferença: `public.rls_auto_enable`, da plataforma (aceita na Etapa 02) |
| RLS e Storage | ✅ Inalterados: 38 policies em `public`, 4 no Storage, bucket `media`, 12 tabelas, todos iguais ao local |
| Definição das funções | ✅ `list_admin_users` e `grant_admin_profile`: `SECURITY DEFINER`; `set_default_contact`: `SECURITY INVOKER`; as três com `search_path=""` e `EXECUTE` só para `authenticated` (e o dono `postgres`) |
| Anônimo pela API | ✅ As três RPCs devolvem 401 / `42501` "permission denied for function" |
| Papéis (simulados no remoto, em transação com `rollback`, sem gravar nada) | ✅ Ver a tabela abaixo |
| Estado do remoto depois das checagens | ✅ Preservado: 1 perfil, 0 contatos, 1 registro de auditoria (os mesmos de antes) |

**Papéis simulados no remoto:**

| Papel | `list_admin_users` | `grant_admin_profile` | `set_default_contact` |
|---|---|---|---|
| Autenticado sem perfil | 42501 "Sem permissão para listar administradores." | 42501 "Só o proprietário (OWNER)…" | P0001 (não enxerga contato para tornar padrão) |
| OWNER | 1 administrador listado | Passa da checagem de papel; P0001 "Não existe login…", para um e-mail inexistente de propósito (nada gravado) | P0001 para id inexistente: o remoto não tem contatos |

**Limites da validação remota:**
- Não há administradores ADMIN, CATALOG_MANAGER ou CONTENT_EDITOR no remoto, nem contatos.
- O caso positivo de `set_default_contact` e os demais papéis exigiriam gravar dados de produção, então não foram feitos.
- Eles estão cobertos no local pela suíte `09_admin_panel` (20 testes) e pela integração. O corpo das funções no remoto é idêntico ao local (comparação de catálogo).
