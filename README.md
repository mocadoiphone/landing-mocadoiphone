# Moça do iPhone 2.0

Plataforma de catálogo premium e administrável da Moça do iPhone (mocadoiphone.com).

- **Fonte normativa:** [`moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md`](moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md). Em caso de conflito, o Brain prevalece até que uma nova decisão seja registrada.
- **Decisões estruturais:** [`docs/decisoes/REGISTRO-DE-DECISOES.md`](docs/decisoes/REGISTRO-DE-DECISOES.md) (padrão MDI-Dxxx).
- **Convenções de código:** [`docs/CONVENCOES.md`](docs/CONVENCOES.md).
- **Etapas:** [00 — Auditoria](docs/auditoria/ETAPA-00-AUDITORIA.md) · [01 — Fundação técnica](docs/etapas/ETAPA-01-FUNDACAO-TECNICA.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Zod · Vitest + Testing Library · ESLint · Prettier.
Previstos nas próximas etapas (Brain §5): Supabase (Etapa 02), GSAP e Motion (Etapas 05–06).

## Requisitos

- Node.js 22 (veja `.nvmrc`)
- npm

## Primeiros passos

```bash
npm install
cp .env.example .env.local   # opcional na Etapa 01: o projeto roda sem variáveis
npm run dev                  # http://localhost:3000
```

## Comandos

| Comando                           | O que faz                                           |
| --------------------------------- | --------------------------------------------------- |
| `npm run dev`                     | Servidor de desenvolvimento                         |
| `npm run build`                   | Build de produção (inclui checagem de tipos)        |
| `npm run start`                   | Serve o build de produção                           |
| `npm run lint`                    | ESLint                                              |
| `npm run typecheck`               | Gera os tipos de rota do Next e roda `tsc --noEmit` |
| `npm run test`                    | Testes (Vitest, execução única)                     |
| `npm run test:watch`              | Testes em modo observação                           |
| `npm run format` / `format:check` | Aplica / verifica a formatação (Prettier)           |
| `npm run check`                   | lint + typecheck + test + format:check              |

## Estrutura atual

```txt
src/
├── app/       rotas (App Router)
├── config/    configuração validada: env.ts (variáveis de ambiente), site.ts
└── styles/    tokens.css (design tokens provisórios) e globals.css
docs/          auditoria, etapas, decisões e convenções
moca-do-iphone-brain/   Brain e agentes (normativos, não editar)
```

As demais pastas da arquitetura (`components/`, `services/`, `lib/`, `hooks/`, `types/`, `motion/`) são criadas na etapa que as usa (MDI-D001).

## Variáveis de ambiente

Veja [`.env.example`](.env.example). Nenhuma é obrigatória na Etapa 01. `.env.local` nunca é versionado.
