import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import User from "@/lib/models/User";
import { requirePhoneVerified } from "@/lib/apiAuth";
import { userCanAccessVideo } from "@/lib/videoAccess";
import { isValidObjectId } from "@/lib/objectId";
import { toPublicVideo } from "@/lib/videoStorage";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.message, reason: auth.reason },
      { status: auth.status }
    );
  }

  try {
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const video = await Video.findById(id)
      .select("+storagePath +filename +filePath")
      .lean();
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const access = await userCanAccessVideo({ userId: auth.user.userId, videoId: id });
    if (!access.ok) {
      return NextResponse.json({ error: "Forbidden", reason: access.reason }, { status: 403 });
    }

    const dbUser = auth.dbUser || (await User.findById(auth.user.userId).lean());
    const watermark = {
      name: dbUser?.name || auth.user.name || "Student",
      phone: dbUser?.phone || dbUser?.mobile || "",
      email: dbUser?.email || "",
    };

    const safe = toPublicVideo(video);
    const hasFile = !!(video.storagePath && video.filename) || !!video.filePath || !!video.publicId;

    return NextResponse.json({
      success: true,
      video: {
        ...safe,
        hasFile,
        streamPath: `/api/videos/${id}/stream`,
        watermark,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
