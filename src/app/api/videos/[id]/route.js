import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { getAuth } from "@/lib/apiAuth";
import { userCanAccessVideo } from "@/lib/videoAccess";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { user, error } = await getAuth(req);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const { id } = await params;
    const video = await Video.findById(id).lean();
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const access = await userCanAccessVideo({ userId: user.userId, videoId: id });
    if (!access.ok) return NextResponse.json({ error: "Forbidden", reason: access.reason }, { status: 403 });

    // Do not leak filePath to clients
    const { filePath, ...safe } = video;
    return NextResponse.json({ success: true, video: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

