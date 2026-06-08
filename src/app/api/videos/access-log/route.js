import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import VideoAccessLog from "@/lib/models/VideoAccessLog";
import Video from "@/lib/models/Video";
import { requirePhoneVerified } from "@/lib/apiAuth";
import { userCanAccessVideo } from "@/lib/videoAccess";
import { isValidObjectId } from "@/lib/objectId";

export const runtime = "nodejs";

const ALLOWED_ACTIONS = new Set(["play", "pause", "seek", "complete", "view"]);

export async function POST(req) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { videoId, action, lastPosition, courseId } = body;
    if (!isValidObjectId(videoId)) {
      return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
    }

    const access = await userCanAccessVideo({ userId: auth.user.userId, videoId });
    if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const video = await Video.findById(videoId).lean();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    await VideoAccessLog.create({
      userId: auth.user.userId,
      videoId,
      courseId: courseId || video?.courseId,
      ip,
      userAgent: req.headers.get("user-agent") || "",
      watchedAt: new Date(),
      lastPosition: Math.max(0, Number(lastPosition) || 0),
      action: ALLOWED_ACTIONS.has(action) ? action : "view",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to log" }, { status: 500 });
  }
}
