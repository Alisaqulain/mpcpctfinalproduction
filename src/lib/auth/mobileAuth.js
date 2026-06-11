import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { createUserToken, attachAuthCookie } from "@/lib/auth/jwtCookie";
import { NextResponse } from "next/server";

export function normalizeMobile(mobile) {
  return String(mobile || "").replace(/\D/g, "").slice(-10);
}

/**
 * Find user by phone or create a minimal account after OTP verification.
 */
export async function loginOrRegisterByMobile(mobile) {
  await dbConnect();
  const m = normalizeMobile(mobile);
  if (m.length < 10) {
    return { ok: false, error: "Valid mobile required", status: 400 };
  }

  let user = await User.findOne({ phoneNumber: m });
  const isNewUser = !user;

  if (!user) {
    user = await User.create({
      name: `User ${m.slice(-4)}`,
      email: `u${m}@phone.mpcpct.in`,
      phoneNumber: m,
      isPhoneVerified: true,
      isMobileVerified: true,
      authProvider: "credentials",
    });
  } else {
    await User.findByIdAndUpdate(user._id, {
      $set: { isPhoneVerified: true, isMobileVerified: true },
    });
    user = await User.findById(user._id);
  }

  return { ok: true, user, isNewUser, mobile: m };
}

export async function attachUserSession(responseData, user, req) {
  const token = await createUserToken(user);
  const res = NextResponse.json(responseData);
  return attachAuthCookie(res, token, req);
}
