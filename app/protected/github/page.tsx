import { Suspense } from "react";
import { redirect } from "next/navigation";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  getUserContext,
  requireUserContext,
  supabaseGitHubConnectionsAdapter,
  supabaseRepoDraftsAdapter,
} from "@/lib/clients/supabase";
import { getGitHubAccessToken } from "@/lib/usecases/github";
import { upsertRepoDrafts } from "@/lib/usecases/github-drafts";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  pushed_at: string | null;
};

type ImportPayload = {
  githubRepoId: number;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  visibility: "public" | "private";
  defaultBranch: string;
  pushedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

function encodePayload(payload: ImportPayload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodePayload(value: string): ImportPayload {
  return JSON.parse(decodeURIComponent(value)) as ImportPayload;
}

async function fetchGitHubRepos(token: string): Promise<GitHubRepo[]> {
  const response = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=pushed",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load GitHub repositories.");
  }

  return (await response.json()) as GitHubRepo[];
}

async function importSelectedRepos(formData: FormData) {
  "use server";

  const userContext = await requireUserContext();
  const selected = formData.getAll("selectedRepos");

  if (selected.length === 0) {
    redirect("/protected/github?import=empty");
  }

  const payloads = selected
    .filter((value): value is string => typeof value === "string")
    .map(decodePayload);

  const importedCount = await upsertRepoDrafts(
    supabaseRepoDraftsAdapter,
    userContext,
    payloads,
  );

  redirect(`/protected/github/drafts?imported=${importedCount}`);
}

async function RepoList() {
  const userContext = await getUserContext();

  if (!userContext) {
    redirect("/auth/login");
  }

  const token = await getGitHubAccessToken(
    supabaseGitHubConnectionsAdapter,
    userContext,
  );

  if (!token) {
    redirect("/auth/github");
  }

  const repos = await fetchGitHubRepos(token);

  return (
    <form className="flex flex-col gap-4" action={importSelectedRepos}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Select repositories to import as drafts.
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <Link href="/protected/github/drafts">View drafts</Link>
          </Button>
          <Button type="submit">Import selected</Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {repos.map((repo) => {
          const payload: ImportPayload = {
            githubRepoId: repo.id,
            fullName: repo.full_name,
            htmlUrl: repo.html_url,
            description: repo.description,
            visibility: repo.private ? "private" : "public",
            defaultBranch: repo.default_branch,
            pushedAt: repo.pushed_at,
          };

          return (
            <label
              key={repo.id}
              className="flex items-start gap-3 rounded border border-border px-4 py-3"
            >
              <input
                type="checkbox"
                name="selectedRepos"
                value={encodePayload(payload)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div className="flex flex-col gap-1">
                <div className="font-medium">{repo.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {repo.owner.login} · {repo.private ? "private" : "public"} ·{" "}
                  last pushed {formatDate(repo.pushed_at)}
                </div>
                {repo.description && (
                  <div className="text-sm text-muted-foreground">
                    {repo.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </form>
  );
}

export default function GitHubImportPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">GitHub import</h1>
        <p className="text-sm text-muted-foreground">
          Choose repositories to save as drafts.
        </p>
      </header>

      <Suspense>
        <RepoList />
      </Suspense>
    </div>
  );
}
