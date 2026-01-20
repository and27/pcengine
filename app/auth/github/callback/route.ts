import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { upsertGitHubConnection } from "@/lib/usecases/github";

type GitHubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserResponse = {
  id: number;
  login: string;
};

function getGitHubClientConfig() {
  return {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<GitHubTokenResponse> {
  const { clientId, clientSecret } = getGitHubClientConfig();

  if (!clientId || !clientSecret) {
    return { error: "missing_client_config" };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return (await response.json()) as GitHubTokenResponse;
}

async function fetchGitHubUser(accessToken: string): Promise<GitHubUserResponse> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user profile.");
  }

  return (await response.json()) as GitHubUserResponse;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const redirectUri = `${url.origin}/auth/github/callback`;
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/protected?github=state_error", url));
  }

  cookieStore.set("github_oauth_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  const tokenResponse = await exchangeCodeForToken(code, redirectUri);

  if (!tokenResponse.access_token) {
    return NextResponse.redirect(
      new URL("/protected?github=token_error", url),
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  if (!userId) {
    return NextResponse.redirect(new URL("/auth/login", url));
  }

  const githubUser = await fetchGitHubUser(tokenResponse.access_token);

  await upsertGitHubConnection({
    userId,
    githubUserId: githubUser.id,
    githubLogin: githubUser.login,
    accessToken: tokenResponse.access_token,
  });

  return NextResponse.redirect(new URL("/protected?github=connected", url));
}
