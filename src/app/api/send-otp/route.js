import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/lib/models/Otp";
import { sendOtpSms } from "@/lib/sms";

const PURPOSES = new Set(["verify_mobile", "forgot_password", "signup"]);
const COOLDOWN_MS = 60_000;
const OTP_TTL_MS = 10 * 60_000;

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Rate limit: max 5 OTP / hour per mobile (simple window).
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    const purpose = PURPOSES.has(body.purpose) ? body.purpose : "verify_mobile";

    if (mobile.length < 10) {
      return NextResponse.json({ error: "Valid mobile required" }, { status: 400 });
    }

    const since = new Date(Date.now() - COOLDOWN_MS);
    const recent = await Otp.findOne({ mobile, createdAt: { $gte: since } }).sort({
      createdAt: -1,
    });
    if (recent) {
      return NextResponse.json(
        { error: "Please wait before requesting another OTP" },
        { status: 429 }
      );
    }

    const hourAgo = new Date(Date.now() - 3600_000);
    const hourCount = await Otp.countDocuments({ mobile, createdAt: { $gte: hourAgo } });
    if (hourCount >= 5) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        { status: 429 }
      );
    }

    const code = randomOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await Otp.create({ mobile, code, purpose, expiresAt });

    try {
      const r = await sendOtpSms(mobile, code);
      return NextResponse.json({
        success: true,
        message: "OTP sent",
        provider: r.provider,
        ...(r.devCode ? { devCode: r.devCode } : {}),
      });
    } catch (smsErr) {
      console.error("SMS failed:", smsErr);
      await Otp.deleteMany({ mobile, code });
      return NextResponse.json(
        { error: "Could not send SMS. Configure TWILIO_* or FAST2SMS_API_KEY." },
        { status: 503 }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
