import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doubt from "@/lib/models/Doubt";
import Video from "@/lib/models/Video";
import { getAuth } from "@/lib/apiAuth";
import { userCanAccessVideo } from "@/lib/videoAccess";

export const runtime = "nodejs";

export async function POST(req) {
  const { user, error } = await getAuth(req);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const body = await req.json();
    const { videoId, timestampSeconds, message } = body;
    if (!videoId || message == null || timestampSeconds == null) {
      return NextResponse.json({ error: "videoId, timestampSeconds, message required" }, { status: 400 });
    }

    const video = await Video.findById(videoId).lean();
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const access = await userCanAccessVideo({ userId: user.userId, videoId });
    if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const doubt = await Doubt.create({
      userId: user.userId,
      videoId,
      timestampSeconds: Math.max(0, Math.floor(Number(timestampSeconds) || 0)),
      message: String(message).trim(),
      lastMessageAt: new Date(),
    });

    return NextResponse.json({ success: true, doubt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create doubt" }, { status: 500 });
  }
}

