# AGENTS — Operating Rules (andreu-template)

## Non-negotiables

- One PR = one Issue/ticket.
- Keep PRs small: target < 400 net lines.
- Do not introduce new dependencies without an ADR file in the PR.
- Do not start the next Epic until the current Epic is smoke-tested and merged.

## Required checks before marking PR "Ready for review"

- pnpm lint
- pnpm typecheck
- pnpm build (when relevant)

## Repo structure

- Routes/pages/layouts: `app/`
- Reusable UI: `components/`
- App logic / helpers: `lib/`
  - Domain types & invariants: `lib/domain/`
  - Use-cases / feature logic: `lib/usecases/` (or `lib/features/`)
  - External clients (supabase, github, etc.): `lib/clients/`
- Automation scripts: `scripts/`
- ADRs: `docs/adr/`

## PR expectations

- Include: what/why, how to test, risks, screenshots if UI.
- Link PR to the ticket: "Closes #<issue-number>".
- If changing architecture or adding dependencies, include an ADR in `docs/adr/`.
