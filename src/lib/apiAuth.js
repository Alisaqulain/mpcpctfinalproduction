import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

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

/** Logged in + phone verified (admins exempt). */
export async function requirePhoneVerified(request) {
  const { user, error } = await getAuth(request);
  if (error || !user) {
    return { ok: false, status: 401, message: "Unauthorized", reason: error };
  }
  if (user.role === "admin") {
    return { ok: true, user, dbUser: null };
  }

  await dbConnect();
  const dbUser = await User.findById(user.userId).lean();
  if (!dbUser) {
    return { ok: false, status: 401, message: "User not found" };
  }

  const verified = dbUser.isPhoneVerified || dbUser.isMobileVerified;
  if (!verified) {
    return {
      ok: false,
      status: 403,
      message: "Phone verification required",
      reason: "phone_not_verified",
    };
  }

  return { ok: true, user, dbUser };
}
