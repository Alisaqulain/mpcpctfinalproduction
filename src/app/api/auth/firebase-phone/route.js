export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { getAuth } from "@/lib/apiAuth";
import {
  verifyFirebaseIdToken,
  phoneFromFirebaseClaims,
  isFirebaseAdminConfigured,
} from "@/lib/firebaseAdmin";
import { loginOrRegisterByMobile, attachUserSession } from "@/lib/auth/mobileAuth";
import { createUserToken, attachAuthCookie } from "@/lib/auth/jwtCookie";
import { createPasswordResetToken } from "@/lib/auth/passwordResetToken";

const PURPOSES = new Set(["login", "verify", "forgot_password"]);

export async function POST(req) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 503 });
    }

    await dbConnect();
    const body = await req.json();
    const purpose = PURPOSES.has(body.purpose) ? body.purpose : "login";
    const idToken = body.idToken;
    const redirectTo = body.redirectTo || body.returnTo || "/profile";

    const decoded = await verifyFirebaseIdToken(idToken);
    const mobile = phoneFromFirebaseClaims(decoded);

    if (mobile.length < 10) {
      return NextResponse.json({ error: "Invalid verified phone number" }, { status: 400 });
    }

    if (purpose === "forgot_password") {
      const user = await User.findOne({ phoneNumber: mobile });
      if (!user) {
        return NextResponse.json(
          { error: "No account found with this mobile number" },
          { status: 404 }
        );
      }
      const resetToken = await createPasswordResetToken(mobile);
      return NextResponse.json({
        success: true,
        verified: true,
        message: "Phone verified. You can set a new password.",
        resetToken,
        mobile,
      });
    }

    if (purpose === "verify") {
      const { user: session } = await getAuth(req);
      if (!session?.userId) {
        return NextResponse.json({ error: "Login required" }, { status: 401 });
      }

      const duplicate = await User.findOne({
        phoneNumber: mobile,
        _id: { $ne: session.userId },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
      }

      const dbUser = await User.findByIdAndUpdate(
        session.userId,
        {
          $set: {
            phoneNumber: mobile,
            isPhoneVerified: true,
            isMobileVerified: true,
          },
        },
        { new: true }
      );

      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const token = await createUserToken(dbUser);
      const res = NextResponse.json({
        success: true,
        verified: true,
        redirectTo,
        user: {
          id: dbUser._id,
          phoneNumber: dbUser.phoneNumber,
          isPhoneVerified: true,
        },
      });
      return attachAuthCookie(res, token, req);
    }

    const auth = await loginOrRegisterByMobile(mobile);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 400 });
    }

    return attachUserSession(
      {
        success: true,
        verified: true,
        isNewUser: auth.isNewUser,
        redirectTo,
        user: {
          id: auth.user._id,
          name: auth.user.name,
          phoneNumber: auth.user.phoneNumber,
          isPhoneVerified: true,
        },
      },
      auth.user,
      req
    );
  } catch (e) {
    console.error("[auth/firebase-phone]", e);
    const msg = e?.message || "Verification failed";
    const status = msg.includes("token") || msg.includes("Firebase") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
