# Smoke Test - Persistence Ports Wiring

Goal: Verify that the app still works end-to-end after routing data access
through persistence ports and adapters.

## Preconditions

- Valid Supabase env vars in `.env.local`
- Existing user account

## Checklist

1. Login.
2. Open `/protected` and confirm:
   - Board loads without errors.
   - Projects grouped by status.
3. Create a new project at `/protected/projects/new`.
4. Run lifecycle actions:
   - Freeze (with snapshot)
   - Finish (with snapshot)
   - Archive (no snapshot)
   - Launch (from Frozen)
5. Open project detail and confirm snapshots show up.
6. Review mode:
   - Visit `/protected?review=1`
   - Apply a decision and confirm last reviewed updates.
7. GitHub import:
   - Connect GitHub.
   - Import at least one repo.
   - View drafts list and draft detail.
   - Convert a draft into a project.

## Expected results

- No runtime errors.
- All actions persist correctly.
- Draft conversion creates a new project.
