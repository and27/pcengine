import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function getGitHubClientId() {
  return process.env.GITHUB_CLIENT_ID;
}

export async function GET(request: NextRequest) {
  const clientId = getGitHubClientId();

  if (!clientId) {
    return NextResponse.json(
      { error: "Missing GITHUB_CLIENT_ID" },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `${request.nextUrl.origin}/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user repo",
    state,
  });

  const cookieStore = await cookies();
  cookieStore.set("github_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
}
