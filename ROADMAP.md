# PCE — Roadmap V0

## V0 Finish Definition

PCE V0 is considered complete when:

- I can create, run, and close a project with explicit Launch → Finish.
- The system enforces a maximum of 3 Active projects.
- At least 1 real project is taken from Launch to Finished using PCE (no simulations).
- I can clearly decide whether this model reduces dispersion or not.

Anything beyond this is out of scope for V0.

## Epic 1 — Core Project Lifecycle (V0)

Goal: Manage projects as finite narratives with clear start, execution, and closure.

### Tickets

- [x] PCE-001 Project domain model + persistence
- [x] PCE-002 Project list (Active / Frozen / Archived)
- [x] PCE-003 Project detail & edit fields
- [x] PCE-004 Lifecycle actions: Launch / Finish / Freeze / Archive
- [x] PCE-005 Enforce max 3 Active projects (hard rule)
- [x] PCE-006 Smoke test + V0 release notes

## Epic 2 — GitHub Import as Drafts (V0.2)

Goal: Import repos as drafts without auto-creating projects.

### Tickets

- [ ] PCE-101 GitHub OAuth
- [ ] PCE-102 List & select repos (Vercel-style)
- [ ] PCE-103 Store imported drafts
- [ ] PCE-104 Convert draft → Project (manual)
