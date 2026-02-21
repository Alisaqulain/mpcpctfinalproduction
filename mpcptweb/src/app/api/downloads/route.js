import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Download from "@/lib/models/Download";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    // Check if user is authenticated and has membership
    let hasMembership = false;
    let isAdmin = false;
    
    try {
      const token = req.cookies.get("token")?.value;
      if (token) {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const userId = payload?.userId;
        
        if (userId) {
          const user = await User.findById(userId);
          if (user?.role === "admin") {
            isAdmin = true;
            hasMembership = true;
          } else {
            // Check for active subscription
            const subscription = await Subscription.findOne({
              userId,
              status: "active",
              endDate: { $gt: new Date() }
            });
            hasMembership = !!subscription;
          }
        }
      }
    } catch (error) {
      // User not authenticated or invalid token - will only see free content
      hasMembership = false;
    }
    
    const filter = {};
    if (type) filter.type = type;
    
    // If user doesn't have membership, only show free downloads
    if (!hasMembership) {
      filter.isFree = true;
    }
    
    const downloads = await Download.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    
    return NextResponse.json({ downloads, hasMembership });
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch downloads' }, { status: 500 });
  }
}

