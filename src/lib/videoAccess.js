import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import VideoCourse from "@/lib/models/VideoCourse";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";

function videoIsActive(video) {
  if (video.status === "inactive") return false;
  if (video.isActive === false) return false;
  return true;
}

async function hasActiveSubscription(userId, type) {
  const activeAll = await Subscription.findOne({
    userId,
    type: "all",
    status: "active",
    endDate: { $gt: new Date() },
  }).lean();
  if (activeAll) return true;
  if (!type || type === "all") return false;
  const sub = await Subscription.findOne({
    userId,
    type,
    status: "active",
    endDate: { $gt: new Date() },
  }).lean();
  return !!sub;
}

export async function userCanAccessVideo({ userId, videoId }) {
  await dbConnect();

  const user = await User.findById(userId).lean();
  if (!user) return { ok: false, reason: "user_not_found" };
  if (user.role === "admin") return { ok: true, reason: "admin" };

  const video = await Video.findById(videoId).lean();
  if (!video || !videoIsActive(video)) return { ok: false, reason: "video_not_found" };

  if (video.courseId) {
    const course = await VideoCourse.findById(video.courseId).lean();
    if (!course || course.isActive === false) {
      return { ok: false, reason: "course_not_available" };
    }
    const subType = course.subscriptionType || "learning";
    if (await hasActiveSubscription(userId, subType)) {
      return { ok: true, reason: "course_subscription" };
    }
  }

  if (video.accessType === "subscription") {
    const type = video.subscriptionType || "learning";
    if (await hasActiveSubscription(userId, type)) {
      return { ok: true, reason: "subscription" };
    }
    return { ok: false, reason: "no_subscription" };
  }

  const assigned = (video.assignedUsers || []).some((x) => String(x) === String(userId));
  if (assigned) return { ok: true, reason: "assigned" };
  return { ok: false, reason: "not_assigned" };
}
