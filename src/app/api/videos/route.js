import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import VideoCourse from "@/lib/models/VideoCourse";
import { getAuth } from "@/lib/apiAuth";
import Subscription from "@/lib/models/Subscription";
import { toPublicVideo } from "@/lib/videoStorage";

export const runtime = "nodejs";

function activeFilter() {
  return {
    $or: [{ status: "active" }, { status: { $exists: false }, isActive: { $ne: false } }],
  };
}

export async function GET(req) {
  const { user, error } = await getAuth(req);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    if (user.role === "admin") {
      const videos = await Video.find({}).sort({ order: 1, createdAt: -1 }).lean();
      return NextResponse.json({
        success: true,
        videos: videos.map(toPublicVideo),
      });
    }

    const assignedQuery = {
      ...activeFilter(),
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

    const activeExam = await Subscription.findOne({
      userId: user.userId,
      type: "exam",
      status: "active",
      endDate: { $gt: new Date() },
    }).lean();

    const subTypes = [];
    if (activeAll) subTypes.push("learning", "exam", "all");
    else {
      if (activeLearning) subTypes.push("learning");
      if (activeExam) subTypes.push("exam");
    }

    const subQuery =
      subTypes.length > 0
        ? {
            ...activeFilter(),
            accessType: "subscription",
            subscriptionType: { $in: subTypes },
          }
        : null;

    let courseVideos = [];
    if (subTypes.length > 0) {
      const courses = await VideoCourse.find({
        isActive: true,
        subscriptionType: { $in: subTypes },
      })
        .select("_id")
        .lean();
      const courseIds = courses.map((c) => c._id);
      if (courseIds.length) {
        courseVideos = await Video.find({
          ...activeFilter(),
          courseId: { $in: courseIds },
        })
          .sort({ order: 1, createdAt: -1 })
          .lean();
      }
    }

    const [assigned, subs] = await Promise.all([
      Video.find(assignedQuery).sort({ order: 1, createdAt: -1 }).lean(),
      subQuery ? Video.find(subQuery).sort({ order: 1, createdAt: -1 }).lean() : [],
    ]);

    const map = new Map();
    for (const v of [...assigned, ...subs, ...courseVideos]) {
      map.set(String(v._id), toPublicVideo(v));
    }
    return NextResponse.json({ success: true, videos: Array.from(map.values()) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load videos" }, { status: 500 });
  }
}
