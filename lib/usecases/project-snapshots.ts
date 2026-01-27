import "server-only";

import type {
  ProjectSnapshot,
  ProjectSnapshotsPort,
} from "@/lib/usecases/ports";

export async function fetchProjectSnapshots(
  port: ProjectSnapshotsPort,
  projectId: string,
): Promise<ProjectSnapshot[]> {
  if (!projectId) {
    throw new Error("Project id is required.");
  }

  return port.fetchProjectSnapshots(projectId);
}
