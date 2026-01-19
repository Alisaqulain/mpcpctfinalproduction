import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import SharedMembership from "@/lib/models/SharedMembership";
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
    const shareToken = searchParams.get("token");

    if (!shareToken) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    // Get subscription by share token
    const subscription = await Subscription.findOne({ shareToken })
      .populate("userId", "name email");
    
    if (!subscription) {
      return NextResponse.json({ 
        valid: false,
        error: "Invalid share token" 
      }, { status: 404 });
    }

    // Check if subscription is active
    if (subscription.status !== "active" || subscription.endDate < new Date()) {
      return NextResponse.json({ 
        valid: false,
        error: "This shared membership has expired" 
      }, { status: 400 });
    }

    // Check if user is the owner
    if (subscription.userId._id.toString() === payload.userId) {
      return NextResponse.json({ 
        valid: false,
        error: "You cannot activate your own shared membership",
        isOwner: true
      }, { status: 400 });
    }

    // Check if user has already activated
    const existingActivation = await SharedMembership.findOne({
      subscriptionId: subscription._id,
      sharedUserId: payload.userId
    });

    if (existingActivation) {
      return NextResponse.json({ 
        valid: false,
        error: "You have already activated this shared membership",
        alreadyActivated: true
      }, { status: 400 });
    }

    // Count existing activations
    const activationCount = await SharedMembership.countDocuments({
      subscriptionId: subscription._id
    });

    // Check if share limit is reached
    if (activationCount >= subscription.sharedLimit) {
      return NextResponse.json({ 
        valid: false,
        error: `Maximum share limit of ${subscription.sharedLimit} users has been reached`,
        limitReached: true
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      subscription: {
        _id: subscription._id,
        type: subscription.type,
        ownerName: subscription.userId.name
      },
      message: "🎁 You get 1 extra month FREE by joining this shared membership",
      remainingSlots: subscription.sharedLimit - activationCount
    });
  } catch (error) {
    console.error("Validate token error:", error);
    return NextResponse.json({ 
      valid: false,
      error: "Failed to validate share token" 
    }, { status: 500 });
  }
}















