import "server-only";

import {
  assertNextAction,
  assertProjectName,
  assertProjectStatus,
  type NewProjectInput,
  type Project,
  type ProjectStatus,
  type UpdateProjectInput,
} from "@/lib/domain/project";
import type {
  OverrideDecisionInput,
  ProjectSnapshotInput,
  ProjectsPort,
} from "@/lib/usecases/ports";

export type { OverrideDecisionInput, ProjectSnapshotInput };

const DEFAULT_STATUS: ProjectStatus = "active";
export type LifecycleAction = "launch" | "freeze" | "archive" | "finish";

const ACTION_ALLOWED_STATUSES: Record<LifecycleAction, ProjectStatus[]> = {
  launch: ["frozen"],
  freeze: ["active"],
  archive: ["active", "frozen"],
  finish: ["active", "frozen"],
};
const ACTIVE_PROJECT_LIMIT = 3;

type SnapshotPayload = {
  summary: string;
  label: string | null;
  leftOut: string | null;
  futureNote: string | null;
};

type DecisionPayload = {
  reason: string;
  tradeOff: string;
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

function buildDecisionPayload(input: OverrideDecisionInput): DecisionPayload {
  if (typeof input.reason !== "string" || input.reason.trim().length === 0) {
    throw new Error("Decision reason is required.");
  }

  if (
    typeof input.tradeOff !== "string" ||
    input.tradeOff.trim().length === 0
  ) {
    throw new Error("Decision trade-off is required.");
  }

  return {
    reason: input.reason.trim(),
    tradeOff: input.tradeOff.trim(),
  };
}

function normalizeProjectInput(input: NewProjectInput): NewProjectInput {
  assertProjectName(input.name);
  assertNextAction(input.nextAction);

  const status = input.status ?? DEFAULT_STATUS;
  assertProjectStatus(status);

  return {
    name: input.name.trim(),
    narrativeLink: input.narrativeLink ?? null,
    whyNow: input.whyNow ?? null,
    finishDefinition: input.finishDefinition ?? null,
    status,
    nextAction: input.nextAction.trim(),
  };
}

function normalizeProjectUpdates(input: UpdateProjectInput): UpdateProjectInput {
  const update: UpdateProjectInput = {};

  if (input.name !== undefined) {
    assertProjectName(input.name);
    update.name = input.name.trim();
  }

  if (input.narrativeLink !== undefined) {
    update.narrativeLink = input.narrativeLink ?? null;
  }

  if (input.whyNow !== undefined) {
    update.whyNow = input.whyNow ?? null;
  }

  if (input.finishDefinition !== undefined) {
    update.finishDefinition = input.finishDefinition ?? null;
  }

  if (input.status !== undefined) {
    assertProjectStatus(input.status);
    update.status = input.status;
  }

  if (input.nextAction !== undefined) {
    assertNextAction(input.nextAction);
    update.nextAction = input.nextAction.trim();
  }

  if (input.lastReviewedAt !== undefined) {
    update.lastReviewedAt = input.lastReviewedAt ?? null;
  }

  return update;
}

export async function fetchProjects(port: ProjectsPort): Promise<Project[]> {
  return port.fetchProjects();
}

export async function createProject(
  port: ProjectsPort,
  input: NewProjectInput,
): Promise<Project> {
  const normalized = normalizeProjectInput(input);
  const enforceActiveCap = normalized.status === "active";

  return port.createProject(normalized, {
    enforceActiveCap,
    maxActive: ACTIVE_PROJECT_LIMIT,
  });
}

export async function updateProject(
  port: ProjectsPort,
  id: string,
  updates: UpdateProjectInput,
): Promise<Project> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  const update = normalizeProjectUpdates(updates);

  if (Object.keys(update).length === 0) {
    throw new Error("No project updates provided.");
  }

  return port.updateProject(id, update);
}

export async function fetchProjectById(
  port: ProjectsPort,
  id: string,
): Promise<Project | null> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  return port.fetchProjectById(id);
}

export async function applyLifecycleAction(
  port: ProjectsPort,
  id: string,
  action: LifecycleAction,
  snapshot?: ProjectSnapshotInput,
): Promise<Project> {
  const project = await fetchProjectById(port, id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (!ACTION_ALLOWED_STATUSES[action].includes(project.status)) {
    throw new Error(`Cannot ${action} a ${project.status} project.`);
  }

  if (action === "freeze") {
    if (!snapshot) {
      throw new Error("Snapshot is required for this action.");
    }

    return port.freezeProjectWithSnapshot(id, buildSnapshotPayload(snapshot));
  }

  if (action === "finish") {
    if (!snapshot) {
      throw new Error("Snapshot is required for this action.");
    }

    return port.finishProjectWithSnapshot(id, buildSnapshotPayload(snapshot));
  }

  if (action === "launch") {
    try {
      return await port.launchProjectWithActiveCap(id, ACTIVE_PROJECT_LIMIT);
    } catch (error) {
      if (error instanceof Error && error.message === "ACTIVE_CAP_REACHED") {
        throw error;
      }
      throw error;
    }
  }

  const archived = await port.archiveProject(id, project.status);

  if (!archived) {
    throw new Error(
      "Project status changed before update; please refresh and try again.",
    );
  }

  return archived;
}

export async function overrideActiveCap(
  port: ProjectsPort,
  launchProjectId: string,
  freezeProjectId: string,
  snapshot: ProjectSnapshotInput,
  decision: OverrideDecisionInput,
): Promise<Project> {
  if (!launchProjectId || !freezeProjectId) {
    throw new Error("Project id is required.");
  }

  if (launchProjectId === freezeProjectId) {
    throw new Error("Override requires two different projects.");
  }

  const snapshotPayload = buildSnapshotPayload(snapshot);
  const decisionPayload = buildDecisionPayload(decision);

  return port.overrideActiveCapWithFreeze({
    launchProjectId,
    freezeProjectId,
    snapshot: snapshotPayload,
    decision: decisionPayload,
    maxActive: ACTIVE_PROJECT_LIMIT,
  });
}

export async function restartArchivedProject(
  port: ProjectsPort,
  id: string,
  nextAction: string,
): Promise<Project> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  assertNextAction(nextAction);

  const project = await fetchProjectById(port, id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.status !== "archived") {
    throw new Error("Only archived projects can be restarted.");
  }

  assertProjectName(project.name);

  return port.restartArchivedProject(id, nextAction);
}

export async function deleteArchivedProject(
  port: ProjectsPort,
  id: string,
): Promise<void> {
  if (!id) {
    throw new Error("Project id is required.");
  }

  const project = await fetchProjectById(port, id);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.status !== "archived") {
    throw new Error("Only archived projects can be deleted.");
  }

  const deleted = await port.deleteArchivedProject(id);

  if (!deleted) {
    throw new Error(
      "Project status changed before deletion; please refresh and try again.",
    );
  }
}
