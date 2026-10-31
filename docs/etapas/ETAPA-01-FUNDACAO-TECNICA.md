# ETAPA 01 — Fundação técnica

> **Projeto:** Moça do iPhone 2.0 · **Data:** 2026-10-30 · **Status:** concluída, aguardando aprovação para a Etapa 02
> **Referências:** [Brain](../../moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md) · [Auditoria (Etapa 00)](../auditoria/ETAPA-00-AUDITORIA.md) · [Decisões](../decisoes/REGISTRO-DE-DECISOES.md) · [Convenções](../CONVENCOES.md)

## Objetivo

Criar a base técnica do projeto: repositório, Next.js, TypeScript estrito, Tailwind, design tokens provisórios, validação de ambiente, lint, typecheck, testes e convenções. Nenhuma funcionalidade de negócio, nenhum banco e nenhuma Home real.

## O que foi criado

| Item | Detalhe |
|---|---|
| Repositório Git | `git init -b main`, sem remote. `.gitignore` do Next + exceção para `.env.example`. `.gitattributes` força finais de linha LF. |
| Next.js 16.4.3 | App Router, Turbopack, `src/`, alias `@/*`. Gerado com o `create-next-app` oficial numa pasta temporária e copiado para a raiz, porque o CLI recusa pasta com `moca-do-iphone-brain/`. |
| TypeScript estrito | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`; `allowJs` desligado. |
| Tailwind CSS 4 | Configurado via CSS (`@theme`) com o loader `@tailwindcss/turbopack` gerado pelo Next 16.4. |
| Design tokens provisórios | `src/styles/tokens.css`, com cores, tipografia, espaçamento, containers, raios e sombras, todos neutros e marcados como **temporários**. Paleta padrão do Tailwind desligada. Temas claro e escuro por seção (`data-theme`). |
| CSS global | `src/styles/globals.css`: foco visível (§29) e `prefers-reduced-motion` global (§29, §33). |
| Variáveis de ambiente | `src/config/env.ts` (Zod): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, opcionais. `.env.example` sem valores. |
| Configuração do site | `src/config/site.ts`: nome e idioma (`pt-BR`). |
| Página técnica | `/` mostra "Moça do iPhone 2.0 / Fundação técnica inicializada.", usando só tokens. |
| Segurança básica | `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` removido. CSP fica para a Etapa 09. |
| Lint | ESLint flat config do Next + `no-explicit-any` (erro), `consistent-type-imports`, bloqueio de cor literal em classes. |
| Formatação | Prettier + ordenação de classes Tailwind; `.editorconfig`. |
| Testes | Vitest com projetos `unit` (Node) e `components` (jsdom + Testing Library). |
| Documentação | `README.md`, `docs/CONVENCOES.md`, este relatório e as decisões MDI-D013 a D015. O `AGENTS.md` do Next ganhou as regras do projeto (Brain, decisões, etapas). |

## Dependências instaladas

**Produção**

| Pacote | Versão | Por quê |
|---|---|---|
| next | 16.4.3 | Stack do Brain §5 |
| react, react-dom | 19.3.0 | Stack do Brain §5 |
| zod | 4.6.7 | Validação das variáveis de ambiente agora; validação no servidor nas próximas etapas (MDI-D002, MDI-D008) |

**Desenvolvimento**

| Pacote | Versão | Por quê |
|---|---|---|
| typescript | 5.9.3 | Brain §5 |
| tailwindcss, @tailwindcss/turbopack | 4.3.3 | Brain §5 (loader gerado pelo Next 16.4) |
| eslint, eslint-config-next | 9.39.5 / 16.4.3 | Lint oficial do Next |
| vitest | 5.0.5 | Testes unitários e de componentes |
| jsdom | 29.1.1 | DOM simulado para testes de componente |
| @testing-library/react, @testing-library/dom | 16.3.3 / 10.4.2 | Renderizar e consultar componentes nos testes (guia oficial do Next) |
| prettier, prettier-plugin-tailwindcss | 3.9.10 / 0.8.1 | Formatação padronizada e ordem de classes |
| @types/node, @types/react, @types/react-dom | 22.20.5 / 19.3.0 / 19.3.0 | Tipos (`@types/node` alinhado ao Node 22) |

**Não instalados de propósito:**
- `@vitejs/plugin-react` e `vite-tsconfig-paths`, sugeridos no guia do Next: o Vite 8 já resolve JSX e aliases.
- Supabase, GSAP e Motion: entram nas etapas em que forem usados.
- Playwright: entra na Etapa 09.
- Fontes do Google e os ícones/SVGs padrão do scaffold: são ativos de terceiros e implicariam escolher uma identidade visual.

## Estrutura

```txt
.
├── src/
│   ├── app/
│   │   ├── layout.tsx        html lang pt-BR, metadata, CSS global
│   │   ├── page.tsx          página técnica
│   │   └── page.test.tsx     teste de componente
│   ├── config/
│   │   ├── env.ts            variáveis de ambiente validadas
│   │   ├── env.test.ts       testes unitários
│   │   └── site.ts           nome e idioma
│   └── styles/
│       ├── tokens.css        design tokens PROVISÓRIOS (único arquivo a trocar)
│       └── globals.css       Tailwind + base (foco, movimento reduzido)
├── docs/                     auditoria, etapas, decisões, convenções
├── moca-do-iphone-brain/     Brain e agentes (intocados)
├── AGENTS.md                 regras do Next + regras do projeto
├── next.config.ts · tsconfig.json · eslint.config.mjs · vitest.config.mts · vitest.setup.ts
└── .env.example · .gitignore · .gitattributes · .editorconfig · .prettierrc.json · .prettierignore · .nvmrc
```

**Pastas da arquitetura que ainda não existem:** `components/*`, `lib/`, `services/`, `hooks/`, `types/` e `motion/` não foram criadas porque ainda não têm arquivo com função (MDI-D001; instrução da etapa: "não crie apenas para cumprir o desenho"). Previsão:

| Pasta | Primeira etapa |
|---|---|
| `lib/` e `types/` | 02–03 (clientes Supabase, tipos gerados, regras de preço e disponibilidade) |
| `services/` | 03 |
| `components/admin`, `components/ui` | 04 |
| `components/layout`, `navigation`, `product`, `category`, `commerce`, `sections` | 05 |
| `motion/`, `components/motion`, `hooks/` | 05–06 |

A variável de ambiente ficou em `src/config/env.ts`, e não em `src/lib/env.ts` como sugeria a auditoria, seguindo a estrutura base pedida para esta etapa (`config/`).

## Decisões tomadas

- **MDI-D013:** design tokens provisórios num único arquivo, temas por seção via `data-theme`, paleta padrão do Tailwind desligada e cor literal bloqueada no lint.
- **MDI-D014:** npm + Node 22, TypeScript estrito, ESLint, Prettier, Vitest com projetos Node e DOM, E2E adiado para a Etapa 09, comando `check`.
- **MDI-D015:** variáveis tipadas e opcionais até a Etapa 02, com validação ao carregar a configuração. O nome `NEXT_PUBLIC_SUPABASE_ANON_KEY` segue a instrução do responsável e substitui o `..._PUBLISHABLE_KEY` citado na auditoria. As decisões anteriores não foram alteradas.

## Comandos

```bash
npm run dev            # desenvolvimento
npm run build          # build de produção (inclui checagem de tipos)
npm run lint           # ESLint
npm run typecheck      # next typegen + tsc --noEmit
npm run test           # Vitest (execução única)
npm run test:watch     # Vitest em modo observação
npm run format         # aplica Prettier
npm run format:check   # verifica formatação
npm run check          # lint + typecheck + test + format:check
```

## Testes realizados

| Verificação | Resultado |
|---|---|
| `npm run build` | ✅ Compilou, checou tipos e gerou `/` como página estática |
| `npm run lint` | ✅ Sem erros nem avisos |
| `npm run typecheck` | ✅ Sem erros |
| `npm run test` | ✅ 2 arquivos, 7 testes (6 de ambiente, 1 de componente) |
| `npm run format:check` | ✅ Tudo formatado |
| `npm run dev` | ✅ HTTP 200; `lang="pt-BR"`; título e textos corretos; os 4 cabeçalhos de segurança presentes; sem `X-Powered-By` |
| Regras de lint | ✅ Arquivo de prova com `any`, `bg-[#ff0000]` e `` `text-[oklch(...)]` `` gerou 3 erros |
| Tokens no CSS final | ✅ `px-gutter`, `max-w-content`, `text-display-md`, `text-muted` e `font-display` gerados; nenhuma cor da paleta padrão presente; `text-muted` lê a variável do tema mais próximo |
| Variável inválida | ✅ `NEXT_PUBLIC_SUPABASE_URL=nao-e-url` interrompe o Next com "Variáveis de ambiente inválidas ✖ Invalid URL → at NEXT_PUBLIC_SUPABASE_URL" |
| `.env` | ✅ Só existe `.env.example` (versionável); `.env`, `.env.local` e `.env.*.local` são ignorados |
| Segredos | ✅ Nenhuma chave, token ou JWT nos arquivos do projeto |
| `npm audit --omit=dev` | ✅ 0 vulnerabilidades nas dependências de produção |
| `npm audit` (completo) | ⚠️ 16 alertas moderados, todos a mesma falha do `minimatch` < 11.0.1 na cadeia do ESLint (ver Riscos) |
| Brain | ✅ Hashes SHA-256 dos 9 arquivos iguais aos registrados na Etapa 00 |

## Pendências

1. **Manual de marca** (cores, tipografia, logo, favicon): necessário para substituir `tokens.css` e criar ícones. Não bloqueia a Etapa 02.
2. **Organização/conta do Supabase:** definir antes da Etapa 02.
3. **`assets-21/macbook.txt`:** arquivo adicionado à pasta durante esta etapa por fora do meu trabalho. É um componente React de hero com sequência de frames (motion, Etapa 06). Ficou **fora do commit** por estar fora do escopo e ter origem e licença desconhecidas (Brain §3). Decidir: versionar como referência, mover ou descartar.
4. **API de cache do Next 16** (`cacheComponents` / `'use cache'`): ficou desligada nesta etapa. Será decidida na Etapa 02/03, com base na documentação embarcada em `node_modules/next/dist/docs/`, como prevê a MDI-D011.
5. **Script de instalação do `unrs-resolver`:** o npm 11 avisa que a política `allowScripts` não cobre esse script de pós-instalação. O lint funciona sem ele; revisar se aparecer erro de resolução no ESLint.

## Riscos

- **Alerta moderado do `minimatch` (só em desenvolvimento):** é uma negação de serviço com padrões glob maliciosos, dentro do ESLint e do typescript-eslint. Não vai para o bundle de produção (`--omit=dev` sem alertas) e só seria explorável com globs controlados por terceiros. Ainda não há correção a montante: até o ESLint 10.14 usa `minimatch` ^10. **Não** aplicar `npm audit fix --force`, que rebaixaria o ESLint para a versão 4. Revisar a cada atualização do ESLint.
- **Ecossistema muito recente** (Next 16.4, Tailwind 4, Zod 4, Vitest 5): exemplos antigos da internet não se aplicam. Consultar sempre a documentação embarcada do Next (`AGENTS.md`).
- **Tokens provisórios:** se a identidade atrasar, as Etapas 05–06 avançam com visual neutro e o ajuste fica concentrado em `tokens.css`.
