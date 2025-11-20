import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { paymentId, orderId } = await request.json();

    if (!paymentId || !orderId) {
      return NextResponse.json({ error: "Payment ID and Order ID are required" }, { status: 400 });
    }

    // Use provided keys or environment variables
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_live_RhEZt1QyfrnZMU";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "FilatRbVAOk6lXV9hs6twLkW";

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay keys not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Verify payment with Razorpay
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const paymentData = await res.json();

    if (!res.ok) {
      return NextResponse.json({ 
        verified: false, 
        error: paymentData.error?.description || "Payment verification failed" 
      }, { status: res.status });
    }

    // Check if payment is successful
    if (paymentData.status === "captured" || paymentData.status === "authorized") {
      return NextResponse.json({ 
        verified: true, 
        payment: paymentData,
        status: paymentData.status
      });
    }

    // Payment not successful
    return NextResponse.json({ 
      verified: false, 
      status: paymentData.status,
      error: `Payment status: ${paymentData.status}` 
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}







