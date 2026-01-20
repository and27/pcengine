import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import {
  convertRepoDraft,
  fetchRepoDraftById,
} from "@/lib/usecases/github-drafts";

type PageProps = {
  params: Promise<{ id: string }>;
};

function normalizeOptional(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

async function handleConvertDraft(id: string, formData: FormData) {
  "use server";

  const nameValue = formData.get("name");
  const nextActionValue = formData.get("nextAction");

  if (typeof nameValue !== "string" || typeof nextActionValue !== "string") {
    throw new Error("Name and next action are required.");
  }

  const projectId = await convertRepoDraft(id, {
    name: nameValue.trim(),
    nextAction: nextActionValue.trim(),
    finishDefinition: normalizeOptional(formData.get("finishDefinition")),
  });

  redirect(`/protected/projects/${projectId}`);
}

async function DraftDetail({ id }: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const draft = await fetchRepoDraftById(id);

  if (!draft) {
    notFound();
  }

  const converted = Boolean(draft.converted_project_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded border border-border px-4 py-3">
        <div className="font-medium">{draft.full_name}</div>
        <div className="text-sm text-muted-foreground">
          {draft.visibility} · default branch {draft.default_branch} · pushed{" "}
          {formatDate(draft.pushed_at)}
        </div>
        {draft.description && (
          <div className="text-sm text-muted-foreground">
            {draft.description}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Source:{" "}
          <a
            href={draft.html_url}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {draft.html_url}
          </a>
        </div>
      </div>

      {converted ? (
        <div className="rounded border border-border px-4 py-3 text-sm text-muted-foreground">
          Converted on {formatDate(draft.converted_at)}.{" "}
          <Link
            href={`/protected/projects/${draft.converted_project_id}`}
            className="underline"
          >
            View project
          </Link>
          .
        </div>
      ) : (
        <form className="flex flex-col gap-6" action={handleConvertDraft.bind(null, id)}>
          <div className="grid gap-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" defaultValue={draft.full_name} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nextAction">Next action</Label>
            <Input id="nextAction" name="nextAction" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="finishDefinition">Finish definition</Label>
            <textarea
              id="finishDefinition"
              name="finishDefinition"
              className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">Convert to project</Button>
            <span className="text-sm text-muted-foreground">
              Project will start as Frozen.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}

async function DraftDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DraftDetail id={id} />;
}

export default function DraftDetailPage({ params }: PageProps) {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Draft detail</h1>
          <Button asChild variant="outline">
            <Link href="/protected/github/drafts">Back to drafts</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Convert this draft into a PCE project.
        </p>
      </header>

      <Suspense>
        <DraftDetailLoader params={params} />
      </Suspense>
    </div>
  );
}
