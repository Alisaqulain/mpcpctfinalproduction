import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import User from "@/lib/models/User";
import { requireAdmin } from "@/lib/apiAuth";

export const runtime = "nodejs";

/**
 * POST /api/videos/assign
 * body: { videoId, mode: 'single'|'bulk'|'subscription', userIds?:[], subscriptionType?: 'learning'|'exam'|'all' }
 */
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    await dbConnect();
    const body = await req.json();
    const { videoId, mode, userIds, subscriptionType } = body;
    if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

    const video = await Video.findById(videoId);
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    if (mode === "subscription") {
      video.accessType = "subscription";
      video.subscriptionType = subscriptionType || "learning";
      video.assignedUsers = [];
      await video.save();
      return NextResponse.json({ success: true, video });
    }

    const ids = Array.isArray(userIds) ? userIds : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "userIds required for single/bulk" }, { status: 400 });
    }

    const existingUsers = await User.find({ _id: { $in: ids } }).select({ _id: 1 }).lean();
    const okIds = existingUsers.map((u) => u._id);

    video.accessType = ids.length === 1 ? "single" : "bulk";
    video.assignedUsers = Array.from(new Set([...video.assignedUsers.map(String), ...okIds.map(String)])).map(
      (x) => x
    );
    await video.save();

    return NextResponse.json({ success: true, video, assignedCount: okIds.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to assign video" }, { status: 500 });
  }
}

