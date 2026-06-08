import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doubt from "@/lib/models/Doubt";
import Video from "@/lib/models/Video";
import { requirePhoneVerified } from "@/lib/apiAuth";
import { userCanAccessVideo } from "@/lib/videoAccess";
import { isValidObjectId } from "@/lib/objectId";
import { sanitizeMessage } from "@/lib/sanitize";
import { rateLimitDoubtCreate } from "@/lib/doubtRateLimit";

export const runtime = "nodejs";

export async function GET(req) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    if (!videoId || !isValidObjectId(videoId)) {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    const access = await userCanAccessVideo({ userId: auth.user.userId, videoId });
    if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const query =
      auth.user.role === "admin"
        ? { videoId }
        : { videoId, userId: auth.user.userId };

    const doubts = await Doubt.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, doubts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load doubts" }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message, reason: auth.reason }, { status: auth.status });
  }
  const user = auth.user;

  if (!rateLimitDoubtCreate(user.userId)) {
    return NextResponse.json({ error: "Too many doubts. Try again later." }, { status: 429 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const { videoId, timestamp, timestampSeconds, message, attachment, attachmentUrl } = body;
    const ts = Math.max(0, Math.floor(Number(timestamp ?? timestampSeconds) || 0));
    const msg = sanitizeMessage(message);

    if (!videoId || !isValidObjectId(videoId) || !msg) {
      return NextResponse.json(
        { error: "videoId, timestamp, and message required" },
        { status: 400 }
      );
    }

    const video = await Video.findById(videoId).lean();
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const access = await userCanAccessVideo({ userId: user.userId, videoId });
    if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const att = attachment || attachmentUrl || "";
    const doubt = await Doubt.create({
      userId: user.userId,
      courseId: video.courseId,
      videoId,
      timestamp: ts,
      timestampSeconds: ts,
      message: msg,
      attachment: att,
      attachmentUrl: att,
      status: "pending",
      lastMessageAt: new Date(),
      messages: [
        {
          senderId: user.userId,
          senderRole: "user",
          message: msg,
          attachment: att,
          createdAt: new Date(),
        },
      ],
    });

    return NextResponse.json({ success: true, doubt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create doubt" }, { status: 500 });
  }
}
