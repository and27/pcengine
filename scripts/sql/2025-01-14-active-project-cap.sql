create or replace function public.create_project_with_active_cap(
  name text,
  narrative_link text,
  why_now text,
  finish_definition text,
  status text,
  next_action text,
  start_date timestamptz,
  finish_date timestamptz,
  max_active integer
)
returns public.projects
language plpgsql
as $$
declare
  active_count integer;
  new_project public.projects;
begin
  if status = 'active' then
    perform pg_advisory_xact_lock(hashtext('active_project_cap'));

    select count(*) into active_count
      from public.projects
      where status = 'active';

    if active_count >= max_active then
      raise exception 'Active project limit reached (%). Freeze or finish a project before launching another.', max_active;
    end if;
  end if;

  insert into public.projects (
    name,
    narrative_link,
    why_now,
    finish_definition,
    status,
    next_action,
    start_date,
    finish_date
  )
  values (
    name,
    narrative_link,
    why_now,
    finish_definition,
    status,
    next_action,
    start_date,
    finish_date
  )
  returning * into new_project;

  return new_project;
end;
$$;

create or replace function public.launch_project_with_active_cap(
  project_id uuid,
  max_active integer
)
returns public.projects
language plpgsql
as $$
declare
  active_count integer;
  updated_project public.projects;
begin
  perform pg_advisory_xact_lock(hashtext('active_project_cap'));

  select count(*) into active_count
    from public.projects
    where status = 'active';

  if active_count >= max_active then
    raise exception 'Active project limit reached (%). Freeze or finish a project before launching another.', max_active;
  end if;

  update public.projects
    set status = 'active',
        start_date = coalesce(start_date, now())
    where id = project_id
      and status = 'frozen'
    returning * into updated_project;

  if not found then
    raise exception 'Project status changed before update; please refresh and try again.';
  end if;

  return updated_project;
end;
$$;
