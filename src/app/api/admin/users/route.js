import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";
import Referral from "@/lib/models/Referral";
import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch all users (exclude password) with their subscriptions and referral stats
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Get subscription counts and referral stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const subscriptions = await Subscription.find({ userId: user._id });
        const activeSubscriptions = subscriptions.filter(
          sub => sub.status === "active" && new Date(sub.endDate) > new Date()
        );

        const referralsGiven = await Referral.countDocuments({ referrerId: user._id });
        const referralsReceived = await Referral.countDocuments({ referredUserId: user._id });

        return {
          ...user,
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: activeSubscriptions.length,
          subscriptions: activeSubscriptions,
          referralsGiven,
          referralsReceived,
          referralRewards: user.referralRewards || 0
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}








