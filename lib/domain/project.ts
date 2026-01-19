export const PROJECT_STATUSES = ["active", "frozen", "archived"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: string;
  name: string;
  narrativeLink: string | null;
  whyNow: string | null;
  finishDefinition: string | null;
  status: ProjectStatus;
  nextAction: string;
  startDate: string;
  finishDate: string | null;
};

export type NewProjectInput = {
  name: string;
  narrativeLink?: string | null;
  whyNow?: string | null;
  finishDefinition?: string | null;
  status?: ProjectStatus;
  nextAction: string;
};

export type UpdateProjectInput = {
  name?: string;
  narrativeLink?: string | null;
  whyNow?: string | null;
  finishDefinition?: string | null;
  status?: ProjectStatus;
  nextAction?: string;
};

export const MAX_NEXT_ACTION_LENGTH = 140;

export function assertProjectStatus(
  status: string,
): asserts status is ProjectStatus {
  if (!PROJECT_STATUSES.includes(status as ProjectStatus)) {
    throw new Error(`Invalid project status: ${status}`);
  }
}

export function assertProjectName(name: string) {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Project name is required.");
  }
}

export function assertNextAction(nextAction: string) {
  if (typeof nextAction !== "string") {
    throw new Error("Next action must be a string.");
  }

  const trimmed = nextAction.trim();

  if (trimmed.length === 0) {
    throw new Error("Next action must not be empty.");
  }

  if (trimmed.length > MAX_NEXT_ACTION_LENGTH) {
    throw new Error(
      `Next action must be at most ${MAX_NEXT_ACTION_LENGTH} characters.`,
    );
  }
}
