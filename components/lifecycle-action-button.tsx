"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { LifecycleAction } from "@/lib/usecases/projects";

type LifecycleActionButtonProps = {
  id: string;
  action: LifecycleAction;
  label: string;
  onAction: (id: string, action: LifecycleAction) => Promise<void>;
};

export function LifecycleActionButton({
  id,
  action,
  label,
  onAction,
}: LifecycleActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await onAction(id, action);
            router.refresh();
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to update project. Please try again.";
            toast.error(message);
          }
        })
      }
    >
      {label}
    </Button>
  );
}
