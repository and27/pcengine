create or replace function public.convert_repo_draft_to_project_service(
  draft_id uuid,
  user_id uuid,
  project_name text,
  next_action text,
  finish_definition text
)
returns table (project_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  draft_record public.repo_drafts;
  trimmed_name text := btrim(project_name);
  trimmed_next_action text := btrim(next_action);
  new_project_id uuid;
begin
  if trimmed_name is null or trimmed_name = '' then
    raise exception 'Project name is required.';
  end if;

  if trimmed_next_action is null or trimmed_next_action = '' then
    raise exception 'Next action is required.';
  end if;

  if char_length(trimmed_next_action) > 140 then
    raise exception 'Next action must be at most 140 characters.';
  end if;

  select * into draft_record
    from public.repo_drafts
    where id = draft_id
      and user_id = convert_repo_draft_to_project_service.user_id
      and converted_project_id is null
    for update;

  if not found then
    raise exception 'Draft not found or already converted.';
  end if;

  insert into public.projects (
    name,
    narrative_link,
    finish_definition,
    status,
    next_action,
    start_date,
    finish_date
  )
  values (
    trimmed_name,
    draft_record.html_url,
    finish_definition,
    'frozen',
    trimmed_next_action,
    null,
    null
  )
  returning id into new_project_id;

  update public.repo_drafts
    set converted_project_id = new_project_id,
        converted_at = now()
    where id = draft_id;

  return query select new_project_id as project_id;
end;
$$;
