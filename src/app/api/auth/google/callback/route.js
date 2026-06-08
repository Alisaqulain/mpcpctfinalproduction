import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { createUserToken, attachAuthCookie } from "@/lib/auth/jwtCookie";

function getBaseUrl(req) {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin
  ).replace(/\/$/, "");
}

export async function GET(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const base = getBaseUrl(req);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/login?error=google_not_configured`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  let returnTo = "/profile";

  try {
    if (stateRaw) {
      returnTo = JSON.parse(Buffer.from(stateRaw, "base64url").toString()).returnTo || returnTo;
    }
  } catch {
    /* ignore */
  }

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=google_denied`);
  }

  try {
    await dbConnect();

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${base}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Google token error", tokenData);
      return NextResponse.redirect(`${base}/login?error=google_token`);
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      return NextResponse.redirect(`${base}/login?error=google_profile`);
    }

    let user = await User.findOne({
      $or: [{ googleId: profile.id }, { email: profile.email.toLowerCase() }],
    });

    if (!user) {
      const phonePlaceholder = `g${String(profile.id).slice(0, 9)}`;
      user = await User.create({
        name: profile.name || profile.email.split("@")[0],
        email: profile.email.toLowerCase(),
        phoneNumber: phonePlaceholder,
        password: null,
        googleId: profile.id,
        authProvider: "google",
        isEmailVerified: true,
        isPhoneVerified: false,
        isMobileVerified: false,
        profileUrl: profile.picture,
        avatar: profile.picture,
        states: "",
        city: "",
      });
    } else {
      user.googleId = user.googleId || profile.id;
      user.authProvider = user.authProvider || "google";
      user.isEmailVerified = true;
      if (profile.picture) {
        user.profileUrl = profile.picture;
        user.avatar = profile.picture;
      }
      if (!user.name && profile.name) user.name = profile.name;
      await user.save();
    }

    const jwt = await createUserToken(user);
    const verified = user.isPhoneVerified || user.isMobileVerified;
    const dest = verified
      ? returnTo
      : `/verify-phone?returnTo=${encodeURIComponent(returnTo)}`;

    const res = NextResponse.redirect(`${base}${dest}`);
    return attachAuthCookie(res, jwt, req);
  } catch (e) {
    console.error("Google callback error:", e);
    return NextResponse.redirect(`${base}/login?error=google_failed`);
  }
}
