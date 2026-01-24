alter table public.projects
  add column if not exists last_reviewed_at timestamptz;
