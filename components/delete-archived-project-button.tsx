"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type DeleteArchivedProjectButtonProps = {
  id: string;
  onDelete: (id: string) => Promise<void>;
};

export function DeleteArchivedProjectButton({
  id,
  onDelete,
}: DeleteArchivedProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await onDelete(id);
        toast.success("Project deleted.");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete project. Please try again.";
        toast.error(message);
      }
    });
  };

  const confirmDelete = () => {
    toast("Delete this archived project?", {
      action: {
        label: "Delete",
        onClick: handleDelete,
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={confirmDelete}
    >
      Delete
    </Button>
  );
}
