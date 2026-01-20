import "server-only";

import { createClient } from "../supabase/server";
import type { Database } from "../supabase/types";
import { createProject } from "./projects";

type RepoDraftRow = Database["public"]["Tables"]["repo_drafts"]["Row"];

export type RepoDraftImport = {
  github_repo_id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  visibility: string;
  default_branch: string;
  pushed_at: string | null;
  topics?: string[] | null;
};

function getUserIdFromClaims(claims: Record<string, unknown> | null | undefined) {
  const sub = claims?.sub;
  return typeof sub === "string" ? sub : null;
}

export async function upsertRepoDrafts(
  drafts: RepoDraftImport[],
): Promise<number> {
  if (drafts.length === 0) {
    return 0;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    throw new Error("Not authenticated.");
  }

  const userId = getUserIdFromClaims(data.claims);

  if (!userId) {
    throw new Error("Missing user id.");
  }

  const now = new Date().toISOString();
  const payload = drafts.map((draft) => ({
    user_id: userId,
    github_repo_id: draft.github_repo_id,
    full_name: draft.full_name,
    html_url: draft.html_url,
    description: draft.description,
    visibility: draft.visibility,
    default_branch: draft.default_branch,
    pushed_at: draft.pushed_at,
    topics: draft.topics ?? null,
    imported_at: now,
  }));

  const { error: upsertError } = await supabase
    .from("repo_drafts")
    .upsert(payload, { onConflict: "user_id,github_repo_id" });

  if (upsertError) {
    throw new Error(`Failed to import drafts: ${upsertError.message}`);
  }

  return payload.length;
}

export async function fetchRepoDrafts(): Promise<RepoDraftRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    throw new Error("Not authenticated.");
  }

  const { data: drafts, error: draftsError } = await supabase
    .from("repo_drafts")
    .select("*")
    .order("imported_at", { ascending: false });

  if (draftsError) {
    throw new Error(`Failed to load drafts: ${draftsError.message}`);
  }

  return drafts ?? [];
}

export async function fetchRepoDraftById(
  id: string,
): Promise<RepoDraftRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    throw new Error("Not authenticated.");
  }

  const { data: draft, error: draftError } = await supabase
    .from("repo_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (draftError) {
    throw new Error(`Failed to load draft: ${draftError.message}`);
  }

  return draft ?? null;
}

export type RepoDraftConversionInput = {
  name: string;
  nextAction: string;
  finishDefinition?: string | null;
};

export async function convertRepoDraft(
  id: string,
  input: RepoDraftConversionInput,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    throw new Error("Not authenticated.");
  }

  const draft = await fetchRepoDraftById(id);

  if (!draft) {
    throw new Error("Draft not found.");
  }

  if (draft.converted_project_id) {
    throw new Error("Draft has already been converted.");
  }

  const project = await createProject({
    name: input.name.trim(),
    nextAction: input.nextAction.trim(),
    finishDefinition: input.finishDefinition ?? null,
    narrativeLink: draft.html_url,
    status: "frozen",
  });

  const now = new Date().toISOString();
  const { data: updatedDraft, error: updateError } = await supabase
    .from("repo_drafts")
    .update({
      converted_project_id: project.id,
      converted_at: now,
    })
    .eq("id", id)
    .is("converted_project_id", null)
    .select("*")
    .maybeSingle();

  if (updateError) {
    throw new Error(`Failed to mark draft as converted: ${updateError.message}`);
  }

  if (!updatedDraft) {
    throw new Error("Draft was already converted.");
  }

  return project.id;
}
