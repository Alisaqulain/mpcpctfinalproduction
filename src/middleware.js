import { NextResponse } from "next/server";

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

export function middleware(request) {
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/api/newsletter") ||
    path.startsWith("/api/seo/ai-assist") ||
    path.startsWith("/api/contact-lead")
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimit(ip, 25, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/newsletter/:path*", "/api/seo/ai-assist/:path*", "/api/contact-lead/:path*"],
};
