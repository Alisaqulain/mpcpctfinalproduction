import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const buckets = new Map();

function rateLimit(ip, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, reset: now + windowMs };
  if (now > b.reset) {
    b.count = 0;
    b.reset = now + windowMs;
  }
  b.count++;
  buckets.set(ip, b);
  return b.count <= limit;
}

function getJwtSecretBytes() {
  const secret = process.env.JWT_SECRET;
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return new TextEncoder().encode("development-only-jwt-secret-not-for-production");
}

function isProtectedRoute(pathname) {
  const protectedPrefixes = [
    "/skill-test",
    "/skill_test",
    "/typing/skill-test",
    "/learning",
    "/typing/learning",
    "/exam_mode",
    "/exam-mode",
  ];

  if (protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }

  if (pathname === "/exam" || pathname.startsWith("/exam/")) {
    return true;
  }

  return false;
}

async function getTokenPayload(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/api/newsletter") ||
    path.startsWith("/api/seo/ai-assist") ||
    path.startsWith("/api/contact-lead") ||
    (path === "/api/doubts" && request.method === "POST") ||
    (path === "/api/auth/firebase-phone" && request.method === "POST")
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimit(ip, 25, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (isProtectedRoute(path)) {
    const returnPath = `${path}${request.nextUrl.search}`;
    const payload = await getTokenPayload(request);

    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", returnPath);
      return NextResponse.redirect(loginUrl);
    }

    if (payload.role !== "admin" && !payload.isPhoneVerified) {
      const verifyUrl = new URL("/verify-phone", request.url);
      verifyUrl.searchParams.set("returnTo", returnPath);
      return NextResponse.redirect(verifyUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/newsletter/:path*",
    "/api/seo/ai-assist/:path*",
    "/api/contact-lead/:path*",
    "/api/doubts",
    "/api/auth/firebase-phone",
    "/skill-test/:path*",
    "/skill_test/:path*",
    "/typing/skill-test/:path*",
    "/learning/:path*",
    "/typing/learning/:path*",
    "/exam",
    "/exam/:path*",
    "/exam_mode/:path*",
    "/exam-mode/:path*",
  ],
};
