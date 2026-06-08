import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { createAndSendOtp } from "@/lib/otpService";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const result = await createAndSendOtp({
      mobile: body.mobile,
      email: body.email,
      purpose: body.purpose,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      providers: result.providers,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
