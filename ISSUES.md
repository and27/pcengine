# Issues

## Epic 5 - Persistence Ports + Supabase Adapter (V1.2)

Goal: Decouple use-cases from Supabase so persistence can be swapped later.

### PCE-401 Define persistence ports (interfaces)

Goal: Add explicit persistence ports that use-cases can depend on.

Scope:
- Define TypeScript interfaces for each use-case area (projects, project snapshots,
  GitHub connections, repo drafts).
- Decide and document port module location (ex: `lib/usecases/ports/`).
- Ensure ports accept user context/userId as input (auth stays outside persistence).

Out of scope:
- Supabase implementation details.

Acceptance criteria:
- Ports are defined with no Supabase imports or types.
- Ports describe all methods currently used by use-cases.
- Ports require user context/userId in method signatures where needed.

### PCE-402 Implement Supabase adapters behind the ports

Goal: Provide Supabase-backed implementations for the new ports.

Scope:
- Implement adapters that satisfy the ports using existing Supabase clients.
- Keep auth in the calling layer (adapters do not call `auth.getClaims()`).

Out of scope:
- Refactor use-cases to consume the ports (handled in PCE-403).

Acceptance criteria:
- Each port has a working Supabase adapter.
- Adapters compile without changing use-cases yet.

### PCE-403 Refactor use-cases to depend only on ports

Goal: Remove direct Supabase usage from use-cases.

Scope:
- Update `lib/usecases/*.ts` to accept ports via dependency injection (function params
  or a factory module).
- Move auth resolution to the calling layer and pass userId/context into use-cases.

Out of scope:
- UI changes not required for wiring the new ports.

Acceptance criteria:
- `lib/usecases/*` has no Supabase imports.
- All use-cases compile and run using port interfaces.
- Supabase is only referenced in adapter/infrastructure modules.

### PCE-404 Align tests and smoke checks after refactor

Goal: Ensure behavior is unchanged after the decoupling.

Scope:
- Update any existing tests or add minimal coverage for ports/adapters if none exist.
- Re-run smoke test flow and update notes if needed.

Acceptance criteria:
- App smoke flow still works end-to-end.
- Any test or smoke documentation is updated to reflect the new wiring.
