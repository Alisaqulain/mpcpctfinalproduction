import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import { jwtVerify } from "jose";
import { randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    await dbConnect();
    const { subscriptionId } = await request.json();

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

    // Check if subscription is active
    if (subscription.status !== "active" || subscription.endDate < new Date()) {
      return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
    }

    // Generate or retrieve share token
    let shareToken = subscription.shareToken;
    if (!shareToken) {
      // Generate a unique token
      shareToken = randomBytes(32).toString('hex');
      
      // Ensure uniqueness (retry if collision)
      let attempts = 0;
      while (attempts < 5) {
        const existing = await Subscription.findOne({ shareToken });
        if (!existing) {
          break;
        }
        shareToken = randomBytes(32).toString('hex');
        attempts++;
      }
      
      subscription.shareToken = shareToken;
      await subscription.save();
    }

    // Generate share link - always use production domain for share links
    // This ensures share links work even when generated from localhost
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mpcpct.com';
    const shareLink = `${baseUrl}/shared-membership/activate?token=${shareToken}`;

    return NextResponse.json({ 
      success: true,
      shareLink,
      shareToken,
      subscriptionId: subscription._id
    });
  } catch (error) {
    console.error("Generate share link error:", error);
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 });
  }
}

