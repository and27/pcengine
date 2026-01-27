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
- [x] PCE-006 (redefinido) - Create Project flow + onboarding
- [x] PCE-007 - Home route points to the app (small UX fix)
- [x] PCE-008 - Lifecycle action errors show toast (Sonner)

## Epic 2 — GitHub Import as Drafts (V0.2)

Goal: Import repos as drafts without auto-creating projects.

### Tickets

- [x] PCE-100 GitHub integration storage + security baseline
- [x] PCE-101 GitHub OAuth
- [x] PCE-102 List & select repos (Vercel-style)
- [x] PCE-103 Store imported drafts
- [x] PCE-104 Convert draft → Project (manual)

## Epic 3 - UX & Continuity (V1)

Goal: Improve visibility when managing many projects.

### Tickets

- [x] PCE-201 Dashboard board view (columns)
- [x] PCE-202 Post-create redirect & feedback
- [x] PCE-203 Restart archived project as new cycle
- [x] PCE-204 Delete archived projects (manual cleanup)

## Epic 4 - Insights & Review (V1.1)

Goal: Add lightweight insights and a review flow, plus mobile responsiveness polish.

### Tickets

- [x] PCE-301 Insights overview (status counts + active cap)
- [x] PCE-302 Review mode (weekly checklist + stale next actions)
- [x] PCE-303 Review history (last reviewed timestamp per project)
- [x] PCE-304 Mobile responsiveness pass (dashboard, drafts, forms)

## Epic 5 - Persistence Ports + Supabase Adapter (V1.2)

Goal: Decouple use-cases from Supabase so persistence can be swapped later.

### Tickets

- [ ] PCE-401 Define persistence ports (interfaces) for current use-cases.
- [ ] PCE-402 Implement Supabase adapters behind the ports.
- [ ] PCE-403 Refactor use-cases to depend only on ports.
- [ ] PCE-404 Align tests and smoke checks after the refactor.
