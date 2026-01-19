import { redirect } from "next/navigation";
import { Suspense, type ReactElement } from "react";

import { createClient } from "@/lib/supabase/server";

async function HomeRedirect(): Promise<ReactElement | null> {
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
