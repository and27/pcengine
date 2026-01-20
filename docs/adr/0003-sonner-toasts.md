# ADR 0003: Use Sonner for client-side toast alerts

## Context

Lifecycle actions can fail (e.g., active project cap). The current server action
flow surfaced errors by redirecting with query params, which clutters the URL
and breaks the UX. We need a lightweight client-side toast for error messages.
New dependencies require an ADR.

## Decision

Adopt `sonner` to display client-side toast notifications. Add a global toaster
in the root layout and use it in lifecycle action buttons.

## Alternatives considered

- Inline alert via query params: simple but pollutes the URL and requires reload.
- Custom toast component: more maintenance for a common UI pattern.
- Radix-based toast: larger setup than needed for the current scope.

## Consequences

- Adds a small dependency (`sonner`) and a global toaster in the layout.
- Errors can be shown without navigation or URL changes.
