import { createClient } from "@/lib/supabase/server";
import { REVIEW_STALE_DAYS } from "@/lib/domain/project";
import {
  applyLifecycleAction,
  updateProject,
  type ProjectSnapshotInput,
} from "@/lib/usecases/projects";
import {
  ReviewModeOverlay,
  type ReviewDecisionAction,
  type ReviewDecisionPayload,
  type ReviewProject,
} from "@/components/review-mode-overlay";

async function fetchActiveReviewProjects(): Promise<ReviewProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, next_action, last_reviewed_at")
    .eq("status", "active")
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load projects: ${error.message}`);
  }

  return (
    data?.map((project) => ({
      id: project.id,
      name: project.name,
      nextAction: project.next_action,
      lastReviewedAt: project.last_reviewed_at,
    })) ?? []
  );
}

function ensureSnapshotInput(
  snapshot: ReviewDecisionPayload["snapshot"],
): ProjectSnapshotInput {
  if (!snapshot) {
    throw new Error("Snapshot is required for this action.");
  }

  return snapshot;
}

async function applyReviewDecision(
  projectId: string,
  action: ReviewDecisionAction,
  payload: ReviewDecisionPayload,
) {
  "use server";

  const reviewedAt = new Date().toISOString();

  if (action === "next_action") {
    if (!payload.nextAction) {
      throw new Error("Next action is required.");
    }

    await updateProject(projectId, {
      nextAction: payload.nextAction,
      lastReviewedAt: reviewedAt,
    });
    return;
  }

  const snapshot = ensureSnapshotInput(payload.snapshot);
  await applyLifecycleAction(projectId, action, snapshot);
  await updateProject(projectId, { lastReviewedAt: reviewedAt });
}

export async function ReviewGate() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return null;
  }

  const projects = await fetchActiveReviewProjects();

  if (projects.length === 0) {
    return null;
  }

  return (
    <ReviewModeOverlay
      projects={projects}
      staleDays={REVIEW_STALE_DAYS}
      onDecision={applyReviewDecision}
    />
  );
}
