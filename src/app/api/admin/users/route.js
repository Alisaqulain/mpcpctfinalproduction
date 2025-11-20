import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";
import Referral from "@/lib/models/Referral";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch all users with their subscriptions and referral stats
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    
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







