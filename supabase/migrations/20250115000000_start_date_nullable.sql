alter table public.projects
  alter column start_date drop not null;

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
  effective_start_date timestamptz := start_date;
begin
  if status = 'active' then
    perform pg_advisory_xact_lock(hashtext('active_project_cap'));

    select count(*) into active_count
      from public.projects
      where status = 'active';

    if active_count >= max_active then
      raise exception 'Active project limit reached (%). Freeze or finish a project before launching another.', max_active;
    end if;

    if effective_start_date is null then
      effective_start_date := now();
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
    effective_start_date,
    finish_date
  )
  returning * into new_project;

  return new_project;
end;
$$;
