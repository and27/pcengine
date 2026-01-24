create table if not exists public.project_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  decision_type text not null check (decision_type in ('override')),
  reason text not null check (char_length(trim(reason)) > 0),
  trade_off text not null check (char_length(trim(trade_off)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists project_decisions_project_id_idx
  on public.project_decisions (project_id);
