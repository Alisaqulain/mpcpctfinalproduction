import { NextResponse } from "next/server";

function getBaseUrl(req) {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin
  ).replace(/\/$/, "");
}

export async function GET(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google login not configured" }, { status: 503 });
  }

  const base = getBaseUrl(req);
  const redirectUri = `${base}/api/auth/google/callback`;
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/profile";

  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
