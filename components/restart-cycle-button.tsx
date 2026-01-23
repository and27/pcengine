"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type RestartCycleButtonProps = {
  id: string;
  onRestart: (id: string) => Promise<void>;
};

export function RestartCycleButton({
  id,
  onRestart,
}: RestartCycleButtonProps) {
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
            await onRestart(id);
            router.refresh();
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to restart project. Please try again.";
            toast.error(message);
          }
        })
      }
    >
      Start new cycle
    </Button>
  );
}
