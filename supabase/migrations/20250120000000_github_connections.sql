create table if not exists public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  github_user_id bigint not null,
  github_login text not null,
  access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.github_connections enable row level security;

create policy "github_connections_select_own"
  on public.github_connections
  for select
  using (auth.uid() = user_id);

create policy "github_connections_insert_own"
  on public.github_connections
  for insert
  with check (auth.uid() = user_id);

create policy "github_connections_update_own"
  on public.github_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
