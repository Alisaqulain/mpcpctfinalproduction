import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import SharedMembership from "@/lib/models/SharedMembership";
import User from "@/lib/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    // Get subscription and verify ownership
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Verify user owns this subscription
    if (subscription.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized: You don't own this subscription" }, { status: 403 });
    }

    // Get all activations for this subscription
    const activations = await SharedMembership.find({
      subscriptionId: subscription._id
    })
    .populate("sharedUserId", "name email")
    .sort({ activatedAt: -1 });

    const activationCount = activations.length;
    const sharedLimit = subscription.sharedLimit || 3;

    // Determine reward status
    let rewardStatus = "pending";
    let rewardMessage = "Owner reward pending (activate all 3 users to unlock)";
    
    if (subscription.ownerRewardGranted) {
      rewardStatus = "granted";
      rewardMessage = "🎉 Reward unlocked: +1 month added to your plan";
    } else if (activationCount === sharedLimit) {
      rewardStatus = "eligible";
      rewardMessage = "All users activated! Reward will be granted shortly.";
    }

    return NextResponse.json({
      success: true,
      subscription: {
        _id: subscription._id,
        endDate: subscription.endDate,
        ownerRewardGranted: subscription.ownerRewardGranted,
        shareToken: subscription.shareToken || null
      },
      progress: {
        activated: activationCount,
        limit: sharedLimit,
        remaining: Math.max(0, sharedLimit - activationCount),
        usage: `${activationCount}/${sharedLimit}${activationCount === sharedLimit ? ' ✅' : ''}`
      },
      rewardStatus: {
        status: rewardStatus,
        message: rewardMessage,
        granted: subscription.ownerRewardGranted
      },
      activations: activations.map(act => ({
        _id: act._id,
        sharedUser: {
          name: act.sharedUserId?.name || "Unknown",
          email: act.sharedUserId?.email || "Unknown"
        },
        activatedAt: act.activatedAt
      }))
    });
  } catch (error) {
    console.error("Get share progress error:", error);
    return NextResponse.json({ error: "Failed to fetch share progress" }, { status: 500 });
  }
}

