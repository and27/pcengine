create or replace function public.freeze_project_with_snapshot(
  project_id uuid,
  snapshot_summary text,
  snapshot_label text,
  snapshot_left_out text,
  snapshot_future_note text
)
returns public.projects
language plpgsql
as $$
declare
  updated_project public.projects;
begin
  if snapshot_summary is null or char_length(trim(snapshot_summary)) = 0 then
    raise exception 'Snapshot summary required.';
  end if;

  update public.projects
    set status = 'frozen'
    where id = project_id
      and status = 'active'
    returning * into updated_project;

  if not found then
    raise exception 'Project status changed before update; please refresh and try again.';
  end if;

  insert into public.project_snapshots (
    project_id,
    kind,
    label,
    summary,
    left_out,
    future_note
  )
  values (
    project_id,
    'freeze',
    snapshot_label,
    snapshot_summary,
    snapshot_left_out,
    snapshot_future_note
  );

  return updated_project;
end;
$$;

create or replace function public.finish_project_with_snapshot(
  project_id uuid,
  snapshot_summary text,
  snapshot_label text,
  snapshot_left_out text,
  snapshot_future_note text
)
returns public.projects
language plpgsql
as $$
declare
  updated_project public.projects;
begin
  if snapshot_summary is null or char_length(trim(snapshot_summary)) = 0 then
    raise exception 'Snapshot summary required.';
  end if;

  update public.projects
    set status = 'archived',
        finish_date = coalesce(finish_date, now())
    where id = project_id
      and status in ('active', 'frozen')
    returning * into updated_project;

  if not found then
    raise exception 'Project status changed before update; please refresh and try again.';
  end if;

  insert into public.project_snapshots (
    project_id,
    kind,
    label,
    summary,
    left_out,
    future_note
  )
  values (
    project_id,
    'finish',
    snapshot_label,
    snapshot_summary,
    snapshot_left_out,
    snapshot_future_note
  );

  return updated_project;
end;
$$;
