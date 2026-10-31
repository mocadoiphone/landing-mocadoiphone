# Convenções de código — Moça do iPhone 2.0

> Complementa o Brain (§31, §39) e o agente `desenvolvedor.md`. Em caso de conflito, o Brain prevalece.

## Idioma

- **Código** (variáveis, funções, tipos, arquivos): inglês.
- **Textos de interface, mensagens de erro para o usuário, comentários e documentação:** português do Brasil.
- **Rotas públicas** seguem o Brain §6 (`/produto/[slug]`, `/ofertas`…).

## TypeScript

- Modo estrito com `noUncheckedIndexedAccess`.
- `any` é proibido no código próprio (erro de lint). Para dado de tipo ainda desconhecido, use `unknown` e valide com Zod.
- Imports de tipo usam `import { type X }` ou `import type` (regra `consistent-type-imports`).
- Imports internos usam o alias `@/` (ex.: `@/config/env`), nunca caminhos relativos longos (`../../..`).

## Organização (MDI-D001, MDI-D002)

- `src/app/`: rotas finas, que só compõem serviços e componentes.
- `src/components/`: apresentação. Recebe dados por props e nunca acessa o banco.
- `src/services/<domínio>/`: acesso a dados (server-only), a partir da Etapa 02.
- `src/lib/`: regras puras e testáveis (preço, disponibilidade, WhatsApp…).
- `src/config/`: configuração validada (variáveis de ambiente, dados estáticos do site).
- `src/styles/`: tokens e CSS global.
- Crie uma pasta só quando houver um arquivo com função clara para ela.

## Dados comerciais

Nunca escreva preço, telefone, número de WhatsApp ou nome de produto direto no JSX ou em variáveis de ambiente (Brain §11, MDI-D002). Esses dados vêm do banco.

## Estilo e design tokens (MDI-D013)

- Use apenas as classes semânticas dos tokens: `bg-background`, `text-foreground`, `text-muted`, `bg-surface`, `border-border`, `bg-accent`, `px-gutter`, `py-section`, `max-w-content`, `rounded-card`, `shadow-elevated`, `text-display-lg`…
- A paleta padrão do Tailwind está desligada. Cores literais em classes (`bg-[#fff]`, `text-[oklch(...)]`) são bloqueadas pelo lint.
- Seções escuras usam `data-theme="dark"`, sem duplicar classes.
- Os valores atuais dos tokens são **provisórios**. A identidade oficial será aplicada só em `src/styles/tokens.css`.

## Acessibilidade e movimento

- Foco visível (já garantido no CSS global), labels em campos, alt text em imagens.
- `prefers-reduced-motion` é respeitado globalmente. Animações novas precisam de alternativa para movimento reduzido e para mobile (Brain §28, §29, §33).

## Testes (MDI-D014)

- Os testes ficam ao lado do arquivo testado: `nome.test.ts` (regra pura, ambiente Node) ou `nome.test.tsx` (componente, ambiente DOM).
- Toda regra de negócio em `src/lib/` precisa de teste unitário.
- Componentes `async` (Server Components com dados) não são testados no Vitest: serão cobertos por E2E na Etapa 09.

## Formatação

- Prettier (configuração padrão + ordenação de classes Tailwind). Rode `npm run format` antes de commitar.
- Finais de linha LF (`.gitattributes`, `.editorconfig`).
- `moca-do-iphone-brain/` e `docs/` não passam pelo Prettier, para preservar o texto como foi escrito.

## Commits

- Padrão Conventional Commits, em inglês: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Antes de commitar: `npm run check` e `npm run build` verdes.
- Toda mudança estrutural gera uma decisão MDI-Dxxx antes do commit (Brain §40).
