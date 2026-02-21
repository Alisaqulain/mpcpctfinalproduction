import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import Payment from "@/lib/models/Payment";
import User from "@/lib/models/User";
import { sendMail } from "@/lib/email";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const decoded = { userId: payload.userId };

    let { type, plan, amount, duration, paymentId, orderId } = await request.json();

    // Validate plan name mapping
    const planMapping = {
      oneMonth: "oneMonth",
      threeMonths: "threeMonths",
      sixMonths: "sixMonths"
    };
    
    // Map plan if needed
    if (planMapping[plan]) {
      plan = planMapping[plan];
    }

    if (!type || !plan || !amount || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Check if subscription already exists for this payment ID (prevent duplicates)
    if (paymentId) {
      const existingSubscription = await Subscription.findOne({ paymentId });
      if (existingSubscription) {
        return NextResponse.json({ 
          error: "Subscription already exists for this payment",
          subscription: {
            _id: existingSubscription._id,
            id: existingSubscription._id,
            type: existingSubscription.type,
            plan: existingSubscription.plan,
            endDate: existingSubscription.endDate,
          }
        }, { status: 400 });
      }

      // Also check Payment model for duplicate
      const existingPayment = await Payment.findOne({ 
        transactionId: paymentId,
        status: "completed"
      });
      if (existingPayment) {
        const existingSub = await Subscription.findById(existingPayment.subscriptionId);
        if (existingSub) {
          return NextResponse.json({ 
            error: "Payment already processed",
            subscription: {
              _id: existingSub._id,
              id: existingSub._id,
              type: existingSub.type,
              plan: existingSub.plan,
              endDate: existingSub.endDate,
            }
          }, { status: 400 });
        }
      }
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    // Create subscription
    console.log('Creating subscription with:', { type, plan, amount, duration, userId: decoded.userId });
    
    const subscription = new Subscription({
      userId: decoded.userId,
      type,
      status: "active",
      startDate: new Date(),
      endDate,
      plan,
      price: amount,
      paymentId: paymentId || `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Validate before saving
    const validationError = subscription.validateSync();
    if (validationError) {
      console.error('Subscription validation error details:', validationError.errors);
      return NextResponse.json({ 
        error: "Subscription validation failed", 
        details: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message
        }))
      }, { status: 400 });
    }

    await subscription.save();
    console.log('Subscription created successfully:', subscription._id);

    // Create payment record
    const payment = new Payment({
      userId: decoded.userId,
      subscriptionId: subscription._id,
      amount,
      currency: "INR",
      status: "completed",
      paymentMethod: "razorpay",
      transactionId: orderId || paymentId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gateway: "razorpay",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${plan} subscription`,
    });

    await payment.save();

    // Send confirmation email (best-effort)
    const user = await User.findById(decoded.userId);
    if (user?.email) {
      await sendMail({
        to: user.email,
        subject: `Subscription Activated: ${type} (${plan})`,
        html: `<p>Hi ${user.name || "User"},</p>
<p>Your subscription is now active.</p>
<ul>
  <li>Type: <strong>${type}</strong></li>
  <li>Plan: <strong>${plan}</strong></li>
  <li>Amount: <strong>₹${amount}</strong></li>
  <li>Valid till: <strong>${endDate.toDateString()}</strong></li>
</ul>
<p>Thank you for choosing us.</p>`,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      subscription: {
        _id: subscription._id,
        id: subscription._id,
        type: subscription.type,
        plan: subscription.plan,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
