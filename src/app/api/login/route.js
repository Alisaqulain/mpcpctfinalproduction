import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

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

    // ✅ Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Generate JWT token using jose
    const token = await new SignJWT({ 
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role || "user"
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    // ✅ Create response with user data
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileUrl: user.profileUrl,
        role: user.role || "user",
      }
    });

    // ✅ Set JWT token as HTTP-only cookie
    // Check if request is over HTTPS (for secure cookie)
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || 
                    req.url?.startsWith('https://') ||
                    process.env.NEXT_PUBLIC_FORCE_SECURE_COOKIE === 'true';
    
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isHttps, // Only set secure if actually using HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
