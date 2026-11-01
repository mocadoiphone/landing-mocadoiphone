# ETAPA 05 — Front Público e Conteúdo Editorial

> Data: 2026-11-01 · Papéis: `engenheiro-software.md`, `ui-ux-motion.md`, `desenvolvedor.md`, `modelagem-dados.md`, `seguranca.md`, `qa.md` · Decisões novas: MDI-D030 a D035 · **Sem migration nova e sem push remoto.**

## Objetivo

Transformar as páginas técnicas da Etapa 03 no site público definitivo, administrável pelo painel:
- Home montada por blocos;
- páginas de categoria e de produto;
- WhatsApp com os dados reais do sistema;
- loja física e rodapé;
- celular tratado com composição própria.

**Fora do escopo (não iniciado):** storytelling complexo, timelines GSAP, pinning, parallax pesado, migração do Wix, SEO avançado, checkout e recursos de ecommerce não planejados.

## O que foi entregue

### Home administrável (Brain §7, §18, §19; MDI-D030)

Os 11 tipos de bloco do Brain §19 são suportados. Cada tipo tem um layout fixo do sistema; o administrador escolhe só conteúdo.

| Bloco | O admin escolhe | Composição no site |
|---|---|---|
| **Hero** | apoio, título, subtítulo, produto, imagem, vídeo, 2 botões | título grande centrado, produto abaixo; celular com botões na largura |
| **Produto em destaque** | produto (obrigatório), textos, imagem, posição, até 6 destaques, botão | imagem ampla + texto e destaques; no celular, imagem antes |
| **Grade de produtos** | origem (lançamentos, promoções, destaques, categoria), quantidade 3–12, botão | grade no desktop; carrossel com encaixe no celular |
| **Linhas Apple** | apoio, título, subtítulo | categorias ativas com imagem, 2 colunas no celular, 4 no desktop |
| **Mídia em tela cheia** | imagem ou vídeo, textos, produto, botão | mídia de borda a borda (4:5 no celular, 16:9 no desktop); texto fora da mídia |
| **Texto e imagem** | título, texto, imagem, posição, botão | duas colunas; imagem antes no celular |
| **Benefícios** | até 6 itens (título e descrição) | grade de 1, 2 ou 3 colunas |
| **Banner promocional** | textos, imagem, produto ou categoria, botão | cartão de campanha |
| **Loja física** | apoio, título, subtítulo | conteúdo de Configurações › Loja física |
| **Depoimentos** | até 6 (nome, depoimento, contexto) | cartões com citação |
| **Chamada para ação** | título, subtítulo, 2 botões | fechamento centrado |

**Regras comuns a todos os blocos:**
- **Tema:** claro ou escuro por bloco (`data-theme`, MDI-D013).
- **Botões:** o destino é escolhido numa lista (produto do bloco, categoria do bloco, WhatsApp, loja física, ofertas, lançamentos), nunca digitado.
- **Proteção do layout:** bloco sem o essencial não aparece (produto despublicado, categoria inativa, mídia excluída, loja sem endereço). Sem nenhum bloco válido ativo, a Home mostra a composição padrão: linhas Apple, lançamentos e loja.
- **Título principal:** se o primeiro bloco for um Hero, o título dele é o `h1` da página.

**Painel `/admin/home`** (OWNER, ADMIN e CONTENT_EDITOR, como a RLS):
- lista na ordem do site, com ↑↓;
- ativar e desativar;
- editar por tipo, com só os campos daquele tipo;
- excluir, com confirmação;
- aviso quando o produto ou a categoria vinculada não aparece no site;
- link para ver a Home.

Bloco novo nasce inativo.

### Configurações (MDI-D031)

- **Loja física:** nome, apresentação, endereço, bairro, cidade, CEP, horários (até 7), fotos da biblioteca (até 6, com ordem), link do mapa (só Google Maps, Apple Maps ou Waze, em `https://`) e texto do botão.
- **Rodapé:** apresentação, redes sociais (Instagram, Facebook, TikTok, YouTube, X; cada uma só aceita o próprio domínio), razão social, CNPJ, aviso legal e copyright.
- **WhatsApp:** nova "mensagem do atendimento geral" (cabeçalho, loja, rodapé), com pré-visualização ao vivo.

### Cabeçalho e rodapé

- **Cabeçalho:**
  - marca, as categorias ativas do painel, Ofertas e Lançamentos (só quando há produtos marcados) e o botão de contato;
  - navegação completa a partir de 1280 px; abaixo disso, botão **Menu** (`<dialog>` modal com foco preso, Esc e retorno do foco);
  - fixo no topo, com link "Pular para o conteúdo".
- **Rodapé** (tema escuro):
  - marca, apresentação e redes;
  - linhas Apple e navegação;
  - atendimento: WhatsApp e telefone do contato padrão, endereço e horários da loja;
  - dados legais e copyright.

### Páginas públicas

| Rota | Conteúdo |
|---|---|
| `/` | Home por blocos |
| `/[categoria]` | título, introdução, atalhos por família, produtos agrupados por família na ordem do painel, estado vazio com WhatsApp e loja, "Outras linhas" |
| `/produto/[slug]` | galeria (com imagem mobile própria), selo, preço e parcelamento, disponibilidade, seletor de **capacidade** e **cor**, WhatsApp da variante escolhida, descrição, especificações e "Veja também" (relacionado do painel + mesma família, só publicados) |
| `/ofertas`, `/lancamentos` | vitrines dos produtos marcados no painel, com estado vazio |
| `/loja` | loja física completa, ou estado "em breve" |
| 404 | página "não encontrada" com cabeçalho, rodapé e saídas |

**Cards de produto:**
- imagem como protagonista, selo, nome, resumo, preço e disponibilidade;
- o card inteiro é clicável, com um único alvo de foco;
- produto indisponível ou fora de linha aparece esmaecido e com o rótulo do Brain §12.

**Seletor de variante:**
- só escolhe **qual** variante mostrar. Preço, disponibilidade e link do WhatsApp chegam prontos por variante, calculados em `src/lib` (MDI-D021), então a regra não foi duplicada;
- combinação inexistente troca o outro atributo (ex.: Branco só existe em 256 GB);
- sem JavaScript, a variante padrão aparece completa.

**Celular:**
- galeria em carrossel;
- barra fixa com nome, preço e botão do WhatsApp;
- o rodapé ganha espaço para não ficar coberto pela barra.

### WhatsApp (ponto 8 do pedido)

| Item | Comportamento |
|---|---|
| **Contato** | o padrão do painel (MDI-D012) |
| **Produto e variante** | a mensagem do template cita o produto e a variante escolhida ("Produto 512 GB Preto") |
| **Template** | o do painel; vazio = texto do Brain §13 |
| **Origem** | o marcador `{origem}` aplicado |
| **Atendimento geral** | mensagem própria, com padrão se vazia |
| **URL final** | `https://wa.me/<dígitos>?text=…` |
| **Codificação** | acentos, `&` e emoji codificados (teste unitário) |
| **Fallback** | sem contato padrão, nenhum botão quebrado: o cabeçalho leva à loja física e a página de produto explica e oferece a loja |

**Correção feita:** salvar a origem do lead vazia invalidava a configuração pública inteira, e o template voltava ao padrão. A leitura passou a aceitar campo vazio (teste de integração novo).

### 404 real (ponto 15; MDI-D034)

- **Mudança:** produto e categoria viraram páginas estáticas (`ensureStatic = "navigation"` + `generateStaticParams`), com `notFound()` antes de qualquer streaming.
- **Resultado no build de produção:**

| Endereço | Status |
|---|---|
| produto inexistente | **404** |
| produto em rascunho | **404** |
| produto despublicado | **404** (depois de despublicar) |
| categoria inexistente | **404** |
| rota sem correspondência (`/a/b/c`) | **404** |
| páginas válidas | 200 |

- **Limitação:** se alguém abrir o endereço de um produto **antes** de ele ser publicado, a primeira requisição depois da publicação ainda pode receber o 404; as seguintes recebem 200. O Next regera a página em segundo plano, e a entrada 404 não guarda as tags que a invalidariam. Detalhes na MDI-D034.
- **Efeito no build:** o build passa a ler o banco (leitura anônima) para gerar as páginas. Com o remoto ainda sem catálogo, as rotas dinâmicas geram só o marcador `_` (404).

### Design, responsividade, performance e acessibilidade

- **Visual** (MDI-D033):
  - base neutra premium, sem inventar a identidade oficial: preto, branco e cinzas;
  - tipografia grande com equilíbrio de linhas, pílulas e muito espaço;
  - seções claras e escuras.
  - Microinterações só em CSS: hover no card, escala da imagem, pressão do botão.
- **Telas tratadas uma a uma:**
  - celular: carrosséis, barra de compra fixa, botões na largura, grade de 1 coluna abaixo de 480 px;
  - tablet: grade de 3 colunas, menu;
  - notebook: menu abaixo de 1280 px;
  - desktop: navegação completa e painel de compra fixo ao lado da galeria.
  - Sem rolagem horizontal da página (E2E no Pixel 7).
- **Performance:**
  - next/image otimizado, só do bucket do projeto, com `sizes` por layout, carregamento sob demanda e `preload` só na imagem principal (MDI-D032);
  - vídeo sem reprodução automática e sem pré-carregamento;
  - páginas estáticas a partir do cache;
  - client components só no menu e no seletor de variante.
- **Acessibilidade:**
  - landmarks e títulos em ordem; `aria-labelledby` nas seções;
  - alt de todas as imagens (biblioteca);
  - foco visível, inclusive no card inteiro;
  - teclado em menu, seletor (rádios nativos) e carrosséis (região focável);
  - labels; contraste dos tokens;
  - preço anunciado ao trocar de variante (`aria-live`);
  - conteúdo completo sem animação.

## Banco de dados

**Nenhuma migration.** `homepage_sections` e as chaves `store`/`footer` de `site_settings` já existiam, com RLS, auditoria e regra de mídia em uso (MDI-D009, D016). Coleções e `product_sections` ficaram fora, por não serem necessárias (MDI-D035). **Não há push remoto nesta etapa.**

**Seed local** (`supabase/seed.sql`, só desenvolvimento e testes; dados fictícios):
- "Produto com variantes" na linha Mac: 3 variantes com preços, especificações e lançamento;
- loja física e rodapé de teste;
- mensagem geral do WhatsApp;
- 6 blocos ativos na Home.

## Testes

| Camada | Resultado |
|---|---|
| Lint, tipos, formatação (`npm run check`) | verde |
| Unitários + componentes (Vitest) | **223** testes, 31 arquivos |
| Integração (Supabase local) | **53** testes, 4 arquivos, repetível sem reset |
| pgTAP (`npm run db:test`) | **270** (sem mudança de schema) |
| E2E Playwright (local, desktop + Pixel 7) | **13** testes |
| Build de produção (`npm run build`) | verde |

**Cobertura pedida no ponto 16:**
- **Home:** blocos, temas, botões e WhatsApp do hero.
- **Categoria:** família, preço, selo e estado vazio.
- **Produto e variante:** preço, parcela e disponibilidade mudam com a variante, e o WhatsApp leva a variante escolhida.
- **Conteúdo do painel:** blocos, loja e rodapé, com papéis e RLS.
- **Celular:** menu, navegação, barra fixa e ausência de rolagem horizontal.
- **Não publicado e inexistente:** status 404 real.
- **Painel → site:** título do Hero editado pelo CONTENT_EDITOR e nome da loja editado pelo OWNER aparecem no site; produto publicado, preço alterado e despublicado.

Playwright continua só local, contra o seed.

## Riscos e pendências

- **Identidade oficial** (cores, fonte, logo) ainda não recebida. Entra trocando `tokens.css` e o arquivo do logo.
- **404 em cache por uma requisição** depois de publicar um endereço visitado antes (MDI-D034).
- **Build depende do banco:** se o Supabase estiver indisponível no build, o deploy falha (MDI-D034). Avaliar na Etapa 10.
- **Otimizador de imagem:** custo e cota na Vercel a revisar na Etapa 07 (MDI-D032).
- **Imagens do seed local** apontam para um arquivo que não existe no Storage local (o log mostra "upstream image response failed"). Só afeta o ambiente local.
- **Coleções e blocos editoriais do produto:** adiados (MDI-D035).
- `/contato` (Brain §6) não foi criada: o contato está no cabeçalho, no rodapé e em `/loja`.
- **Herdadas:**
  - limpeza de órfãos no Storage (Etapa 09);
  - SMTP e recuperação de senha;
  - política de senha remota;
  - revogação dos tokens antigos;
  - atualização do CLI (2.109 → 2.122);
  - risco do e-mail genérico do OWNER;
  - redirects de slug (Etapas 07/08);
  - reordenação não atômica.
- **Seguir com `noindex`** no site até a Etapa 07 (SEO) e o go-live.

## Validação final

```bash
npm run check
npm run build
npm run db:reset && npm run db:test
npm run test:integration
npm run test:e2e
```
