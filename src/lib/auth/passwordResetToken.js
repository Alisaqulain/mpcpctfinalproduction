import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";

const RESET_PURPOSE = "password_reset";
const RESET_TTL = "15m";

export async function createPasswordResetToken(mobile) {
  return new SignJWT({ mobile, purpose: RESET_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(RESET_TTL)
    .sign(getJwtSecretBytes());
}

export async function verifyPasswordResetToken(token, mobile) {
  if (!token) return { ok: false, error: "Reset token required" };
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    const m = String(mobile || "").replace(/\D/g, "").slice(-10);
    if (payload.purpose !== RESET_PURPOSE || payload.mobile !== m) {
      return { ok: false, error: "Invalid reset token" };
    }
    return { ok: true, mobile: m };
  } catch {
    return { ok: false, error: "Reset token expired or invalid" };
  }
}
