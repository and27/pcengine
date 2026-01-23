"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RestartCycleButtonProps = {
  id: string;
  onRestart: (id: string, nextAction: string) => Promise<void>;
};

export function RestartCycleButton({
  id,
  onRestart,
}: RestartCycleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [nextAction, setNextAction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = `restart-next-action-${id}`;

  const closeDialog = () => {
    setIsOpen(false);
    setNextAction("");
    setError(null);
  };

  const handleConfirm = () => {
    const trimmed = nextAction.trim();

    if (!trimmed) {
      setError("Next action is required.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await onRestart(id, trimmed);
        closeDialog();
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to restart project. Please try again.";
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
        Start new cycle
      </Button>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4"
          role="dialog"
          aria-modal="true"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-lg font-semibold">Restart project</div>
            <p className="text-sm text-muted-foreground">
              Set the next action for the new cycle before restarting.
            </p>

            <div className="mt-4 grid gap-2">
              <Label htmlFor={inputId}>Next action</Label>
              <Input
                id={inputId}
                name="nextAction"
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                maxLength={140}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
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
                disabled={isPending || nextAction.trim().length === 0}
              >
                Restart
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
