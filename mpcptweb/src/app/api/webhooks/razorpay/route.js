import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const payload = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!secret) return NextResponse.json({ error: "No webhook secret set" }, { status: 500 });

    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payload);
    // Handle events: payment.captured, order.paid, subscription.activated, etc.
    // TODO: mark payment/subscription accordingly

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
