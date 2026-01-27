import "server-only";

import type { Database } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  GitHubConnection,
  GitHubConnectionState,
  GitHubConnectionsPort,
  UpsertGitHubConnectionInput,
  UserContext,
} from "@/lib/usecases/ports";

type GitHubConnectionRow =
  Database["public"]["Tables"]["github_connections"]["Row"];

function toGitHubConnection(row: GitHubConnectionRow): GitHubConnection {
  return {
    id: row.id,
    userId: row.user_id,
    githubUserId: row.github_user_id,
    githubLogin: row.github_login,
    accessToken: row.access_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchConnectionRow(context: UserContext) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("github_connections")
    .select("*")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load GitHub connection: ${error.message}`);
  }

  return data;
}

export const supabaseGitHubConnectionsAdapter: GitHubConnectionsPort = {
  async getConnectionState(context: UserContext): Promise<GitHubConnectionState> {
    if (!context.userId) {
      return { connected: false };
    }

    const connection = await fetchConnectionRow(context);

    return connection
      ? { connected: true, githubLogin: connection.github_login ?? undefined }
      : { connected: false };
  },

  async getAccessToken(context: UserContext) {
    if (!context.userId) {
      return null;
    }

    const connection = await fetchConnectionRow(context);
    return connection?.access_token ?? null;
  },

  async upsertConnection(input: UpsertGitHubConnectionInput) {
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

    return toGitHubConnection(data);
  },
};
