import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { getAuth } from "@/lib/apiAuth";
import Subscription from "@/lib/models/Subscription";

export const runtime = "nodejs";

export async function GET(req) {
  const { user, error } = await getAuth(req);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    // Admin sees all
    if (user.role === "admin") {
      const videos = await Video.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json({ success: true, videos });
    }

    // User gets assigned videos OR subscription videos (if subscription active)
    const assignedQuery = {
      isActive: true,
      accessType: { $in: ["single", "bulk"] },
      assignedUsers: user.userId,
    };

    const activeAll = await Subscription.findOne({
      userId: user.userId,
      type: "all",
      status: "active",
      endDate: { $gt: new Date() },
    }).lean();

    const activeLearning = await Subscription.findOne({
      userId: user.userId,
      type: "learning",
      status: "active",
      endDate: { $gt: new Date() },
    }).lean();

    const subsOk = !!(activeAll || activeLearning);
    const subQuery = subsOk
      ? {
          isActive: true,
          accessType: "subscription",
          subscriptionType: { $in: activeAll ? ["learning", "exam", "all"] : ["learning"] },
        }
      : null;

    const [assigned, subs] = await Promise.all([
      Video.find(assignedQuery).sort({ createdAt: -1 }).lean(),
      subQuery ? Video.find(subQuery).sort({ createdAt: -1 }).lean() : Promise.resolve([]),
    ]);

    // de-dupe
    const map = new Map();
    for (const v of [...assigned, ...subs]) map.set(String(v._id), v);
    return NextResponse.json({ success: true, videos: Array.from(map.values()) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
  }
}

