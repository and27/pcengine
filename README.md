# andreu-template — Agent-ready Next.js + Supabase Starter

A reusable Next.js (App Router) + Supabase starter designed for multi-agent work: a Builder ships small PRs from Issues, a Reviewer (Codex GitHub review) validates them, and progress is tracked via GitHub Issues with `status:*` labels. This repo is template infrastructure only — no product/domain yet.

## Quick start

```bash
pnpm install
```

1) Create `.env.local` from `.env.example`.
2) Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy anon key is acceptable)

```bash
pnpm dev
```

Run gates (lint + typecheck + build):

```bash
pnpm verify
```

## Template workflow

- Operating rules: `AGENTS.md`
- PR template: `.github/pull_request_template.md`
- ADRs: `docs/adr/`

## Creating a new project from this template

1) Use GitHub “Use this template” to create a new repo.
2) Clone the new repo.
3) Update `PROJECT.json` with project metadata (name/product/domain).

## Status labels (GitHub Issues)

- `status:backlog`
- `status:ready`
- `status:in-progress`
- `status:review`
- `status:review-fixes`
- `status:blocked`
- `status:done`

Only `status:ready` issues are eligible for execution.

## Deploy

Recommended: Vercel + Supabase integration for a fast, managed deployment path.
