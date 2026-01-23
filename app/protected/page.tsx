import type { ProjectStatus } from "@/lib/domain/project";
import { FeedbackToast } from "@/components/feedback-toast";
import { LifecycleActionButton } from "@/components/lifecycle-action-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  applyLifecycleAction,
  type LifecycleAction,
} from "@/lib/usecases/projects";
import { getGitHubConnectionState } from "@/lib/usecases/github";
import { fetchRepoDrafts } from "@/lib/usecases/github-drafts";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type ProjectRow = {
  id: string;
  name: string;
  narrative_link: string | null;
  why_now: string | null;
  finish_definition: string | null;
  status: ProjectStatus;
  next_action: string;
  start_date: string | null;
  finish_date: string | null;
};

type DraftRow = {
  id: string;
  full_name: string;
  converted_project_id: string | null;
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  frozen: "Frozen",
  archived: "Archived",
};

const ACTION_LABELS: Record<LifecycleAction, string> = {
  launch: "Launch",
  freeze: "Freeze",
  archive: "Archive",
  finish: "Finish",
};

const ACTIONS_BY_STATUS: Record<ProjectStatus, LifecycleAction[]> = {
  active: ["freeze", "archive", "finish"],
  frozen: ["launch", "archive", "finish"],
  archived: [],
};

async function handleLifecycleAction(id: string, action: LifecycleAction) {
  "use server";

  await applyLifecycleAction(id, action);
}

async function fetchProjects(): Promise<ProjectRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load projects: ${error.message}`);
  }

  return data ?? [];
}

function groupProjects(projects: ProjectRow[]) {
  return {
    active: projects.filter((project) => project.status === "active"),
    frozen: projects.filter((project) => project.status === "frozen"),
    archived: projects.filter((project) => project.status === "archived"),
  };
}

function ProjectColumn({
  status,
  projects,
}: {
  status: ProjectStatus;
  projects: ProjectRow[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{STATUS_LABELS[status]}</h2>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {STATUS_LABELS[status].toLowerCase()} projects.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="rounded border border-border px-4 py-3"
            >
              <div className="font-medium">
                <Link
                  href={`/protected/projects/${project.id}`}
                  className="underline"
                >
                  {project.name}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                Next action: {project.next_action || "-"}
              </div>
              {ACTIONS_BY_STATUS[project.status].length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIONS_BY_STATUS[project.status].map((action) => (
                    <div key={action}>
                      <LifecycleActionButton
                        id={project.id}
                        action={action}
                        label={ACTION_LABELS[action]}
                        onAction={handleLifecycleAction}
                      />
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DraftColumn({ drafts }: { drafts: DraftRow[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Drafts</h2>
      {drafts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No drafts waiting for conversion.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="rounded border border-border px-4 py-3"
            >
              <div className="font-medium">
                <Link
                  href={`/protected/github/drafts/${draft.id}`}
                  className="underline"
                >
                  {draft.full_name}
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                Awaiting conversion.
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function ProjectBoard() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const projects = await fetchProjects();
  const grouped = groupProjects(projects);
  const drafts = await fetchRepoDrafts();
  const githubConnection = await getGitHubConnectionState();
  const pendingDrafts = drafts.filter((draft) => !draft.converted_project_id);

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded border border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            {githubConnection.connected
              ? `GitHub connected as ${githubConnection.githubLogin}`
              : "GitHub not connected"}
          </div>
          {!githubConnection.connected && (
            <Button asChild size="sm" variant="outline">
              <Link href="/auth/github">Connect GitHub</Link>
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DraftColumn drafts={pendingDrafts} />
        <ProjectColumn status="active" projects={grouped.active} />
        <ProjectColumn status="frozen" projects={grouped.frozen} />
        <ProjectColumn status="archived" projects={grouped.archived} />
      </div>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <FeedbackToast />
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/protected/github">GitHub import</Link>
            </Button>
            <Button asChild>
              <Link href="/protected/projects/new">New Project</Link>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Board view of drafts and projects by status.
        </p>
      </header>

      <Suspense>
        <ProjectBoard />
      </Suspense>
    </div>
  );
}
