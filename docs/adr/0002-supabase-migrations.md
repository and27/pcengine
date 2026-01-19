# ADR 0002: Adopt Supabase migrations in repo and CI

## Context

We now rely on database functions for enforcing the active project cap. The
pipeline can fail if those functions are not present in the target database.
We need a repeatable way to apply schema changes and keep CI green without
manual SQL steps.

## Decision

Adopt Supabase CLI migrations in the repo and run them in CI.

## Alternatives considered

- Keep manual SQL in docs/scripts and rely on human steps.
- Add a custom migration runner without Supabase CLI.

## Consequences

- Adds Supabase CLI as a dev dependency.
- CI will start a local Supabase stack and apply migrations.
- Schema changes must be added to `supabase/migrations/`.
