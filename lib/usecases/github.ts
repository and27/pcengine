import "server-only";

import type {
  GitHubConnection,
  GitHubConnectionsPort,
  GitHubConnectionState,
  UpsertGitHubConnectionInput,
  UserContext,
} from "@/lib/usecases/ports";

export async function getGitHubConnectionState(
  port: GitHubConnectionsPort,
  context: UserContext,
): Promise<GitHubConnectionState> {
  if (!context.userId) {
    return { connected: false };
  }

  return port.getConnectionState(context);
}

export async function getGitHubAccessToken(
  port: GitHubConnectionsPort,
  context: UserContext,
): Promise<string | null> {
  if (!context.userId) {
    return null;
  }

  return port.getAccessToken(context);
}

export async function upsertGitHubConnection(
  port: GitHubConnectionsPort,
  input: UpsertGitHubConnectionInput,
): Promise<GitHubConnection> {
  return port.upsertConnection(input);
}
