# CLAUDE.md — Avshalom Elitzur Academic Website

## Project

Academic website for Prof. Avshalom C. Elitzur. Features articles, lectures, presentations, and events with premium content, Stripe subscriptions, and bilingual Hebrew/English support.

## Tech Stack

Next.js 15 (App Router) | TypeScript 5 | PostgreSQL + Prisma ORM | NextAuth v4 (magic links)
Vercel Blob (uploads) | Stripe (payments) | Tailwind CSS 4 | React Query + Context | Tiptap editor | Custom i18n (en.json/he.json)

## Critical Rules

1. **Never create custom upload UI** — always reuse `DragDropImageUpload` from `@/components/Upload/upload`
2. **Sort by `createdAt` desc**, never `updatedAt`, for display ordering
3. **Never hardcode strings** — use `t()` translation keys, add to both `src/locales/en.json` and `he.json`
4. **Always include `dark:` variants** in Tailwind classes
5. **After editing `prisma/schema.prisma`** — ALWAYS run `npx prisma db push` (skipping breaks the entire app)
6. **Use React Query hooks** from `/src/hooks/` — never query Prisma directly in components
7. **Admin check** — use `ALLOWED_EMAILS` from `@/constants/auth`

## Commands

```bash
npm run dev                   # Start dev server
npx prisma db push            # Sync schema to DB (CRITICAL after schema changes)
npx prisma generate           # Regenerate Prisma client
npx prisma studio             # Database GUI
```

## Git Conventions

- Commit prefix: `feat:`, `fix:`, `refactor:`
- Branch naming: `fix/issue-name` or `feature/issue-name`

## Testing Checklist

Before marking complete: light/dark mode, Hebrew (RTL)/English (LTR), mobile, anonymous/logged-in/admin users, error & loading states.

## Reference Docs

Read these ONLY when relevant to your current task:

| Doc | When to read |
|-----|-------------|
| [`agent_docs/project-structure.md`](agent_docs/project-structure.md) | Finding files, understanding codebase layout, navigating directories |
| [`agent_docs/components.md`](agent_docs/components.md) | Building UI, creating forms, reusing existing components |
| [`agent_docs/patterns.md`](agent_docs/patterns.md) | Writing hooks, API routes, auth checks, React Query code |
| [`agent_docs/api-routes.md`](agent_docs/api-routes.md) | Working with API endpoints, knowing what routes exist |
| [`agent_docs/database.md`](agent_docs/database.md) | Modifying schema, writing Prisma queries, debugging DB issues |
| [`agent_docs/styling.md`](agent_docs/styling.md) | Styling components, handling RTL, responsive design |
| [`agent_docs/i18n.md`](agent_docs/i18n.md) | Adding or modifying translations |
| [`agent_docs/editor.md`](agent_docs/editor.md) | Working on the Tiptap rich text editor or utility functions |

_Last updated: February 2026_
