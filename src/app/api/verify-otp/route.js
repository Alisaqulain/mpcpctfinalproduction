import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { getAuth } from "@/lib/apiAuth";
import { verifyOtp } from "@/lib/otpService";
import { createUserToken, attachAuthCookie } from "@/lib/auth/jwtCookie";

const PURPOSES = new Set(["verify_mobile", "signup", "reset_phone"]);

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const purpose = PURPOSES.has(body.purpose) ? body.purpose : "verify_mobile";

    const result = await verifyOtp({
      mobile: body.mobile,
      email: body.email,
      code: body.code || body.otp,
      purpose,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    const mobile = String(body.mobile || "").replace(/\D/g, "").slice(-10);

    if (purpose === "verify_mobile" || purpose === "signup" || purpose === "reset_phone") {
      const { user } = await getAuth(req);
      if (user?.userId && mobile.length >= 10) {
        const duplicate = await User.findOne({
          phoneNumber: new RegExp(`${mobile}$`),
          _id: { $ne: user.userId },
        });
        if (duplicate) {
          return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
        }
        const dbUser = await User.findByIdAndUpdate(
          user.userId,
          {
            $set: {
              phoneNumber: mobile,
              isPhoneVerified: true,
              isMobileVerified: true,
            },
          },
          { new: true }
        );
        if (dbUser) {
          const token = await createUserToken(dbUser);
          const res = NextResponse.json({ success: true, verified: true, purpose });
          return attachAuthCookie(res, token, req);
        }
      }
      if (mobile.length >= 10) {
        await User.updateMany(
          { phoneNumber: new RegExp(`${mobile}$`) },
          { $set: { isPhoneVerified: true, isMobileVerified: true } }
        );
      }
    }

    return NextResponse.json({ success: true, verified: true, purpose });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
