alter table public.repo_drafts
  drop constraint if exists repo_drafts_converted_project_id_fkey;

alter table public.repo_drafts
  add constraint repo_drafts_converted_project_id_fkey
  foreign key (converted_project_id)
  references public.projects(id)
  on delete set null;
