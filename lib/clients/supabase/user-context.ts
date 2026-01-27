import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { UserContext } from "@/lib/usecases/ports";

function getUserIdFromClaims(
  claims: Record<string, unknown> | null | undefined,
): string | null {
  const sub = claims?.sub;
  return typeof sub === "string" ? sub : null;
}

export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  const userId = getUserIdFromClaims(data.claims);
  return userId ? { userId } : null;
}

export async function requireUserContext(): Promise<UserContext> {
  const context = await getUserContext();

  if (!context?.userId) {
    throw new Error("Not authenticated.");
  }

  return context;
}
