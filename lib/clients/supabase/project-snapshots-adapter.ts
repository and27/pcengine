import "server-only";

import type { Database } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  ProjectSnapshot,
  ProjectSnapshotsPort,
} from "@/lib/usecases/ports";

type ProjectSnapshotRow = Database["public"]["Tables"]["project_snapshots"]["Row"];

function toProjectSnapshot(row: ProjectSnapshotRow): ProjectSnapshot {
  return {
    id: row.id,
    projectId: row.project_id,
    kind: row.kind as ProjectSnapshot["kind"],
    label: row.label,
    summary: row.summary,
    leftOut: row.left_out,
    futureNote: row.future_note,
    createdAt: row.created_at,
  };
}

export const supabaseProjectSnapshotsAdapter: ProjectSnapshotsPort = {
  async fetchProjectSnapshots(projectId) {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("project_snapshots")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load snapshots: ${error.message}`);
    }

    return (data ?? []).map(toProjectSnapshot);
  },
};
