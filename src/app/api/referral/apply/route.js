import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Referral from "@/lib/models/Referral";
import Subscription from "@/lib/models/Subscription";
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
    const { referralCode, subscriptionId } = await request.json();

    if (!referralCode || !subscriptionId) {
      return NextResponse.json({ error: "Referral code and subscription ID are required" }, { status: 400 });
    }

    // Find referrer
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const currentUser = await User.findById(payload.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already used
    if (currentUser.referredBy) {
      return NextResponse.json({ error: "Referral code already used" }, { status: 400 });
    }

    // Get subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Update referred user - add 1 month to subscription (always give this)
    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
    const newEndDate = new Date(Math.max(new Date(subscription.endDate).getTime(), Date.now()) + oneMonthInMs);
    subscription.endDate = newEndDate;
    await subscription.save();

    // Update user's referredBy
    currentUser.referredBy = referrer._id;
    await currentUser.save();

    // Create referral record first (before counting)
    const referralRecord = await Referral.create({
      referrerId: referrer._id,
      referredUserId: currentUser._id,
      referralCode: referralCode.toUpperCase(),
      status: "completed",
      referrerRewardMonths: 0, // Will be updated if referrer gets reward
      referredRewardMonths: 1,
      subscriptionId: subscription._id
    });

    // Check if referrer has a paid course (active subscription that's not a referral reward)
    let referrerHasPaidCourse = false;
    let referrerSubscription = await Subscription.findOne({
      userId: referrer._id,
      type: "all",
      status: "active",
      endDate: { $gt: new Date() },
      plan: { $ne: "referral_reward" } // Exclude referral rewards as "paid"
    });

    if (!referrerSubscription) {
      referrerSubscription = await Subscription.findOne({
        userId: referrer._id,
        status: "active",
        endDate: { $gt: new Date() },
        plan: { $ne: "referral_reward" } // Exclude referral rewards as "paid"
      });
    }

    if (referrerSubscription) {
      referrerHasPaidCourse = true;
    }

    // Count completed referrals for this referrer
    const completedReferralsCount = await Referral.countDocuments({
      referrerId: referrer._id,
      status: "completed"
    });

    let referrerRewardGiven = false;
    let referrerRewardMonths = 0;

    // Only give referrer reward if they have paid course AND this is their 3rd referral
    if (referrerHasPaidCourse && completedReferralsCount === 3) {
      // Give referrer 1 month free
      const referrerNewEndDate = new Date(Math.max(new Date(referrerSubscription.endDate).getTime(), Date.now()) + oneMonthInMs);
      referrerSubscription.endDate = referrerNewEndDate;
      await referrerSubscription.save();
      referrerRewardGiven = true;
      referrerRewardMonths = 1;

      // Update referral record with referrer reward
      referralRecord.referrerRewardMonths = 1;
      await referralRecord.save();
    }

    // Update referrer's reward count
    referrer.referralRewards = completedReferralsCount;
    await referrer.save();

    // Prepare response message
    let message = "Referral code applied! You got 1 month free!";
    if (referrerRewardGiven) {
      message += " The referrer also got 1 month free for reaching 3 referrals!";
    } else if (referrerHasPaidCourse) {
      const remainingReferrals = 3 - completedReferralsCount;
      if (remainingReferrals > 0) {
        message += ` The referrer needs ${remainingReferrals} more ${remainingReferrals === 1 ? 'referral' : 'referrals'} to get 1 month free.`;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: message,
      referrerRewardGiven,
      referrerRewardMonths
    });
  } catch (error) {
    console.error("Referral apply error:", error);
    return NextResponse.json({ error: "Failed to apply referral code" }, { status: 500 });
  }
}

