import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    await dbConnect();
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    // Find user by referral code
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    
    if (!referrer) {
      return NextResponse.json({ valid: false, error: "Invalid referral code" }, { status: 404 });
    }

    // Check if user is trying to use their own code
    if (referrer._id.toString() === payload.userId) {
      return NextResponse.json({ valid: false, error: "You cannot use your own referral code" }, { status: 400 });
    }

    // Check if user already used a referral code
    const currentUser = await User.findById(payload.userId);
    if (currentUser.referredBy) {
      return NextResponse.json({ valid: false, error: "You have already used a referral code" }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      referrerName: referrer.name,
      message: "Referral code is valid! You'll get 1 month free after subscription."
    });
  } catch (error) {
    console.error("Referral validation error:", error);
    return NextResponse.json({ error: "Failed to validate referral code" }, { status: 500 });
  }
}








