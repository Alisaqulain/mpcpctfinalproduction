import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { normalizeMobile } from "@/lib/auth/mobileAuth";
import { verifyPasswordResetToken } from "@/lib/auth/passwordResetToken";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const mobile = normalizeMobile(body.mobile);
    const resetToken = body.resetToken;
    const newPassword = String(body.newPassword || "");

    if (mobile.length < 10) {
      return NextResponse.json({ error: "Valid mobile required" }, { status: 400 });
    }
    if (!resetToken) {
      return NextResponse.json({ error: "Reset token required. Verify OTP first." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const tokenCheck = await verifyPasswordResetToken(resetToken, mobile);
    if (!tokenCheck.ok) {
      return NextResponse.json({ error: tokenCheck.error }, { status: 401 });
    }

    const user = await User.findOne({ phoneNumber: mobile });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.authProvider = user.authProvider || "credentials";
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (e) {
    console.error("[auth/reset-password]", e);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
