import "server-only";

import { createClient } from "../supabase/server";
import type { Database } from "../supabase/types";

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

  const { data: projectResult, error: convertError } = await supabase
    .rpc("convert_repo_draft_to_project", {
      draft_id: id,
      project_name: input.name.trim(),
      next_action: input.nextAction.trim(),
      finish_definition: input.finishDefinition ?? null,
    })
    .single();

  if (convertError) {
    throw new Error(`Failed to convert draft: ${convertError.message}`);
  }

  if (!projectResult?.project_id) {
    throw new Error("Draft conversion failed.");
  }

  return projectResult.project_id;
}
