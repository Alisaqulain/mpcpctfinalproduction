import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";
/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    return payload;
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return null;
  }
}

