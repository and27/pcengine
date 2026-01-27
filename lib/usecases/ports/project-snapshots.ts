export type ProjectSnapshotKind = "freeze" | "finish";

export type ProjectSnapshot = {
  id: string;
  projectId: string;
  kind: ProjectSnapshotKind;
  label: string | null;
  summary: string;
  leftOut: string | null;
  futureNote: string | null;
  createdAt: string;
};

export interface ProjectSnapshotsPort {
  fetchProjectSnapshots(projectId: string): Promise<ProjectSnapshot[]>;
}
