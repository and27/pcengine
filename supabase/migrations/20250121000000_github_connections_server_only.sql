drop policy if exists "github_connections_select_own" on public.github_connections;

create or replace function public.get_github_connection_state()
returns table (connected boolean, github_login text)
language sql
security definer
set search_path = public
as $$
  select (count(*) > 0) as connected,
         max(github_login) as github_login
    from public.github_connections
   where user_id = auth.uid();
$$;

grant execute on function public.get_github_connection_state() to authenticated;
