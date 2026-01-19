import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { fetchProjectById, updateProject } from "@/lib/usecases/projects";

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

async function saveProject(id: string, formData: FormData) {
  "use server";

  const nameValue = formData.get("name");
  const nextActionValue = formData.get("nextAction");

  if (typeof nameValue !== "string" || typeof nextActionValue !== "string") {
    throw new Error("Name and next action are required.");
  }

  await updateProject(id, {
    name: nameValue.trim(),
    narrativeLink: normalizeOptional(formData.get("narrativeLink")),
    whyNow: normalizeOptional(formData.get("whyNow")),
    finishDefinition: normalizeOptional(formData.get("finishDefinition")),
    nextAction: nextActionValue.trim(),
  });

  redirect(`/protected/projects/${id}`);
}

async function ProjectDetail({ id }: { id: string }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const project = await fetchProjectById(id);

  if (!project) {
    notFound();
  }

  return (
    <form className="flex flex-col gap-6" action={saveProject.bind(null, id)}>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={project.name} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="narrativeLink">Narrative link</Label>
        <Input
          id="narrativeLink"
          name="narrativeLink"
          defaultValue={project.narrativeLink ?? ""}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="whyNow">Why now</Label>
        <textarea
          id="whyNow"
          name="whyNow"
          defaultValue={project.whyNow ?? ""}
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="finishDefinition">Finish definition</Label>
        <textarea
          id="finishDefinition"
          name="finishDefinition"
          defaultValue={project.finishDefinition ?? ""}
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="nextAction">Next action</Label>
        <Input
          id="nextAction"
          name="nextAction"
          defaultValue={project.nextAction}
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Save changes</Button>
        <span className="text-sm text-muted-foreground">
          Status: {project.status}
        </span>
      </div>
    </form>
  );
}

async function ProjectDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectDetail id={id} />;
}

export default function ProjectDetailPage({ params }: PageProps) {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Project detail</h1>
        <p className="text-sm text-muted-foreground">
          Update the core fields for this project.
        </p>
      </header>

      <Suspense>
        <ProjectDetailLoader params={params} />
      </Suspense>
    </div>
  );
}
