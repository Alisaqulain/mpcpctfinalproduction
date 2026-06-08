import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { phoneNumber, password } = body;

    // ✅ Validate input
    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "Phone number and password required" }, { status: 400 });
    }

    // ✅ Find user by phone number
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            user.authProvider === "google"
              ? "This account uses Google sign-in. Please continue with Google."
              : "Password not set. Use forgot password.",
        },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { createUserToken, attachAuthCookie } = await import("@/lib/auth/jwtCookie");
    const token = await createUserToken(user);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileUrl: user.profileUrl || user.avatar,
        role: user.role || "user",
        isPhoneVerified: !!(user.isPhoneVerified || user.isMobileVerified),
      },
      redirectTo:
        user.isPhoneVerified || user.isMobileVerified ? null : "/verify-phone",
    });

    return attachAuthCookie(response, token, req);
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
