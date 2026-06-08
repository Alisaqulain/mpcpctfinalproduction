import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { requirePhoneVerified } from "@/lib/apiAuth";
import { userCanAccessVideo } from "@/lib/videoAccess";
import { streamVideoFile } from "@/lib/videoStream";

export const runtime = "nodejs";

/** Legacy stream by publicId — redirects clients to use /api/videos/:id/stream */
export async function GET(req, { params }) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const { publicId } = await params;
    const video = await Video.findOne({ publicId }).select("+storagePath +filename +filePath").lean();
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const access = await userCanAccessVideo({ userId: auth.user.userId, videoId: video._id });
    if (!access.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
