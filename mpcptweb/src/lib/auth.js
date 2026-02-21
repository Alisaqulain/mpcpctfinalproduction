import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return payload;
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return null;
  }
}

