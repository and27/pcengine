import { REVIEW_STALE_DAYS } from "@/lib/domain/project";
import {
  getUserContext,
  requireUserContext,
  supabaseProjectsAdapter,
} from "@/lib/clients/supabase";
import {
  applyLifecycleAction,
  fetchProjects,
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
  const projects = await fetchProjects(supabaseProjectsAdapter);

  return projects
    .filter((project) => project.status === "active")
    .map((project) => ({
      id: project.id,
      name: project.name,
      nextAction: project.nextAction,
      lastReviewedAt: project.lastReviewedAt,
    }));
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

  await requireUserContext();
  const reviewedAt = new Date().toISOString();

  if (action === "next_action") {
    if (!payload.nextAction) {
      throw new Error("Next action is required.");
    }

    await updateProject(supabaseProjectsAdapter, projectId, {
      nextAction: payload.nextAction,
      lastReviewedAt: reviewedAt,
    });
    return;
  }

  const snapshot = ensureSnapshotInput(payload.snapshot);
  await applyLifecycleAction(
    supabaseProjectsAdapter,
    projectId,
    action,
    snapshot,
  );
  await updateProject(supabaseProjectsAdapter, projectId, {
    lastReviewedAt: reviewedAt,
  });
}

export async function ReviewGate() {
  const userContext = await getUserContext();

  if (!userContext) {
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
