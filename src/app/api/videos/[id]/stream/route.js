import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import VideoAccessLog from "@/lib/models/VideoAccessLog";
import User from "@/lib/models/User";
import { requirePhoneVerified } from "@/lib/apiAuth";
import { userCanAccessVideo } from "@/lib/videoAccess";
import { streamVideoFile } from "@/lib/videoStream";
import { isValidObjectId } from "@/lib/objectId";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message, reason: auth.reason }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
    }

    await dbConnect();
    const video = await Video.findById(id).select("+storagePath +filename +filePath").lean();
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const access = await userCanAccessVideo({ userId: auth.user.userId, videoId: id });
    if (!access.ok) {
      return NextResponse.json({ error: "Forbidden", reason: access.reason }, { status: 403 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";

    await VideoAccessLog.create({
      userId: auth.user.userId,
      videoId: id,
      courseId: video.courseId || undefined,
      ip,
      userAgent,
      watchedAt: new Date(),
      action: "play",
    });

    const rangeHeader = req.headers.get("range");
    const result = streamVideoFile(video, rangeHeader);
    if (result.error) {
      return NextResponse.json({ error: "Video file unavailable" }, { status: 404 });
    }
    return result.response;
  } catch (e) {
    console.error("stream error:", e);
    return NextResponse.json({ error: "Stream failed" }, { status: 500 });
  }
}
