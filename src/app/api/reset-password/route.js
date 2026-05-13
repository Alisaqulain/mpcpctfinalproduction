import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/Otp";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

/**
 * Reset password after OTP (purpose forgot_password) verified in same request.
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    const code = String(body.code || body.otp || "").trim();
    const newPassword = body.newPassword;

    if (!mobile || !code || !newPassword || String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Mobile, OTP, and new password (min 6 chars) required" },
        { status: 400 }
      );
    }

    const doc = await Otp.findOne({
      mobile,
      code,
      purpose: "forgot_password",
      consumed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!doc) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    doc.consumed = true;
    await doc.save();

    const digits = mobile.length >= 10 ? mobile.slice(-10) : mobile;
    const user = await User.findOne({ phoneNumber: digits });
    if (!user) {
      return NextResponse.json({ error: "User not found for this mobile" }, { status: 404 });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
