"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const TOAST_MESSAGES: Record<string, string> = {
  "project-created": "Project created.",
  "draft-converted": "Draft converted.",
};

export function FeedbackToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastKey = searchParams.get("toast");

    if (!toastKey) {
      return;
    }

    const message = TOAST_MESSAGES[toastKey];

    if (message) {
      toast.success(message);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");

    const nextUrl = nextParams.size
      ? `${pathname}?${nextParams.toString()}`
      : pathname;

    router.replace(nextUrl);
  }, [pathname, router, searchParams]);

  return null;
}
