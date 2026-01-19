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
    start_date: new Date().toISOString(),
    finish_date: null,
  };
}

async function ensureActiveProjectSlotAvailable() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to check active projects: ${error.message}`);
  }

  if ((count ?? 0) >= ACTIVE_PROJECT_LIMIT) {
    throw new Error(
      `Active project limit reached (${ACTIVE_PROJECT_LIMIT}). Freeze or finish a project before launching another.`,
    );
  }
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

  return update;
}

export async function createProject(input: NewProjectInput): Promise<Project> {
  if ((input.status ?? DEFAULT_STATUS) === "active") {
    await ensureActiveProjectSlotAvailable();
  }

  const supabase = await createClient();
  const insert = buildProjectInsert(input);

  const { data, error } = await supabase
    .from("projects")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
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
): Promise<Project> {
  const project = await fetchProjectById(id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (!ACTION_ALLOWED_STATUSES[action].includes(project.status)) {
    throw new Error(`Cannot ${action} a ${project.status} project.`);
  }

  const update: ProjectUpdate = {};
  const now = new Date().toISOString();

  switch (action) {
    case "launch": {
      await ensureActiveProjectSlotAvailable();
      update.status = "active";
      if (!project.startDate) {
        update.start_date = now;
      }
      break;
    }
    case "freeze": {
      update.status = "frozen";
      break;
    }
    case "archive": {
      update.status = "archived";
      break;
    }
    case "finish": {
      update.status = "archived";
      if (!project.finishDate) {
        update.finish_date = now;
      }
      break;
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
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
