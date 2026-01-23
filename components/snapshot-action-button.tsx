"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SnapshotAction = "freeze" | "finish";

export type SnapshotInput = {
  summary: string;
  label?: string | null;
  leftOut?: string | null;
  futureNote?: string | null;
};

type SnapshotActionButtonProps = {
  id: string;
  action: SnapshotAction;
  label: string;
  onAction: (id: string, action: SnapshotAction, snapshot: SnapshotInput) => Promise<void>;
};

export function SnapshotActionButton({
  id,
  action,
  label,
  onAction,
}: SnapshotActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [leftOut, setLeftOut] = useState("");
  const [futureNote, setFutureNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const summaryId = `snapshot-summary-${id}-${action}`;

  const closeDialog = () => {
    setIsOpen(false);
    setSummary("");
    setSnapshotLabel("");
    setLeftOut("");
    setFutureNote("");
    setError(null);
  };

  const handleConfirm = () => {
    const trimmedSummary = summary.trim();

    if (!trimmedSummary) {
      setError("Summary is required.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await onAction(id, action, {
          summary: trimmedSummary,
          label: snapshotLabel.trim() || null,
          leftOut: leftOut.trim() || null,
          futureNote: futureNote.trim() || null,
        });
        closeDialog();
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update project. Please try again.";
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
        onClick={() => setIsOpen(true)}
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
            className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-lg font-semibold">
              {action === "freeze" ? "Freeze project" : "Finish project"}
            </div>
            <p className="text-sm text-muted-foreground">
              Capture a short snapshot before you {action}.
            </p>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={summaryId}>Summary</Label>
              <textarea
                id={summaryId}
                name="summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
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
                disabled={isPending || summary.trim().length === 0}
              >
                {action === "freeze" ? "Freeze" : "Finish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
