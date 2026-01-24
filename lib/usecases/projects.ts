import {
  assertNextAction,
  assertProjectName,
  assertProjectStatus,
  type NewProjectInput,
  type Project,
  type ProjectStatus,
  type UpdateProjectInput,
} from "../domain/project";
import { createClient } from "../supabase/server";
import type { Database } from "../supabase/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

const DEFAULT_STATUS: ProjectStatus = "active";
export type LifecycleAction = "launch" | "freeze" | "archive" | "finish";

const ACTION_ALLOWED_STATUSES: Record<LifecycleAction, ProjectStatus[]> = {
  launch: ["frozen"],
  freeze: ["active"],
  archive: ["active", "frozen"],
  finish: ["active", "frozen"],
};
const ACTIVE_PROJECT_LIMIT = 3;

export type ProjectSnapshotInput = {
  summary: string;
  label?: string | null;
  leftOut?: string | null;
  futureNote?: string | null;
};

type SnapshotPayload = {
  summary: string;
  label: string | null;
  leftOut: string | null;
  futureNote: string | null;
};

function normalizeSnapshotValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildSnapshotPayload(input: ProjectSnapshotInput): SnapshotPayload {
  if (typeof input.summary !== "string" || input.summary.trim().length === 0) {
    throw new Error("Snapshot summary is required.");
  }

  return {
    summary: input.summary.trim(),
    label: normalizeSnapshotValue(input.label),
    leftOut: normalizeSnapshotValue(input.leftOut),
    futureNote: normalizeSnapshotValue(input.futureNote),
  };
}

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

function buildProjectInsert(input: NewProjectInput): ProjectInsert {
  assertProjectName(input.name);
  assertNextAction(input.nextAction);

  const status = input.status ?? DEFAULT_STATUS;
  assertProjectStatus(status);

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
    assertProjectName(input.name);
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
    assertProjectStatus(input.status);
    update.status = input.status;
  }

  if (input.nextAction !== undefined) {
    assertNextAction(input.nextAction);
    update.next_action = input.nextAction.trim();
  }

  if (input.lastReviewedAt !== undefined) {
    update.last_reviewed_at = input.lastReviewedAt ?? null;
  }

  return update;
}

export async function createProject(input: NewProjectInput): Promise<Project> {
  const supabase = await createClient();
  const insert = buildProjectInsert(input);
  const isActive = insert.status === "active";

  const { data, error } = isActive
    ? await supabase
        .rpc("create_project_with_active_cap", {
          finish_definition: insert.finish_definition ?? null,
          finish_date: insert.finish_date ?? null,
          max_active: ACTIVE_PROJECT_LIMIT,
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
}

export async function updateProject(
  id: string,
  updates: UpdateProjectInput,
): Promise<Project> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  const supabase = await createClient();
  const update = buildProjectUpdate(updates);

  if (Object.keys(update).length === 0) {
    throw new Error("No project updates provided.");
  }

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
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  return data ? toProject(data) : null;
}

export async function applyLifecycleAction(
  id: string,
  action: LifecycleAction,
  snapshot?: ProjectSnapshotInput,
): Promise<Project> {
  const project = await fetchProjectById(id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (!ACTION_ALLOWED_STATUSES[action].includes(project.status)) {
    throw new Error(`Cannot ${action} a ${project.status} project.`);
  }

  if (action === "freeze" || action === "finish") {
    if (!snapshot) {
      throw new Error("Snapshot is required for this action.");
    }

    const payload = buildSnapshotPayload(snapshot);
    const supabase = await createClient();
    const rpcName =
      action === "freeze"
        ? "freeze_project_with_snapshot"
        : "finish_project_with_snapshot";
    const { data, error } = await supabase
      .rpc(rpcName, {
        project_id: id,
        snapshot_summary: payload.summary,
        snapshot_label: payload.label,
        snapshot_left_out: payload.leftOut,
        snapshot_future_note: payload.futureNote,
      })
      .single();

    if (error) {
      throw new Error(`Failed to ${action} project: ${error.message}`);
    }

    if (!data) {
      throw new Error(
        "Project status changed before update; please refresh and try again.",
      );
    }

    return toProject(data);
  }

  const update: ProjectUpdate = {};
  const now = new Date().toISOString();

  switch (action) {
    case "launch": {
      update.status = "active";
      if (!project.startDate) {
        update.start_date = now;
      }
      break;
    }
    case "archive": {
      update.status = "archived";
      break;
    }
  }

  const supabase = await createClient();
  const { data, error } =
    action === "launch"
      ? await supabase
          .rpc("launch_project_with_active_cap", {
            max_active: ACTIVE_PROJECT_LIMIT,
            project_id: id,
          })
          .single()
      : await supabase
          .from("projects")
          .update(update)
          .eq("id", id)
          .eq("status", project.status)
          .select("*")
          .maybeSingle();

  if (error) {
    throw new Error(`Failed to ${action} project: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "Project status changed before update; please refresh and try again.",
    );
  }

  return toProject(data);
}

export async function restartArchivedProject(
  id: string,
  nextAction: string,
): Promise<Project> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  assertNextAction(nextAction);

  const project = await fetchProjectById(id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.status !== "archived") {
    throw new Error("Only archived projects can be restarted.");
  }

  assertProjectName(project.name);

  const insert: ProjectInsert = {
    name: project.name,
    narrative_link: project.narrativeLink,
    why_now: project.whyNow,
    finish_definition: project.finishDefinition,
    status: "frozen",
    next_action: nextAction.trim(),
    start_date: null,
    finish_date: null,
  };

  const supabase = await createClient();
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
}

export async function deleteArchivedProject(id: string): Promise<void> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  const project = await fetchProjectById(id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.status !== "archived") {
    throw new Error("Only archived projects can be deleted.");
  }

  const supabase = await createClient();
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

  if (!data) {
    throw new Error(
      "Project status changed before deletion; please refresh and try again.",
    );
  }
}
