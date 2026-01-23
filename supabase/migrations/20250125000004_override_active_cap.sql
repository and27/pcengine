create or replace function public.override_active_cap_with_freeze(
  project_to_launch_id uuid,
  project_to_freeze_id uuid,
  snapshot_summary text,
  snapshot_label text,
  snapshot_left_out text,
  snapshot_future_note text,
  decision_reason text,
  decision_trade_off text,
  max_active integer
)
returns public.projects
language plpgsql
as $$
declare
  active_count integer;
  frozen_project public.projects;
  launched_project public.projects;
begin
  if project_to_launch_id = project_to_freeze_id then
    raise exception 'Override projects must be different.';
  end if;

  if snapshot_summary is null or char_length(trim(snapshot_summary)) = 0 then
    raise exception 'Snapshot summary required.';
  end if;

  if decision_reason is null or char_length(trim(decision_reason)) = 0 then
    raise exception 'Decision reason required.';
  end if;

  if decision_trade_off is null or char_length(trim(decision_trade_off)) = 0 then
    raise exception 'Decision trade-off required.';
  end if;

  perform pg_advisory_xact_lock(hashtext('active_project_cap'));

  select count(*) into active_count
    from public.projects
    where status = 'active';

  if active_count < max_active then
    raise exception 'Override not required.';
  end if;

  update public.projects
    set status = 'frozen'
    where id = project_to_freeze_id
      and status = 'active'
    returning * into frozen_project;

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
    project_to_freeze_id,
    'freeze',
    snapshot_label,
    snapshot_summary,
    snapshot_left_out,
    snapshot_future_note
  );

  insert into public.project_decisions (
    project_id,
    decision_type,
    reason,
    trade_off
  )
  values (
    project_to_launch_id,
    'override',
    decision_reason,
    decision_trade_off
  );

  update public.projects
    set status = 'active',
        start_date = coalesce(start_date, now())
    where id = project_to_launch_id
      and status = 'frozen'
    returning * into launched_project;

  if not found then
    raise exception 'Project status changed before update; please refresh and try again.';
  end if;

  return launched_project;
end;
$$;
