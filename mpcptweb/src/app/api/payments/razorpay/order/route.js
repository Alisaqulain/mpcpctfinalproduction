import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, currency = "INR", receipt } = await request.json();
    // Use provided keys or environment variables
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_live_RhEZt1QyfrnZMU";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "FilatRbVAOk6lXV9hs6twLkW";

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ amount: Number(amount) * 100, currency, receipt: receipt || `rcpt_${Date.now()}` }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.description || "Failed to create order" }, { status: res.status });
    }

    return NextResponse.json({ order: data, keyId });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
