create table if not exists public.project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('freeze', 'finish')),
  label text,
  summary text not null check (char_length(trim(summary)) > 0),
  left_out text,
  future_note text,
  created_at timestamptz not null default now()
);

create index if not exists project_snapshots_project_id_idx
  on public.project_snapshots (project_id);
