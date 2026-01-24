"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SnapshotInput } from "@/components/snapshot-action-button";

export type ActiveProjectOption = {
  id: string;
  name: string;
  nextAction: string;
};

export type OverrideDecisionInput = {
  reason: string;
  tradeOff: string;
};

type OverrideLaunchButtonProps = {
  projectId: string;
  label: string;
  activeProjects: ActiveProjectOption[];
  onLaunch: (id: string) => Promise<void>;
  onOverride: (
    launchProjectId: string,
    freezeProjectId: string,
    snapshot: SnapshotInput,
    decision: OverrideDecisionInput,
  ) => Promise<void>;
};

function isActiveCapError(error: unknown) {
  return error instanceof Error && error.message === "ACTIVE_CAP_REACHED";
}

export function OverrideLaunchButton({
  projectId,
  label,
  activeProjects,
  onLaunch,
  onOverride,
}: OverrideLaunchButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [freezeProjectId, setFreezeProjectId] = useState("");
  const [summary, setSummary] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [leftOut, setLeftOut] = useState("");
  const [futureNote, setFutureNote] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionTradeOff, setDecisionTradeOff] = useState("");
  const [error, setError] = useState<string | null>(null);
  const summaryId = `override-summary-${projectId}`;

  const openDialog = () => {
    setFreezeProjectId(activeProjects[0]?.id ?? "");
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setFreezeProjectId("");
    setSummary("");
    setSnapshotLabel("");
    setLeftOut("");
    setFutureNote("");
    setDecisionReason("");
    setDecisionTradeOff("");
    setError(null);
  };

  const handleLaunch = () => {
    startTransition(async () => {
      try {
        await onLaunch(projectId);
        router.refresh();
      } catch (error) {
        if (isActiveCapError(error)) {
          openDialog();
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Failed to launch project. Please try again.";
        toast.error(message);
      }
    });
  };

  const handleConfirm = () => {
    if (!freezeProjectId) {
      setError("Select a project to freeze.");
      return;
    }

    if (!summary.trim()) {
      setError("Snapshot summary is required.");
      return;
    }

    if (!decisionReason.trim()) {
      setError("Decision reason is required.");
      return;
    }

    if (!decisionTradeOff.trim()) {
      setError("Decision trade-off is required.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await onOverride(
          projectId,
          freezeProjectId,
          {
            summary: summary.trim(),
            label: snapshotLabel.trim() || null,
            leftOut: leftOut.trim() || null,
            futureNote: futureNote.trim() || null,
          },
          {
            reason: decisionReason.trim(),
            tradeOff: decisionTradeOff.trim(),
          },
        );
        closeDialog();
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to override active cap. Please try again.";
        toast.error(message);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleLaunch}
      >
        {label}
      </Button>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4"
          role="dialog"
          aria-modal="true"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-border bg-background p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-lg font-semibold">Override active cap</div>
            <p className="text-sm text-muted-foreground">
              Freeze one active project and capture a decision before launching.
            </p>

            <div className="mt-4 grid gap-2">
              <div className="text-sm font-medium">Freeze this project</div>
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active projects available to freeze.
                </p>
              ) : (
                <div className="grid gap-2">
                  {activeProjects.map((project) => (
                    <label
                      key={project.id}
                      className="flex items-start gap-2 rounded border border-border px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={`freeze-project-${projectId}`}
                        value={project.id}
                        checked={freezeProjectId === project.id}
                        onChange={() => setFreezeProjectId(project.id)}
                      />
                      <span>
                        <span className="font-medium">{project.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          Next action: {project.nextAction || "-"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={summaryId}>Freeze snapshot summary</Label>
              <textarea
                id={summaryId}
                name="summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={`${summaryId}-label`}>Label (optional)</Label>
              <Input
                id={`${summaryId}-label`}
                name="label"
                value={snapshotLabel}
                onChange={(event) => setSnapshotLabel(event.target.value)}
              />
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={`${summaryId}-left-out`}>Left out (optional)</Label>
              <textarea
                id={`${summaryId}-left-out`}
                name="leftOut"
                value={leftOut}
                onChange={(event) => setLeftOut(event.target.value)}
                className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={`${summaryId}-future-note`}>
                Future note (optional)
              </Label>
              <textarea
                id={`${summaryId}-future-note`}
                name="futureNote"
                value={futureNote}
                onChange={(event) => setFutureNote(event.target.value)}
                className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={`${summaryId}-reason`}>Decision reason</Label>
              <textarea
                id={`${summaryId}-reason`}
                name="reason"
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
                className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={`${summaryId}-trade-off`}>
                Decision trade-off
              </Label>
              <textarea
                id={`${summaryId}-trade-off`}
                name="tradeOff"
                value={decisionTradeOff}
                onChange={(event) => setDecisionTradeOff(event.target.value)}
                className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || activeProjects.length === 0}
              >
                Freeze and launch
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
