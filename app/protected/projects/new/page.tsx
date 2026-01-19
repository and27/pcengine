import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "@/lib/usecases/projects";

function normalizeOptional(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function handleCreateProject(formData: FormData) {
  "use server";

  const nameValue = formData.get("name");
  const nextActionValue = formData.get("nextAction");

  if (typeof nameValue !== "string" || typeof nextActionValue !== "string") {
    throw new Error("Name and next action are required.");
  }

  const project = await createProject({
    name: nameValue.trim(),
    narrativeLink: normalizeOptional(formData.get("narrativeLink")),
    whyNow: normalizeOptional(formData.get("whyNow")),
    finishDefinition: normalizeOptional(formData.get("finishDefinition")),
    nextAction: nextActionValue.trim(),
    status: "frozen",
  });

  redirect(`/protected/projects/${project.id}`);
}

async function NewProjectForm() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  return (
    <form className="flex flex-col gap-6" action={handleCreateProject}>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="nextAction">Next action</Label>
        <Input id="nextAction" name="nextAction" maxLength={140} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="finishDefinition">Finish definition</Label>
        <textarea
          id="finishDefinition"
          name="finishDefinition"
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="narrativeLink">Narrative link</Label>
        <Input id="narrativeLink" name="narrativeLink" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="whyNow">Why now</Label>
        <textarea
          id="whyNow"
          name="whyNow"
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Create project</Button>
      </div>
    </form>
  );
}

export default function NewProjectPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">New project</h1>
        <p className="text-sm text-muted-foreground">
          Create a project to start tracking progress in PCE.
        </p>
      </header>

      <Suspense>
        <NewProjectForm />
      </Suspense>
    </div>
  );
}
