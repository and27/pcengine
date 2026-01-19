import { redirect } from "next/navigation";
import { Suspense, type ReactElement } from "react";

import { EnvVarWarning } from "@/components/env-var-warning";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

async function HomeRedirect(): Promise<ReactElement | null> {
  if (!hasEnvVars) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <EnvVarWarning />
          <p>
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            to continue.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/protected");
  }

  redirect("/auth/login");

  return null;
}

export default function Home() {
  return (
    <Suspense>
      <HomeRedirect />
    </Suspense>
  );
}
