import "server-only";

import type { Database } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  RepoDraft,
  RepoDraftConversionInput,
  RepoDraftImport,
  RepoDraftsPort,
  UserContext,
} from "@/lib/usecases/ports";

type RepoDraftRow = Database["public"]["Tables"]["repo_drafts"]["Row"];

function toRepoDraft(row: RepoDraftRow): RepoDraft {
  return {
    id: row.id,
    userId: row.user_id,
    githubRepoId: row.github_repo_id,
    fullName: row.full_name,
    htmlUrl: row.html_url,
    description: row.description,
    visibility: row.visibility,
    defaultBranch: row.default_branch,
    pushedAt: row.pushed_at,
    topics: row.topics,
    importedAt: row.imported_at,
    convertedProjectId: row.converted_project_id,
    convertedAt: row.converted_at,
  };
}

export const supabaseRepoDraftsAdapter: RepoDraftsPort = {
  async upsertRepoDrafts(context: UserContext, drafts: RepoDraftImport[]) {
    if (drafts.length === 0) {
      return 0;
    }

    if (!context.userId) {
      throw new Error("Missing user id.");
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const payload = drafts.map((draft) => ({
      user_id: context.userId,
      github_repo_id: draft.githubRepoId,
      full_name: draft.fullName,
      html_url: draft.htmlUrl,
      description: draft.description,
      visibility: draft.visibility,
      default_branch: draft.defaultBranch,
      pushed_at: draft.pushedAt,
      topics: draft.topics ?? null,
      imported_at: now,
    }));

    const { error } = await supabase
      .from("repo_drafts")
      .upsert(payload, { onConflict: "user_id,github_repo_id" });

    if (error) {
      throw new Error(`Failed to import drafts: ${error.message}`);
    }

    return payload.length;
  },

  async fetchRepoDrafts(context: UserContext) {
    if (!context.userId) {
      throw new Error("Missing user id.");
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("repo_drafts")
      .select("*")
      .eq("user_id", context.userId)
      .order("imported_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load drafts: ${error.message}`);
    }

    return (data ?? []).map(toRepoDraft);
  },

  async fetchRepoDraftById(context: UserContext, id: string) {
    if (!context.userId) {
      throw new Error("Missing user id.");
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("repo_drafts")
      .select("*")
      .eq("user_id", context.userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load draft: ${error.message}`);
    }

    return data ? toRepoDraft(data) : null;
  },

  async convertRepoDraft(
    context: UserContext,
    id: string,
    input: RepoDraftConversionInput,
  ) {
    if (!context.userId) {
      throw new Error("Missing user id.");
    }

    const supabase = createServiceClient();
    const { data: projectResult, error: convertError } = await supabase
      .rpc("convert_repo_draft_to_project_service", {
        draft_id: id,
        p_user_id: context.userId,
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
  },
};
