import "server-only";

import { createClient } from "../supabase/server";
import type { Database } from "../supabase/types";

export type ProjectSnapshotRow =
  Database["public"]["Tables"]["project_snapshots"]["Row"];

export async function fetchProjectSnapshots(
  projectId: string,
): Promise<ProjectSnapshotRow[]> {
  if (!projectId) {
    throw new Error("Project id is required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_snapshots")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load snapshots: ${error.message}`);
  }

  return data ?? [];
}
