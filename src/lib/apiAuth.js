import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";
export async function getAuth(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) return { user: null, error: "no_token" };
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    return { user: payload, error: null };
  } catch {
    return { user: null, error: "invalid_token" };
  }
}

export async function requireAdmin(request) {
  const { user, error } = await getAuth(request);
  if (error || !user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  if (user.role !== "admin") {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return { ok: true, user };
}
