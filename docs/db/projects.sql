create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  narrative_link text,
  why_now text,
  finish_definition text,
  status text not null check (status in ('active', 'frozen', 'archived')),
  next_action text not null check (char_length(trim(next_action)) <= 140),
  start_date timestamptz default now(),
  finish_date timestamptz
);
