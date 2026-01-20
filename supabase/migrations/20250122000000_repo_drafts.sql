create table if not exists public.repo_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  github_repo_id bigint not null,
  full_name text not null,
  html_url text not null,
  description text,
  visibility text not null,
  default_branch text not null,
  pushed_at timestamptz,
  topics text[],
  imported_at timestamptz not null default now(),
  converted_project_id uuid references public.projects(id),
  converted_at timestamptz,
  unique (user_id, github_repo_id)
);

alter table public.repo_drafts enable row level security;

create policy "repo_drafts_select_own"
  on public.repo_drafts
  for select
  using (auth.uid() = user_id);

create policy "repo_drafts_insert_own"
  on public.repo_drafts
  for insert
  with check (auth.uid() = user_id);

create policy "repo_drafts_update_own"
  on public.repo_drafts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
