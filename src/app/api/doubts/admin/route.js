import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doubt from "@/lib/models/Doubt";
import User from "@/lib/models/User";
import Video from "@/lib/models/Video";
import VideoCourse from "@/lib/models/VideoCourse";
import { requireAdmin } from "@/lib/apiAuth";
import { isValidObjectId } from "@/lib/objectId";

export const runtime = "nodejs";

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");
    const videoId = searchParams.get("videoId");
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const query = {};
    if (status) query.status = status;
    if (courseId && isValidObjectId(courseId)) query.courseId = courseId;
    if (videoId && isValidObjectId(videoId)) query.videoId = videoId;
    if (userId && isValidObjectId(userId)) query.userId = userId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const [doubts, pendingCount] = await Promise.all([
      Doubt.find(query).sort({ lastMessageAt: -1, createdAt: -1 }).limit(300).lean(),
      Doubt.countDocuments({
        status: { $in: ["pending", "open"] },
      }),
    ]);

    const userIds = [...new Set(doubts.map((d) => String(d.userId)))];
    const videoIds = [...new Set(doubts.map((d) => String(d.videoId)))];
    const courseIds = [
      ...new Set(doubts.filter((d) => d.courseId).map((d) => String(d.courseId))),
    ];

    const [users, videos, courses] = await Promise.all([
      User.find({ _id: { $in: userIds } })
        .select("name email phone mobile")
        .lean(),
      Video.find({ _id: { $in: videoIds } })
        .select("title courseId")
        .lean(),
      courseIds.length
        ? VideoCourse.find({ _id: { $in: courseIds } })
            .select("title")
            .lean()
        : [],
    ]);

    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
    const videoMap = Object.fromEntries(videos.map((v) => [String(v._id), v]));
    const courseMap = Object.fromEntries(courses.map((c) => [String(c._id), c]));

    const enriched = doubts.map((d) => ({
      ...d,
      user: userMap[String(d.userId)] || null,
      video: videoMap[String(d.videoId)] || null,
      course: d.courseId ? courseMap[String(d.courseId)] || null : null,
    }));

    return NextResponse.json({ success: true, doubts: enriched, pendingCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load doubts" }, { status: 500 });
  }
}
