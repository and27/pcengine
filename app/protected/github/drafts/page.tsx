import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getUserContext,
  supabaseRepoDraftsAdapter,
} from "@/lib/clients/supabase";
import { fetchRepoDrafts } from "@/lib/usecases/github-drafts";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

async function DraftList() {
  const userContext = await getUserContext();

  if (!userContext) {
    redirect("/auth/login");
  }

  const drafts = await fetchRepoDrafts(supabaseRepoDraftsAdapter, userContext);

  if (drafts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No drafts imported yet. Import repos to see them here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {drafts.map((draft) => (
        <div
          key={draft.id}
          className="rounded border border-border px-4 py-3"
        >
          <div className="font-medium">
            <Link
              href={`/protected/github/drafts/${draft.id}`}
              className="underline"
            >
              {draft.fullName}
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            {draft.visibility} · default branch {draft.defaultBranch} · pushed{" "}
            {formatDate(draft.pushedAt)}
          </div>
          {draft.description && (
            <div className="text-sm text-muted-foreground">
              {draft.description}
            </div>
          )}
          {draft.convertedProjectId && (
            <div className="text-xs text-muted-foreground">
              Converted · {formatDate(draft.convertedAt)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DraftsPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Repo drafts</h1>
          <Button asChild variant="outline">
            <Link href="/protected/github">Back to import</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Imported repositories waiting to be converted into projects.
        </p>
      </header>

      <Suspense>
        <DraftList />
      </Suspense>
    </div>
  );
}
