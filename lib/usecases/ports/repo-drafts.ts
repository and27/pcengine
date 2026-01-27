import type { UserContext } from "./user-context";

export type RepoDraft = {
  id: string;
  userId: string;
  githubRepoId: number;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  visibility: string;
  defaultBranch: string;
  pushedAt: string | null;
  topics: string[] | null;
  importedAt: string;
  convertedProjectId: string | null;
  convertedAt: string | null;
};

export type RepoDraftImport = {
  githubRepoId: number;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  visibility: string;
  defaultBranch: string;
  pushedAt: string | null;
  topics?: string[] | null;
};

export type RepoDraftConversionInput = {
  name: string;
  nextAction: string;
  finishDefinition?: string | null;
};

export interface RepoDraftsPort {
  upsertRepoDrafts(
    context: UserContext,
    drafts: RepoDraftImport[],
  ): Promise<number>;
  fetchRepoDrafts(context: UserContext): Promise<RepoDraft[]>;
  fetchRepoDraftById(
    context: UserContext,
    id: string,
  ): Promise<RepoDraft | null>;
  convertRepoDraft(
    context: UserContext,
    id: string,
    input: RepoDraftConversionInput,
  ): Promise<string>;
}
