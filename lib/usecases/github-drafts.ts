import "server-only";

import type {
  RepoDraft,
  RepoDraftConversionInput,
  RepoDraftImport,
  RepoDraftsPort,
  UserContext,
} from "@/lib/usecases/ports";

export type { RepoDraftImport, RepoDraftConversionInput };

function requireUserContext(context: UserContext) {
  if (!context.userId) {
    throw new Error("Not authenticated.");
  }

  return context;
}

export async function upsertRepoDrafts(
  port: RepoDraftsPort,
  context: UserContext,
  drafts: RepoDraftImport[],
): Promise<number> {
  if (drafts.length === 0) {
    return 0;
  }

  return port.upsertRepoDrafts(requireUserContext(context), drafts);
}

export async function fetchRepoDrafts(
  port: RepoDraftsPort,
  context: UserContext,
): Promise<RepoDraft[]> {
  return port.fetchRepoDrafts(requireUserContext(context));
}

export async function fetchRepoDraftById(
  port: RepoDraftsPort,
  context: UserContext,
  id: string,
): Promise<RepoDraft | null> {
  return port.fetchRepoDraftById(requireUserContext(context), id);
}

export async function convertRepoDraft(
  port: RepoDraftsPort,
  context: UserContext,
  id: string,
  input: RepoDraftConversionInput,
): Promise<string> {
  return port.convertRepoDraft(requireUserContext(context), id, input);
}
