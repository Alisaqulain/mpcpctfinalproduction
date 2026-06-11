import { SignJWT } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";

export async function createUserToken(user) {
  return new SignJWT({
    userId: user._id.toString(),
    phoneNumber: user.phoneNumber || "",
    role: user.role || "user",
    isPhoneVerified: !!(user.isPhoneVerified || user.isMobileVerified),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecretBytes());
}

export function isHttpsRequest(req) {
  return (
    req.headers.get("x-forwarded-proto") === "https" ||
    req.url?.startsWith("https://") ||
    process.env.NEXT_PUBLIC_FORCE_SECURE_COOKIE === "true"
  );
}

export function attachAuthCookie(response, token, req) {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: isHttpsRequest(req),
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
