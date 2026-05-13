import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/Otp";
import User from "@/lib/models/User";
import { getAuth } from "@/lib/apiAuth";

/** Forgot password: use POST /api/reset-password with mobile + OTP + newPassword (do not call verify-otp first). */
const PURPOSES = new Set(["verify_mobile", "signup"]);

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    const code = String(body.code || body.otp || "").trim();
    const purpose = PURPOSES.has(body.purpose) ? body.purpose : "verify_mobile";

    if (mobile.length < 10 || code.length < 4) {
      return NextResponse.json({ error: "Mobile and OTP required" }, { status: 400 });
    }

    const doc = await Otp.findOne({
      mobile,
      code,
      purpose,
      consumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!doc) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    doc.consumed = true;
    await doc.save();

    if (purpose === "verify_mobile") {
      const { user } = await getAuth(req);
      if (user?.userId) {
        await User.findByIdAndUpdate(user.userId, { $set: { isMobileVerified: true } });
      }
    }

    return NextResponse.json({ success: true, verified: true, purpose });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
