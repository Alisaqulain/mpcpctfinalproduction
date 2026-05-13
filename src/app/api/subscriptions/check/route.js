import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";
export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    // Check if subscription exists for this payment
    const subscription = await Subscription.findOne({
      userId: payload.userId,
      paymentId
    });

    if (subscription) {
      return NextResponse.json({ 
        subscription: {
          _id: subscription._id,
          type: subscription.type,
          plan: subscription.plan,
          status: subscription.status,
          endDate: subscription.endDate
        }
      });
    }

    return NextResponse.json({ subscription: null });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}








