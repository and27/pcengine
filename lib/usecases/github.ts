import "server-only";

import { createClient, createServiceClient } from "../supabase/server";
import type { Database } from "../supabase/types";

type GitHubConnectionRow =
  Database["public"]["Tables"]["github_connections"]["Row"];

export type GitHubConnectionState = {
  connected: boolean;
  githubLogin?: string;
};

function getUserIdFromClaims(claims: Record<string, unknown> | null | undefined) {
  const sub = claims?.sub;
  return typeof sub === "string" ? sub : null;
}

export async function getGitHubConnectionState(): Promise<GitHubConnectionState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return { connected: false };
  }

  const userId = getUserIdFromClaims(data.claims);

  if (!userId) {
    return { connected: false };
  }

  const { data: connection, error: connectionError } = await supabase
    .rpc("get_github_connection_state")
    .single();

  if (connectionError) {
    throw new Error(`Failed to load GitHub connection: ${connectionError.message}`);
  }

  return connection?.connected
    ? { connected: true, githubLogin: connection.github_login ?? undefined }
    : { connected: false };
}

export async function getGitHubAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const userId = getUserIdFromClaims(data.claims);

  if (!userId) {
    return null;
  }

  const serviceClient = createServiceClient();
  const { data: connection, error: connectionError } = await serviceClient
    .from("github_connections")
    .select("access_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (connectionError) {
    throw new Error(`Failed to load GitHub token: ${connectionError.message}`);
  }

  return connection?.access_token ?? null;
}

type UpsertGitHubConnectionInput = {
  userId: string;
  githubUserId: number;
  githubLogin: string;
  accessToken: string;
};

export async function upsertGitHubConnection(
  input: UpsertGitHubConnectionInput,
): Promise<GitHubConnectionRow> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("github_connections")
    .upsert(
      {
        user_id: input.userId,
        github_user_id: input.githubUserId,
        github_login: input.githubLogin,
        access_token: input.accessToken,
        updated_at: now,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to store GitHub connection: ${error.message}`);
  }

  return data;
}
