import "server-only";

import type {
  NewProjectInput,
  Project,
  ProjectStatus,
  UpdateProjectInput,
} from "@/lib/domain/project";
import type { Database } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  OverrideActiveCapInput,
  ProjectSnapshotInput,
  ProjectsPort,
} from "@/lib/usecases/ports";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

const DEFAULT_STATUS: ProjectStatus = "active";

type SnapshotPayload = {
  summary: string;
  label: string | null;
  leftOut: string | null;
  futureNote: string | null;
};

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    narrativeLink: row.narrative_link,
    whyNow: row.why_now,
    finishDefinition: row.finish_definition,
    status: row.status,
    nextAction: row.next_action,
    startDate: row.start_date,
    finishDate: row.finish_date,
    lastReviewedAt: row.last_reviewed_at,
  };
}

function normalizeSnapshotValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildSnapshotPayload(input: ProjectSnapshotInput): SnapshotPayload {
  return {
    summary: input.summary.trim(),
    label: normalizeSnapshotValue(input.label),
    leftOut: normalizeSnapshotValue(input.leftOut),
    futureNote: normalizeSnapshotValue(input.futureNote),
  };
}

function buildProjectInsert(input: NewProjectInput): ProjectInsert {
  const status = input.status ?? DEFAULT_STATUS;

  return {
    name: input.name.trim(),
    narrative_link: input.narrativeLink ?? null,
    why_now: input.whyNow ?? null,
    finish_definition: input.finishDefinition ?? null,
    status,
    next_action: input.nextAction.trim(),
    start_date: status === "active" ? new Date().toISOString() : null,
    finish_date: null,
    last_reviewed_at: null,
  };
}

function buildProjectUpdate(input: UpdateProjectInput): ProjectUpdate {
  const update: ProjectUpdate = {};

  if (input.name !== undefined) {
    update.name = input.name.trim();
  }

  if (input.narrativeLink !== undefined) {
    update.narrative_link = input.narrativeLink ?? null;
  }

  if (input.whyNow !== undefined) {
    update.why_now = input.whyNow ?? null;
  }

  if (input.finishDefinition !== undefined) {
    update.finish_definition = input.finishDefinition ?? null;
  }

  if (input.status !== undefined) {
    update.status = input.status;
  }

  if (input.nextAction !== undefined) {
    update.next_action = input.nextAction.trim();
  }

  if (input.lastReviewedAt !== undefined) {
    update.last_reviewed_at = input.lastReviewedAt ?? null;
  }

  return update;
}

export const supabaseProjectsAdapter: ProjectsPort = {
  async createProject(input, options) {
    const supabase = createServiceClient();
    const insert = buildProjectInsert(input);
    const enforceCap = options.enforceActiveCap && insert.status === "active";

    const { data, error } = enforceCap
      ? await supabase
          .rpc("create_project_with_active_cap", {
            finish_definition: insert.finish_definition ?? null,
            finish_date: insert.finish_date ?? null,
            max_active: options.maxActive,
            name: insert.name,
            narrative_link: insert.narrative_link ?? null,
            next_action: insert.next_action,
            start_date: insert.start_date ?? null,
            status: insert.status,
            why_now: insert.why_now ?? null,
          })
          .single()
      : await supabase.from("projects").insert(insert).select("*").single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    if (!data) {
      throw new Error("Project creation failed; no data returned.");
    }

    return toProject(data);
  },

  async fetchProjects() {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("start_date", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(`Failed to load projects: ${error.message}`);
    }

    return (data ?? []).map(toProject);
  },

  async updateProject(id, updates) {
    const supabase = createServiceClient();
    const update = buildProjectUpdate(updates);

    const { data, error } = await supabase
      .from("projects")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }

    return toProject(data);
  },

  async fetchProjectById(id) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data ? toProject(data) : null;
  },

  async freezeProjectWithSnapshot(id, snapshot) {
    const supabase = createServiceClient();
    const payload = buildSnapshotPayload(snapshot);
    const { data, error } = await supabase
      .rpc("freeze_project_with_snapshot", {
        project_id: id,
        snapshot_summary: payload.summary,
        snapshot_label: payload.label,
        snapshot_left_out: payload.leftOut,
        snapshot_future_note: payload.futureNote,
      })
      .single();

    if (error) {
      throw new Error(`Failed to freeze project: ${error.message}`);
    }

    if (!data) {
      throw new Error(
        "Project status changed before update; please refresh and try again.",
      );
    }

    return toProject(data);
  },

  async finishProjectWithSnapshot(id, snapshot) {
    const supabase = createServiceClient();
    const payload = buildSnapshotPayload(snapshot);
    const { data, error } = await supabase
      .rpc("finish_project_with_snapshot", {
        project_id: id,
        snapshot_summary: payload.summary,
        snapshot_label: payload.label,
        snapshot_left_out: payload.leftOut,
        snapshot_future_note: payload.futureNote,
      })
      .single();

    if (error) {
      throw new Error(`Failed to finish project: ${error.message}`);
    }

    if (!data) {
      throw new Error(
        "Project status changed before update; please refresh and try again.",
      );
    }

    return toProject(data);
  },

  async launchProjectWithActiveCap(id, maxActive) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .rpc("launch_project_with_active_cap", {
        max_active: maxActive,
        project_id: id,
      })
      .single();

    if (error) {
      if (error.message === "ACTIVE_CAP_REACHED") {
        throw new Error("ACTIVE_CAP_REACHED");
      }
      throw new Error(`Failed to launch project: ${error.message}`);
    }

    if (!data) {
      throw new Error(
        "Project status changed before update; please refresh and try again.",
      );
    }

    return toProject(data);
  },

  async archiveProject(id, expectedStatus) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("status", expectedStatus)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to archive project: ${error.message}`);
    }

    return data ? toProject(data) : null;
  },

  async overrideActiveCapWithFreeze(input: OverrideActiveCapInput) {
    const supabase = createServiceClient();
    const payload = buildSnapshotPayload(input.snapshot);
    const { data, error } = await supabase
      .rpc("override_active_cap_with_freeze", {
        project_to_launch_id: input.launchProjectId,
        project_to_freeze_id: input.freezeProjectId,
        snapshot_summary: payload.summary,
        snapshot_label: payload.label,
        snapshot_left_out: payload.leftOut,
        snapshot_future_note: payload.futureNote,
        decision_reason: input.decision.reason.trim(),
        decision_trade_off: input.decision.tradeOff.trim(),
        max_active: input.maxActive,
      })
      .single();

    if (error) {
      throw new Error(`Failed to override active cap: ${error.message}`);
    }

    if (!data) {
      throw new Error("Override failed; no data returned.");
    }

    return toProject(data);
  },

  async restartArchivedProject(projectId, nextAction) {
    const supabase = createServiceClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError) {
      throw new Error(`Failed to load project: ${projectError.message}`);
    }

    if (!project) {
      throw new Error("Project not found.");
    }

    if (project.status !== "archived") {
      throw new Error("Only archived projects can be restarted.");
    }

    const insert: ProjectInsert = {
      name: project.name,
      narrative_link: project.narrative_link,
      why_now: project.why_now,
      finish_definition: project.finish_definition,
      status: "frozen",
      next_action: nextAction.trim(),
      start_date: null,
      finish_date: null,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(insert)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to restart project: ${error.message}`);
    }

    if (!data) {
      throw new Error("Project restart failed; no data returned.");
    }

    return toProject(data);
  },

  async deleteArchivedProject(id) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("status", "archived")
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }

    return !!data;
  },
};
