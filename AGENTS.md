<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Regras do projeto Moça do iPhone 2.0

1. Antes de qualquer implementação, leia o Brain (`moca-do-iphone-brain/BRAIN-MOCA-DO-IPHONE.md`) e o agente responsável em `moca-do-iphone-brain/agents/`. O Brain é normativo e **não deve ser editado**.
2. Respeite as decisões em `docs/decisoes/REGISTRO-DE-DECISOES.md`. Toda mudança estrutural gera uma nova decisão MDI-Dxxx.
3. Siga `docs/CONVENCOES.md`: sem `any`, apenas design tokens, nada de preço/telefone/produto no código.
4. O projeto avança por etapas numeradas (`docs/etapas/`). Execute só a etapa pedida.
5. Antes de entregar: `npm run check` e `npm run build` verdes.
