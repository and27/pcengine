import type { UserContext } from "./user-context";

export type GitHubConnectionState = {
  connected: boolean;
  githubLogin?: string;
};

export type GitHubConnection = {
  id: string;
  userId: string;
  githubUserId: number;
  githubLogin: string;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertGitHubConnectionInput = {
  userId: string;
  githubUserId: number;
  githubLogin: string;
  accessToken: string;
};

export interface GitHubConnectionsPort {
  getConnectionState(context: UserContext): Promise<GitHubConnectionState>;
  getAccessToken(context: UserContext): Promise<string | null>;
  upsertConnection(input: UpsertGitHubConnectionInput): Promise<GitHubConnection>;
}
