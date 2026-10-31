# BRAIN — Moça do iPhone 2.0

> Documento normativo do projeto.
> Toda implementação deve respeitar este Brain.
> Em caso de conflito entre código, layout antigo, pedido isolado ou comportamento legado, este documento prevalece até que uma nova decisão seja registrada.

---

## 1. IDENTIDADE DO PROJETO

**Projeto:** Moça do iPhone 2.0  
**Domínio principal:** mocadoiphone.com  
**Tipo:** catálogo comercial premium com painel administrativo  
**Segmento:** revenda de produtos Apple  
**Objetivo principal:** substituir a experiência atual por uma apresentação premium, responsiva, performática e administrável.

O novo site deve combinar:

1. experiência visual premium;
2. apresentação cinematográfica de produtos;
3. catálogo estruturado;
4. atualização rápida de preço e disponibilidade;
5. conversão por WhatsApp;
6. painel administrativo simples;
7. SEO técnico;
8. alto desempenho;
9. segurança;
10. base preparada para futuras integrações comerciais.

---

# 2. VISÃO DO PRODUTO

O site não deve ser tratado como uma landing page estática.

Ele deve funcionar como uma **plataforma de catálogo administrável**, na qual a equipe da Moça do iPhone consiga atualizar produtos e informações comerciais sem alterar código.

O front-end deve preservar a qualidade visual mesmo quando o conteúdo for alterado pelo administrador.

### Princípio central

> O administrador altera dados.  
> O sistema controla apresentação, layout, regras e consistência.

Não criar um editor visual livre no estilo Wix.

---

# 3. REFERÊNCIA VISUAL

Referência principal de experiência:

`https://castro-portfolio-landing.vercel.app/demos/istore/index.html`

A referência deve orientar:

- ritmo de navegação;
- seções de tela cheia;
- tipografia de grande escala;
- produto como protagonista;
- movimento sincronizado ao scroll;
- transições suaves;
- uso de imagens recortadas;
- composição minimalista;
- fundos claros e escuros;
- sensação premium;
- entrada e saída de elementos;
- sticky sections;
- parallax moderado;
- storytelling por produto.

## Regra de propriedade intelectual

Não utilizar ativos de terceiros sem autorização.

Podem ser reproduzidos:

- padrões de interação;
- lógica de animação;
- composição;
- ritmo;
- estrutura;
- experiência.

Fotografias, logotipos, vídeos, textos e materiais protegidos devem pertencer à Moça do iPhone, ao fornecedor autorizado ou possuir licença de uso.

---

# 4. OBJETIVOS DE NEGÓCIO

O sistema deve:

- apresentar produtos de forma premium;
- facilitar atualização de preços;
- informar disponibilidade;
- destacar lançamentos;
- direcionar leads para WhatsApp;
- permitir troca rápida de banners e destaques;
- permitir organização por famílias de produtos;
- reduzir dependência de desenvolvedor;
- melhorar presença orgânica no Google;
- facilitar expansão futura.

---

# 5. STACK PADRÃO

## Front-end

- Next.js
- TypeScript
- React
- Tailwind CSS

## Movimento

- GSAP
- ScrollTrigger
- Framer Motion para microinterações

### Regra

GSAP deve ser preferido para:

- timelines;
- pinning;
- sequências sincronizadas ao scroll;
- transformações complexas;
- storytelling.

Framer Motion deve ser preferido para:

- modais;
- menus;
- cards;
- hover;
- pequenas transições;
- estados de interface.

## Backend

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security

## Infraestrutura

- Vercel
- Supabase
- CDN de imagens

---

# 6. ARQUITETURA DE ROTAS

```txt
/
├── /iphone
├── /mac
├── /ipad
├── /apple-watch
├── /airpods
├── /vision-pro
├── /tv-e-casa
├── /acessorios
│
├── /produto/[slug]
│
├── /ofertas
├── /lancamentos
├── /loja
├── /contato
│
└── /admin
    ├── /dashboard
    ├── /produtos
    ├── /categorias
    ├── /colecoes
    ├── /home
    ├── /banners
    ├── /midia
    ├── /contatos
    ├── /seo
    ├── /usuarios
    └── /configuracoes
```

---

# 7. HOME

A Home deve possuir storytelling visual e não parecer uma simples grade de ecommerce.

## Estrutura sugerida

### 7.1 Hero

Conteúdo administrável:

- eyebrow;
- título;
- subtítulo;
- imagem;
- vídeo opcional;
- CTA principal;
- CTA secundário;
- produto relacionado.

Possibilidade de hero claro ou escuro.

---

### 7.2 Produto principal

Seção cinematográfica.

Possíveis animações:

- produto escalando conforme scroll;
- rotação leve;
- mudança de fundo;
- entrada de textos;
- mudança de cor;
- especificações surgindo progressivamente.

---

### 7.3 Lançamentos

Cards premium alimentados pelo catálogo.

Campo:

`is_launch = true`

---

### 7.4 Linhas Apple

- iPhone
- Mac
- iPad
- Apple Watch
- AirPods
- Vision Pro
- TV e Casa
- Acessórios

---

### 7.5 Benefícios comerciais

Administrável.

Exemplos:

- retirada em loja;
- atendimento especializado;
- parcelamento;
- pronta entrega;
- encomendas.

---

### 7.6 Destaques editoriais

Permitir vincular produtos a blocos visuais maiores.

---

### 7.7 Loja física

Dados:

- endereço;
- horários;
- mapa;
- fotos;
- CTA.

---

### 7.8 Footer

Administrável.

---

# 8. CATÁLOGO

## Hierarquia

```txt
Categoria
└── Família
    └── Produto
        └── Variante
```

Exemplo:

```txt
iPhone
└── iPhone 17
    └── iPhone 17 Pro Max
        ├── 256 GB / Preto
        ├── 256 GB / Branco
        ├── 512 GB / Preto
        └── 1 TB / Azul
```

---

# 9. PRODUTO

Cada produto deve possuir:

- nome;
- slug;
- categoria;
- família;
- descrição curta;
- descrição completa;
- status;
- selo;
- especificações;
- imagens;
- vídeos;
- variantes;
- preço inicial;
- parcelamento;
- disponibilidade;
- SEO;
- ordem;
- produto relacionado;
- WhatsApp.

---

# 10. VARIANTES

Produto e variante são entidades diferentes.

## Exemplo

**Produto**

iPhone 17 Pro Max

**Variantes**

```txt
256 GB / Preto
256 GB / Branco
512 GB / Preto
512 GB / Branco
1 TB / Preto
```

Cada variante pode possuir:

- SKU;
- capacidade;
- cor;
- preço;
- preço promocional;
- estoque/status;
- imagem;
- ordem.

---

# 11. PREÇOS

Nunca inserir preço diretamente no JSX.

## Campos

- `price_cash`
- `price_old`
- `price_installment`
- `installments`
- `installment_text`
- `price_on_request`

## Exibição

Exemplo:

```txt
R$ 8.999
ou 18x de R$ 549,90
```

### Estado sem preço

Permitir:

```txt
Consulte valores
```

---

# 12. DISPONIBILIDADE

Estados mínimos:

```txt
AVAILABLE
PRE_ORDER
ON_REQUEST
OUT_OF_STOCK
DISCONTINUED
HIDDEN
```

Interface em português:

- Disponível
- Sob encomenda
- Consulte disponibilidade
- Indisponível
- Fora de linha
- Oculto

---

# 13. WHATSAPP

O WhatsApp é canal principal de conversão.

Cada produto deve gerar mensagem contextual.

Exemplo lógico:

```txt
Olá! Vi no site da Moça do iPhone o iPhone 17 Pro Max 256 GB Preto e gostaria de consultar disponibilidade e valor.
```

## Configurações

Painel deve permitir:

- número padrão;
- vendedores;
- mensagem padrão;
- origem do lead;
- produto;
- variante.

Futuramente pode haver distribuição de leads.

---

# 14. CONTATOS / VENDEDORES

Tabela de atendentes.

Campos:

- nome;
- telefone;
- WhatsApp;
- ativo;
- ordem;
- foto opcional;
- função.

Permitir definir:

- vendedor padrão;
- rodízio futuro;
- CTA específico.

---

# 15. PAINEL ADMINISTRATIVO

Objetivo:

> permitir que uma pessoa sem conhecimento técnico mantenha o catálogo.

## Dashboard

Mostrar:

- produtos publicados;
- produtos indisponíveis;
- produtos sem preço;
- lançamentos;
- promoções;
- alterações recentes.

---

# 16. ADMIN — PRODUTOS

Tabela:

| Produto | Categoria | Preço | Disponibilidade | Destaque | Status | Ações |
|---|---|---|---|---|---|---|

Filtros:

- categoria;
- status;
- disponibilidade;
- lançamento;
- destaque;
- promoção.

Busca por nome.

---

# 17. CADASTRO DE PRODUTO

Organizar em abas.

## Aba Geral

- nome;
- slug;
- categoria;
- família;
- resumo;
- descrição.

## Aba Comercial

- preço;
- parcelamento;
- promoção;
- disponibilidade.

## Aba Variantes

- capacidade;
- cor;
- SKU;
- preço;
- disponibilidade.

## Aba Mídia

- imagem principal;
- galeria;
- vídeo;
- imagem mobile.

## Aba Conteúdo

- especificações;
- benefícios;
- seções editoriais.

## Aba SEO

- meta title;
- meta description;
- OG image;
- canonical.

---

# 18. HOME ADMINISTRÁVEL

Administrador não pode alterar livremente HTML.

Deve selecionar conteúdos.

Exemplo:

```txt
Hero
Produto: iPhone 17 Pro
Tema: escuro
CTA: Ver opções
```

Outro bloco:

```txt
Destaque #2
Produto: MacBook Pro
Layout: cinematográfico
Tema: claro
```

---

# 19. SISTEMA DE BLOCOS

Criar blocos predefinidos.

Tipos:

```txt
HERO_PRODUCT
PRODUCT_STORY
PRODUCT_GRID
CATEGORY_GRID
FULLSCREEN_MEDIA
TEXT_AND_MEDIA
FEATURES
PROMO_BANNER
STORE
REVIEWS
CTA
```

Admin pode:

- habilitar;
- desabilitar;
- ordenar;
- selecionar produto;
- selecionar mídia;
- alterar textos permitidos.

Admin não pode quebrar o layout.

---

# 20. MÍDIA

Storage organizado:

```txt
/products
/categories
/home
/banners
/store
/seo
```

## Upload

Aceitar:

- JPG;
- PNG;
- WEBP;
- AVIF;
- MP4 quando habilitado.

## Regras

- validar tamanho;
- gerar preview;
- alt text obrigatório;
- permitir reorder;
- excluir somente após verificar referências.

---

# 21. MODELO DE DADOS

## categories

```txt
id
name
slug
description
image_url
sort_order
is_active
created_at
updated_at
```

## product_families

```txt
id
category_id
name
slug
sort_order
```

## products

```txt
id
family_id
category_id
name
slug
short_description
description
status
badge
price_from
is_featured
is_launch
is_promotion
published_at
sort_order
created_at
updated_at
```

## product_variants

```txt
id
product_id
sku
storage
color_name
color_hex
price_cash
price_old
price_installment
installments
availability
is_default
sort_order
created_at
updated_at
```

## product_media

```txt
id
product_id
variant_id
type
url
alt_text
sort_order
```

## product_specs

```txt
id
product_id
group_name
label
value
sort_order
```

## homepage_sections

```txt
id
type
title
subtitle
content
product_id
category_id
media_url
theme
settings_json
sort_order
is_active
```

## contacts

```txt
id
name
phone
whatsapp
role
avatar_url
is_active
is_default
sort_order
```

## site_settings

```txt
key
value_json
updated_at
```

## admins

Utilizar Supabase Auth + tabela de perfil.

---

# 22. RLS E SEGURANÇA

Regra padrão:

**público lê somente conteúdo publicado.**

Usuário público nunca pode:

- criar;
- editar;
- excluir;
- acessar registros administrativos.

Administrador autenticado pode alterar somente recursos autorizados.

RLS obrigatória.

Nunca confiar apenas na proteção do front-end.

---

# 23. PERFIS ADMINISTRATIVOS

Preparar arquitetura para:

```txt
OWNER
ADMIN
CATALOG_MANAGER
CONTENT_EDITOR
```

Inicialmente OWNER e ADMIN podem ser suficientes.

---

# 24. AUDITORIA

Alterações críticas devem registrar:

- usuário;
- entidade;
- registro;
- operação;
- valor anterior;
- valor novo;
- data/hora.

Especialmente:

- preço;
- disponibilidade;
- publicação;
- exclusão.

---

# 25. EXCLUSÃO

Preferir soft delete.

Campos:

```txt
deleted_at
deleted_by
```

Produto com histórico não deve desaparecer definitivamente por engano.

---

# 26. SEO

Cada produto deve gerar:

- título;
- descrição;
- canonical;
- Open Graph;
- Twitter/X card;
- JSON-LD Product quando aplicável;
- sitemap;
- robots.

Rotas devem ser amigáveis.

Exemplo:

```txt
/iphone/iphone-17-pro-max
```

ou:

```txt
/produto/iphone-17-pro-max
```

Escolher uma abordagem única antes da implementação final.

---

# 27. PERFORMANCE

Metas:

- imagens otimizadas;
- lazy loading;
- evitar JS desnecessário;
- animações com GPU quando possível;
- evitar layout shift;
- reduzir peso de vídeos;
- SSR/SSG quando adequado;
- cache controlado.

Animação premium não pode significar site lento.

---

# 28. MOBILE FIRST

Toda animação desktop deve possuir comportamento mobile próprio.

Não apenas reduzir escala.

Em telas pequenas:

- reduzir pinning excessivo;
- evitar scroll artificial;
- reduzir efeitos pesados;
- manter produto legível;
- preservar CTA.

---

# 29. ACESSIBILIDADE

Obrigatório:

- navegação por teclado;
- foco visível;
- alt text;
- contraste;
- labels;
- `prefers-reduced-motion`;
- sem conteúdo essencial acessível somente por animação.

---

# 30. DESIGN SYSTEM

Criar tokens.

## Cores

Devem ser extraídas da identidade oficial da Moça do iPhone.

Não inventar identidade definitiva no código.

## Tipografia

Manter visual premium e alta legibilidade.

## Tokens mínimos

```txt
background
surface
surface-elevated
text
text-muted
border
accent
success
warning
danger
```

---

# 31. COMPONENTIZAÇÃO

Exemplo:

```txt
components/
├── layout/
├── navigation/
├── product/
├── category/
├── commerce/
├── motion/
├── sections/
├── admin/
└── ui/
```

---

# 32. MOTION SYSTEM

Criar camada reutilizável.

```txt
motion/
├── reveal.ts
├── parallax.ts
├── pin.ts
├── product-story.ts
├── text-reveal.ts
└── reduced-motion.ts
```

Nunca espalhar timelines GSAP arbitrariamente pelas páginas.

---

# 33. PRINCÍPIOS DE ANIMAÇÃO

1. movimento deve comunicar;
2. produto continua legível;
3. scroll não pode parecer travado;
4. efeitos não podem impedir navegação;
5. respeitar reduced motion;
6. mobile terá variações específicas;
7. não criar animação apenas por ornamentação.

---

# 34. MIGRAÇÃO DO SITE ATUAL

O conteúdo atual deve ser inventariado.

Categorias identificadas:

- iPhone;
- MacBook;
- Apple Watch;
- iPad;
- AirPods;
- Vision Pro;
- TV e Casa;
- acessórios.

Migrar apenas conteúdo validado.

Não assumir que:

- preços atuais continuam válidos;
- produtos antigos continuam disponíveis;
- textos antigos são definitivos.

Antes do go-live, catálogo deve ser revisado pelo cliente.

---

# 35. STATUS DE MIGRAÇÃO

Cada produto importado deve ser marcado:

```txt
DRAFT
REVIEWED
PUBLISHED
```

Nada deve ser publicado automaticamente após scraping/importação.

---

# 36. FORA DO MVP

Não implementar sem decisão específica:

- checkout próprio;
- pagamento online;
- ERP;
- estoque quantitativo;
- emissão fiscal;
- logística;
- marketplace;
- CRM completo;
- programa de fidelidade.

Arquitetura pode estar preparada, mas essas funcionalidades não fazem parte do escopo inicial.

---

# 37. MVP

## Fase 1

- estrutura do projeto;
- design system;
- Supabase;
- autenticação admin;
- categorias;
- produtos;
- variantes;
- mídia;
- preço;
- disponibilidade.

## Fase 2

- home premium;
- páginas de categoria;
- página de produto;
- WhatsApp contextual.

## Fase 3

- painel administrativo completo;
- home configurável;
- banners;
- SEO.

## Fase 4

- migração;
- QA;
- performance;
- segurança;
- publicação.

---

# 38. CRITÉRIOS DE ACEITE

O MVP só pode ser considerado concluído quando:

- admin consegue cadastrar produto;
- admin consegue alterar preço;
- admin consegue alterar disponibilidade;
- admin consegue publicar/despublicar;
- admin consegue enviar imagens;
- alterações aparecem no site sem mudança de código;
- WhatsApp recebe contexto correto;
- site funciona em desktop e mobile;
- RLS está validada;
- SEO básico está implementado;
- animações respeitam reduced motion;
- nenhuma credencial aparece no cliente;
- páginas críticas passam por QA.

---

# 39. PRINCÍPIO DE DESENVOLVIMENTO

Antes de implementar qualquer funcionalidade:

1. identificar domínio;
2. verificar regra no Brain;
3. mapear impacto;
4. implementar;
5. testar;
6. documentar.

Não realizar refatorações não relacionadas sem justificativa.

---

# 40. REGISTRO DE DECISÕES

Toda alteração estrutural deve gerar uma decisão.

Formato:

```txt
MDI-D001
Data:
Decisão:
Motivo:
Impacto:
Arquivos afetados:
```

---

# 41. AGENTES

Os agentes oficiais ficam em `/agents`.

- `engenheiro-software.md`
- `modelagem-dados.md`
- `desenvolvedor.md`
- `ui-ux-motion.md`
- `seguranca.md`
- `qa.md`
- `relator.md`

Cada agente possui escopo delimitado.

---

# 42. REGRA FINAL

O objetivo não é copiar uma página.

O objetivo é construir a **nova plataforma digital da Moça do iPhone**, usando a referência iStore como benchmark visual e transformando o catálogo atual em uma operação administrável, consistente e preparada para evolução.
