import type {
  NewProjectInput,
  Project,
  ProjectStatus,
  UpdateProjectInput,
} from "@/lib/domain/project";

export type ProjectSnapshotInput = {
  summary: string;
  label?: string | null;
  leftOut?: string | null;
  futureNote?: string | null;
};

export type OverrideDecisionInput = {
  reason: string;
  tradeOff: string;
};

export type OverrideActiveCapInput = {
  launchProjectId: string;
  freezeProjectId: string;
  snapshot: ProjectSnapshotInput;
  decision: OverrideDecisionInput;
  maxActive: number;
};

export interface ProjectsPort {
  createProject(
    input: NewProjectInput,
    options: { enforceActiveCap: boolean; maxActive: number },
  ): Promise<Project>;
  updateProject(id: string, updates: UpdateProjectInput): Promise<Project>;
  fetchProjectById(id: string): Promise<Project | null>;
  freezeProjectWithSnapshot(
    id: string,
    snapshot: ProjectSnapshotInput,
  ): Promise<Project>;
  finishProjectWithSnapshot(
    id: string,
    snapshot: ProjectSnapshotInput,
  ): Promise<Project>;
  launchProjectWithActiveCap(id: string, maxActive: number): Promise<Project>;
  archiveProject(
    id: string,
    expectedStatus: ProjectStatus,
  ): Promise<Project | null>;
  overrideActiveCapWithFreeze(input: OverrideActiveCapInput): Promise<Project>;
  restartArchivedProject(
    projectId: string,
    nextAction: string,
  ): Promise<Project>;
  deleteArchivedProject(id: string): Promise<boolean>;
}
