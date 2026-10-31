# Moça do iPhone 2.0

Plataforma de catálogo premium e administrável da Moça do iPhone (mocadoiphone.com).

- **Fonte normativa:** [`moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md`](moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md). Em caso de conflito, o Brain prevalece até que uma nova decisão seja registrada.
- **Decisões estruturais:** [`docs/decisoes/REGISTRO-DE-DECISOES.md`](docs/decisoes/REGISTRO-DE-DECISOES.md) (padrão MDI-Dxxx).
- **Convenções de código:** [`docs/CONVENCOES.md`](docs/CONVENCOES.md).
- **Etapas:** [00 — Auditoria](docs/auditoria/ETAPA-00-AUDITORIA.md) · [01 — Fundação técnica](docs/etapas/ETAPA-01-FUNDACAO-TECNICA.md) · [02 — Banco e autenticação](docs/etapas/ETAPA-02-BANCO-E-AUTENTICACAO.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage, RLS) · Zod · Vitest + Testing Library · pgTAP · ESLint · Prettier.
Previstos nas próximas etapas (Brain §5): GSAP e Motion (Etapas 05–06).

## Requisitos

- Node.js 22 (veja `.nvmrc`) e npm
- Docker e [Supabase CLI](https://supabase.com/docs/guides/cli) (2.109+) para o banco local

## Primeiros passos

```bash
npm install
npm run db:start             # sobe o Supabase local (Docker)
npm run db:reset             # aplica migrations + seed de desenvolvimento
# crie .env.development.local com NEXT_PUBLIC_SUPABASE_URL e
# NEXT_PUBLIC_SUPABASE_ANON_KEY tirados de `supabase status`
npm run dev                  # http://localhost:3000 · painel em /admin
```

Usuários do seed local: veja o cabeçalho de [`supabase/seed.sql`](supabase/seed.sql).

## Comandos

| Comando                           | O que faz                                                   |
| --------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                     | Servidor de desenvolvimento                                 |
| `npm run build`                   | Build de produção (inclui checagem de tipos)                |
| `npm run start`                   | Serve o build de produção                                   |
| `npm run lint`                    | ESLint                                                      |
| `npm run typecheck`               | Gera os tipos de rota do Next e roda `tsc --noEmit`         |
| `npm run test`                    | Testes unitários e de componentes (Vitest, sem Docker)      |
| `npm run test:watch`              | Os mesmos testes em modo observação                         |
| `npm run test:integration`        | Testes contra a API real do Supabase local                  |
| `npm run format` / `format:check` | Aplica / verifica a formatação (Prettier)                   |
| `npm run check`                   | lint + typecheck + test + format:check                      |
| `npm run db:start` / `db:stop`    | Sobe / para o Supabase local                                |
| `npm run db:reset`                | Recria o banco local do zero (migrations + seed)            |
| `npm run db:test`                 | Testes pgTAP (RLS, constraints, regras, auditoria, Storage) |
| `npm run db:lint`                 | Linter de schema do Supabase                                |
| `npm run db:types`                | Regenera `src/types/database.ts` a partir do schema local   |

## Estrutura atual

```txt
src/
├── app/          rotas (App Router): página técnica, /admin/login, /admin
├── components/   apresentação (admin/)
├── config/       configuração validada: env.ts (variáveis de ambiente), site.ts
├── lib/          supabase/ (clientes browser, server, proxy) · auth/ (regras puras)
├── services/     acesso a dados no servidor (auth/)
├── styles/       tokens.css (design tokens provisórios) e globals.css
├── types/        database.ts (gerado pelo Supabase CLI)
└── proxy.ts      renovação de sessão do /admin
supabase/         config.toml · migrations/ · seed.sql (só local) · tests/ (pgTAP)
tests/            integration/ (API real do Supabase local)
docs/             auditoria, etapas, decisões e convenções
moca-do-iphone-brain/   Brain e agentes (normativos, não editar)
```

As demais pastas da arquitetura (`hooks/`, `motion/` e os outros grupos de `components/`) são criadas na etapa que as usa (MDI-D001).

## Variáveis de ambiente

Veja [`.env.example`](.env.example). `.env*` nunca é versionado (exceto o exemplo). A chave do Supabase em variável `NEXT_PUBLIC_` deve ser a **pública** (anon/publishable): a aplicação se recusa a iniciar se receber uma chave secreta.
