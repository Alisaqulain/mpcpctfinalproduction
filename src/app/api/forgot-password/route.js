// /src/app/api/forgot-password/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.text();
    const data = JSON.parse(body);

    const { step, email, phone, newPassword } = data;

    if (step === 1) {
      // Step 1: Verify email and phone
      if (!email || !phone) {
        return NextResponse.json({ success: false, message: "Email and phone are required" }, { status: 400 });
      }

      const user = await User.findOne({ email, phoneNumber: phone });
      if (!user) {
        return NextResponse.json({ success: false, message: "No user found with this email and phone" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    if (step === 2) {
      // Step 2: Update password
      if (!email || !phone || !newPassword) {
        return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
      }

      const user = await User.findOne({ email, phoneNumber: phone });
      if (!user) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "Invalid step" }, { status: 400 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
