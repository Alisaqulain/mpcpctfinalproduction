import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { createAndSendOtp, verifyOtp } from "@/lib/otpService";

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { step, channel, email, otp, newPassword } = data;

    const emailNorm = String(email || "").trim().toLowerCase();

    if (step === 1 || step === "send") {
      if (channel !== "email") {
        return NextResponse.json(
          { success: false, message: "Phone reset uses Firebase OTP on the forgot-password page" },
          { status: 400 }
        );
      }

      if (!emailNorm) {
        return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
      }
      const user = await User.findOne({ email: emailNorm });
      if (!user) {
        return NextResponse.json({ success: false, message: "No account found" }, { status: 404 });
      }
      const result = await createAndSendOtp({
        email: emailNorm,
        purpose: "reset_email",
      });
      if (!result.ok) {
        return NextResponse.json({ success: false, message: result.error }, { status: result.status });
      }
      return NextResponse.json({ success: true, message: "OTP sent to email" });
    }

    if (step === 2 || step === "reset") {
      if (!otp || !newPassword) {
        return NextResponse.json(
          { success: false, message: "OTP and new password required" },
          { status: 400 }
        );
      }
      if (String(newPassword).length < 8) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const verified = await verifyOtp({
        email: emailNorm,
        code: otp,
        purpose: "reset_email",
      });

      if (!verified.ok) {
        return NextResponse.json({ success: false, message: verified.error }, { status: verified.status });
      }

      const user = await User.findOne({ email: emailNorm });
      if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.authProvider = user.authProvider || "credentials";
      await user.save();

      return NextResponse.json({ success: true, message: "Password updated" });
    }

    return NextResponse.json({ success: false, message: "Invalid step" }, { status: 400 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ success: false, message: "Request failed" }, { status: 500 });
  }
}
