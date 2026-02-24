import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import SharedMembership from "@/lib/models/SharedMembership";
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
    const { shareToken } = await request.json();

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    // Get subscription by share token
    const subscription = await Subscription.findOne({ shareToken });
    if (!subscription) {
      return NextResponse.json({ error: "Invalid share token" }, { status: 404 });
    }

    // Check if subscription is active
    if (subscription.status !== "active" || subscription.endDate < new Date()) {
      return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
    }

    const currentUser = await User.findById(payload.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent owner from activating their own subscription
    if (subscription.userId.toString() === payload.userId) {
      return NextResponse.json({ 
        error: "You cannot activate your own shared membership" 
      }, { status: 400 });
    }

    // Check if user has already activated this subscription
    const existingActivation = await SharedMembership.findOne({
      subscriptionId: subscription._id,
      sharedUserId: payload.userId
    });

    if (existingActivation) {
      return NextResponse.json({ 
        error: "You have already activated this shared membership" 
      }, { status: 400 });
    }

    // Count existing activations
    const activationCount = await SharedMembership.countDocuments({
      subscriptionId: subscription._id
    });

    // Check if share limit is reached
    if (activationCount >= subscription.sharedLimit) {
      return NextResponse.json({ 
        error: `Maximum share limit of ${subscription.sharedLimit} users has been reached` 
      }, { status: 400 });
    }

    // Grant +1 month to shared user
    // Find or create active subscription for shared user
    let sharedUserSubscription = await Subscription.findOne({
      userId: payload.userId,
      type: subscription.type,
      status: "active",
      endDate: { $gt: new Date() }
    }).sort({ endDate: -1 });

    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
    const newEndDate = new Date(Math.max(
      sharedUserSubscription ? new Date(sharedUserSubscription.endDate).getTime() : Date.now(),
      Date.now()
    ) + oneMonthInMs);

    if (sharedUserSubscription) {
      // Extend existing subscription
      sharedUserSubscription.endDate = newEndDate;
      await sharedUserSubscription.save();
    } else {
      // Create new subscription for shared user
      sharedUserSubscription = await Subscription.create({
        userId: payload.userId,
        type: subscription.type,
        status: "active",
        startDate: new Date(),
        endDate: newEndDate,
        plan: "shared_membership",
        price: 0,
        paymentId: `SHARED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }

    // Create activation record
    const sharedMembership = await SharedMembership.create({
      subscriptionId: subscription._id,
      sharedUserId: payload.userId,
      activatedAt: new Date(),
      sharedUserSubscriptionId: sharedUserSubscription._id
    });

    // Check if all 3 users have activated and grant owner reward
    const newActivationCount = await SharedMembership.countDocuments({
      subscriptionId: subscription._id
    });

    if (newActivationCount === subscription.sharedLimit && !subscription.ownerRewardGranted) {
      // Grant owner +1 month
      const ownerSubscription = await Subscription.findById(subscription._id);
      if (ownerSubscription) {
        const ownerNewEndDate = new Date(Math.max(
          new Date(ownerSubscription.endDate).getTime(),
          Date.now()
        ) + oneMonthInMs);
        
        ownerSubscription.endDate = ownerNewEndDate;
        ownerSubscription.ownerRewardGranted = true;
        await ownerSubscription.save();
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Shared membership activated successfully! You received +1 month added to your plan.",
      activationId: sharedMembership._id,
      newEndDate: sharedUserSubscription.endDate
    });
  } catch (error) {
    console.error("Activate shared membership error:", error);
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "You have already activated this shared membership" 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to activate shared membership" }, { status: 500 });
  }
}
















