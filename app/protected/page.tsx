import type { Project, ProjectStatus } from "@/lib/domain/project";
import { DeleteArchivedProjectButton } from "@/components/delete-archived-project-button";
import { FeedbackToast } from "@/components/feedback-toast";
import { LifecycleActionButton } from "@/components/lifecycle-action-button";
import {
  OverrideLaunchButton,
  type ActiveProjectOption,
  type OverrideDecisionInput,
} from "@/components/override-launch-button";
import { RestartCycleButton } from "@/components/restart-cycle-button";
import {
  SnapshotActionButton,
  type SnapshotAction,
  type SnapshotInput,
} from "@/components/snapshot-action-button";
import { Button } from "@/components/ui/button";
import {
  getUserContext,
  supabaseGitHubConnectionsAdapter,
  supabaseProjectsAdapter,
  supabaseRepoDraftsAdapter,
} from "@/lib/clients/supabase";
import {
  applyLifecycleAction,
  fetchProjects,
  type LifecycleAction,
  deleteArchivedProject,
  overrideActiveCap,
  restartArchivedProject,
} from "@/lib/usecases/projects";
import { getGitHubConnectionState } from "@/lib/usecases/github";
import { fetchRepoDrafts } from "@/lib/usecases/github-drafts";
import type { RepoDraft } from "@/lib/usecases/ports";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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

const SNAPSHOT_ACTIONS = new Set<LifecycleAction>(["freeze", "finish"]);

const ACTIONS_BY_STATUS: Record<ProjectStatus, LifecycleAction[]> = {
  active: ["freeze", "archive", "finish"],
  frozen: ["launch", "archive", "finish"],
  archived: [],
};

async function handleLifecycleAction(id: string, action: LifecycleAction) {
  "use server";

  await applyLifecycleAction(supabaseProjectsAdapter, id, action);
}

async function handleLaunchAction(id: string) {
  "use server";

  await applyLifecycleAction(supabaseProjectsAdapter, id, "launch");
}

async function handleSnapshotAction(
  id: string,
  action: SnapshotAction,
  snapshot: SnapshotInput,
) {
  "use server";

  await applyLifecycleAction(supabaseProjectsAdapter, id, action, snapshot);
}

async function handleOverrideRitual(
  launchProjectId: string,
  freezeProjectId: string,
  snapshot: SnapshotInput,
  decision: OverrideDecisionInput,
) {
  "use server";

  await overrideActiveCap(
    supabaseProjectsAdapter,
    launchProjectId,
    freezeProjectId,
    snapshot,
    decision,
  );
}

async function handleRestartCycle(id: string, nextAction: string) {
  "use server";

  await restartArchivedProject(supabaseProjectsAdapter, id, nextAction);
}

async function handleDeleteProject(id: string) {
  "use server";

  await deleteArchivedProject(supabaseProjectsAdapter, id);
}

function SystemStateHeader({
  activeCount,
  frozenCount,
  archivedCount,
}: {
  activeCount: number;
  frozenCount: number;
  archivedCount: number;
}) {
  const activeCap = 3;

  return (
    <div className="rounded border border-border px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span>Active: {activeCount}</span>
        <span>Frozen: {frozenCount}</span>
        <span>Archived: {archivedCount}</span>
        <span className="text-muted-foreground">
          Active cap: {activeCount} / {activeCap}
        </span>
      </div>
    </div>
  );
}

function groupProjects(projects: Project[]) {
  return {
    active: projects.filter((project) => project.status === "active"),
    frozen: projects.filter((project) => project.status === "frozen"),
    archived: projects.filter((project) => project.status === "archived"),
  };
}

function ProjectColumn({
  status,
  projects,
  activeProjects,
}: {
  status: ProjectStatus;
  projects: Project[];
  activeProjects: ActiveProjectOption[];
}) {
  const formatLastReviewed = (value: string | null) => {
    if (!value) {
      return "Not reviewed yet.";
    }

    const diffMs = Date.now() - new Date(value).getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return diffDays === 0
      ? "Reviewed today."
      : `Last reviewed ${diffDays} day${diffDays === 1 ? "" : "s"} ago.`;
  };

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
                Next action: {project.nextAction || "-"}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatLastReviewed(project.lastReviewedAt)}
              </div>
              {ACTIONS_BY_STATUS[project.status].length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIONS_BY_STATUS[project.status].map((action) => (
                    <div key={action}>
                      {action === "launch" ? (
                        <OverrideLaunchButton
                          projectId={project.id}
                          label={ACTION_LABELS[action]}
                          activeProjects={activeProjects}
                          onLaunch={handleLaunchAction}
                          onOverride={handleOverrideRitual}
                        />
                      ) : SNAPSHOT_ACTIONS.has(action) ? (
                        <SnapshotActionButton
                          id={project.id}
                          action={action as SnapshotAction}
                          label={ACTION_LABELS[action]}
                          onAction={handleSnapshotAction}
                        />
                      ) : (
                        <LifecycleActionButton
                          id={project.id}
                          action={action}
                          label={ACTION_LABELS[action]}
                          onAction={handleLifecycleAction}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {project.status === "archived" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <RestartCycleButton
                    id={project.id}
                    onRestart={handleRestartCycle}
                  />
                  <DeleteArchivedProjectButton
                    id={project.id}
                    onDelete={handleDeleteProject}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DraftColumn({ drafts }: { drafts: RepoDraft[] }) {
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
                  {draft.fullName}
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
  const userContext = await getUserContext();

  if (!userContext) {
    redirect("/auth/login");
  }

  const projects = await fetchProjects(supabaseProjectsAdapter);
  const grouped = groupProjects(projects);
  const activeCount = grouped.active.length;
  const frozenCount = grouped.frozen.length;
  const archivedCount = grouped.archived.length;
  const activeProjectOptions = grouped.active.map((project) => ({
    id: project.id,
    name: project.name,
    nextAction: project.nextAction,
  }));
  const drafts = await fetchRepoDrafts(
    supabaseRepoDraftsAdapter,
    userContext,
  );
  const githubConnection = await getGitHubConnectionState(
    supabaseGitHubConnectionsAdapter,
    userContext,
  );
  const pendingDrafts = drafts.filter((draft) => !draft.convertedProjectId);

  return (
    <div className="flex flex-col gap-8">
      <SystemStateHeader
        activeCount={activeCount}
        frozenCount={frozenCount}
        archivedCount={archivedCount}
      />
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
        <ProjectColumn
          status="active"
          projects={grouped.active}
          activeProjects={activeProjectOptions}
        />
        <ProjectColumn
          status="frozen"
          projects={grouped.frozen}
          activeProjects={activeProjectOptions}
        />
        <ProjectColumn
          status="archived"
          projects={grouped.archived}
          activeProjects={activeProjectOptions}
        />
      </div>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <Suspense fallback={null}>
        <FeedbackToast />
      </Suspense>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/protected?review=1">Start review</Link>
            </Button>
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
