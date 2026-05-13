import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";

export async function userCanAccessVideo({ userId, videoId }) {
  await dbConnect();

  const user = await User.findById(userId).lean();
  if (!user) return { ok: false, reason: "user_not_found" };
  if (user.role === "admin") return { ok: true, reason: "admin" };

  const video = await Video.findById(videoId).lean();
  if (!video || video.isActive === false) return { ok: false, reason: "video_not_found" };

  if (video.accessType === "subscription") {
    const type = video.subscriptionType || "learning";
    const subscription =
      (await Subscription.findOne({
        userId,
        type: "all",
        status: "active",
        endDate: { $gt: new Date() },
      }).lean()) ||
      (await Subscription.findOne({
        userId,
        type,
        status: "active",
        endDate: { $gt: new Date() },
      }).lean());
    if (subscription) return { ok: true, reason: "subscription" };
    return { ok: false, reason: "no_subscription" };
  }

  const assigned = (video.assignedUsers || []).some((x) => String(x) === String(userId));
  if (assigned) return { ok: true, reason: "assigned" };
  return { ok: false, reason: "not_assigned" };
}

