# ADR 0004: Introduce persistence ports and adapters

## Context

The current codebase couples use-cases directly to Supabase clients and types.
This makes the persistence layer hard to replace and increases the cost of
moving to another Postgres provider (ex: Railway) later. We want to keep
Supabase for now while designing the app so persistence can be swapped without
rewriting core use-cases.

## Decision

Introduce explicit persistence ports (interfaces) for use-cases and implement
Supabase adapters behind those ports. Use-cases will depend only on the ports,
not on Supabase clients or types.
Auth/session resolution stays outside persistence (use-cases receive user
context/userId; adapters do not call Supabase auth).

## Alternatives considered

- Keep direct Supabase usage in use-cases and accept provider lock-in.
- Rewrite immediately to a new provider (higher risk, more work now).

## Consequences

- Adds a thin abstraction layer (ports + adapters) and some up-front refactor.
- Reduces lock-in and lowers the cost of migrating to another Postgres
  provider later.
- Requires a clear boundary between domain/use-cases and infrastructure.
