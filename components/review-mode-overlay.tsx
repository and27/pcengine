"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SnapshotInput } from "@/components/snapshot-action-button";

export type ReviewProject = {
  id: string;
  name: string;
  nextAction: string;
  lastReviewedAt: string | null;
};

export type ReviewDecisionAction = "next_action" | "freeze" | "finish";

export type ReviewDecisionPayload = {
  nextAction?: string;
  snapshot?: SnapshotInput;
};

type ReviewModeOverlayProps = {
  projects: ReviewProject[];
  staleDays: number;
  onDecision: (
    projectId: string,
    action: ReviewDecisionAction,
    payload: ReviewDecisionPayload,
  ) => Promise<void>;
};

const REVIEW_WEEK_KEY = "pce_review_week";

function getWeekKey(date: Date) {
  const local = new Date(date);
  const day = local.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  local.setDate(local.getDate() + diffToMonday);
  local.setHours(0, 0, 0, 0);
  return local.toISOString().slice(0, 10);
}

function ReviewProjectCard({
  project,
  onDecision,
  onComplete,
}: {
  project: ReviewProject;
  onDecision: (
    projectId: string,
    action: ReviewDecisionAction,
    payload: ReviewDecisionPayload,
  ) => Promise<void>;
  onComplete: (projectId: string) => void;
}) {
  const [action, setAction] = useState<ReviewDecisionAction>("next_action");
  const [nextAction, setNextAction] = useState(project.nextAction ?? "");
  const [summary, setSummary] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [leftOut, setLeftOut] = useState("");
  const [futureNote, setFutureNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (isComplete) {
      return;
    }

    if (action === "next_action") {
      if (!nextAction.trim()) {
        setError("Next action is required.");
        return;
      }
    } else {
      if (!summary.trim()) {
        setError("Snapshot summary is required.");
        return;
      }
    }

    setError(null);

    startTransition(async () => {
      try {
        if (action === "next_action") {
          await onDecision(project.id, action, {
            nextAction: nextAction.trim(),
          });
        } else {
          await onDecision(project.id, action, {
            snapshot: {
              summary: summary.trim(),
              label: snapshotLabel.trim() || null,
              leftOut: leftOut.trim() || null,
              futureNote: futureNote.trim() || null,
            },
          });
        }
        setIsComplete(true);
        onComplete(project.id);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to apply decision. Please try again.";
        toast.error(message);
      }
    });
  };

  return (
    <div className="rounded border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{project.name}</div>
        {isComplete && (
          <span className="text-xs text-muted-foreground">Completed</span>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        Current next action: {project.nextAction || "-"}
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`review-${project.id}`}
            value="next_action"
            checked={action === "next_action"}
            onChange={() => setAction("next_action")}
            disabled={isComplete || isPending}
          />
          Update next action
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`review-${project.id}`}
            value="freeze"
            checked={action === "freeze"}
            onChange={() => setAction("freeze")}
            disabled={isComplete || isPending}
          />
          Freeze (requires snapshot)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={`review-${project.id}`}
            value="finish"
            checked={action === "finish"}
            onChange={() => setAction("finish")}
            disabled={isComplete || isPending}
          />
          Finish (requires snapshot)
        </label>
      </div>

      {action === "next_action" ? (
        <div className="mt-4 grid gap-2">
          <Label htmlFor={`next-action-${project.id}`}>Next action</Label>
          <Input
            id={`next-action-${project.id}`}
            name="nextAction"
            value={nextAction}
            onChange={(event) => setNextAction(event.target.value)}
            maxLength={140}
            disabled={isComplete || isPending}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor={`summary-${project.id}`}>Snapshot summary</Label>
            <textarea
              id={`summary-${project.id}`}
              name="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isComplete || isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`label-${project.id}`}>Label (optional)</Label>
            <Input
              id={`label-${project.id}`}
              name="label"
              value={snapshotLabel}
              onChange={(event) => setSnapshotLabel(event.target.value)}
              disabled={isComplete || isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`left-out-${project.id}`}>
              Left out (optional)
            </Label>
            <textarea
              id={`left-out-${project.id}`}
              name="leftOut"
              value={leftOut}
              onChange={(event) => setLeftOut(event.target.value)}
              className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isComplete || isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`future-note-${project.id}`}>
              Future note (optional)
            </Label>
            <textarea
              id={`future-note-${project.id}`}
              name="futureNote"
              value={futureNote}
              onChange={(event) => setFutureNote(event.target.value)}
              className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isComplete || isPending}
            />
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={isComplete || isPending}
        >
          Apply decision
        </Button>
      </div>
    </div>
  );
}

export function ReviewModeOverlay({
  projects,
  staleDays,
  onDecision,
}: ReviewModeOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const currentWeekKey = useMemo(() => getWeekKey(new Date()), []);

  const hasStale = useMemo(() => {
    const now = Date.now();
    const staleMs = staleDays * 24 * 60 * 60 * 1000;
    return projects.some((project) => {
      if (!project.lastReviewedAt) {
        return true;
      }
      const diffMs = now - new Date(project.lastReviewedAt).getTime();
      return diffMs > staleMs;
    });
  }, [projects, staleDays]);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    if (searchParams.get("review") === "1") {
      setIsOpen(true);
      return;
    }

    if (hasStale) {
      setIsOpen(true);
      return;
    }

    const storedWeek = window.localStorage.getItem(REVIEW_WEEK_KEY);
    if (storedWeek !== currentWeekKey) {
      setIsOpen(true);
    }
  }, [projects, searchParams, hasStale, currentWeekKey]);

  const allComplete =
    projects.length > 0 && completedIds.size === projects.length;

  const handleComplete = (projectId: string) => {
    setCompletedIds((prev) => new Set(prev).add(projectId));
  };

  const finishReview = () => {
    window.localStorage.setItem(REVIEW_WEEK_KEY, currentWeekKey);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("review");
    const nextUrl = nextParams.size
      ? `${pathname}?${nextParams.toString()}`
      : pathname;
    router.replace(nextUrl);
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-start justify-center overflow-auto bg-background/90 px-4 py-10">
      <div className="w-full max-w-4xl rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Weekly review</h2>
          <p className="text-sm text-muted-foreground">
            Decide what happens next for every active project. You cannot exit
            until all decisions are made.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {projects.map((project) => (
            <ReviewProjectCard
              key={project.id}
              project={project}
              onDecision={onDecision}
              onComplete={handleComplete}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" disabled={!allComplete} onClick={finishReview}>
            Return to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
