/**
 * Centralized JWT signing key material for jose (HS256).
 * Production must set JWT_SECRET; development may omit it with an insecure default (logged once).
 */
const DEV_FALLBACK = "development-only-jwt-secret-not-for-production";

let warnedDevFallback = false;
let cachedBytes;

export function getJwtSecretBytes() {
  if (cachedBytes) return cachedBytes;
  const secret = process.env.JWT_SECRET;
  if (secret) {
    cachedBytes = new TextEncoder().encode(secret);
    return cachedBytes;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  if (!warnedDevFallback) {
    console.warn(
      "[mpcpct] JWT_SECRET is unset; using insecure development default. Set JWT_SECRET before any production deploy."
    );
    warnedDevFallback = true;
  }
  cachedBytes = new TextEncoder().encode(DEV_FALLBACK);
  return cachedBytes;
}
