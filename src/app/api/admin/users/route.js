import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";
import Referral from "@/lib/models/Referral";
import UserFile from "@/lib/models/UserFile";
import UserTopicAssignment from "@/lib/models/UserTopicAssignment";
import UserExercise from "@/lib/models/UserExercise";
import Payment from "@/lib/models/Payment";
import Doubt from "@/lib/models/Doubt";
import ChatMessage from "@/lib/models/ChatMessage";
import VideoAccessLog from "@/lib/models/VideoAccessLog";
import SharedMembership from "@/lib/models/SharedMembership";
import TypingResult from "@/lib/models/TypingResult";
import Result from "@/lib/models/Result";
import Video from "@/lib/models/Video";
import { requireAdmin } from "@/lib/apiAuth";

async function assertAdmin(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return { error: NextResponse.json({ error: auth.message }, { status: auth.status }) };
  }
  return { admin: auth.user };
}

export async function GET(request) {
  try {
    const gate = await assertAdmin(request);
    if (gate.error) return gate.error;

    await dbConnect();

    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const subscriptions = await Subscription.find({ userId: user._id });
        const activeSubscriptions = subscriptions.filter(
          (sub) => sub.status === "active" && new Date(sub.endDate) > new Date()
        );

        const referralsGiven = await Referral.countDocuments({ referrerId: user._id });
        const referralsReceived = await Referral.countDocuments({ referredUserId: user._id });

        return {
          ...user,
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: activeSubscriptions.length,
          subscriptions: activeSubscriptions,
          referralsGiven,
          referralsReceived,
          referralRewards: user.referralRewards || 0,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

async function purgeUserRelatedData(userIds) {
  const ids = userIds.map((id) => new mongoose.Types.ObjectId(id));
  const idStrings = ids.map((id) => id.toString());

  await Promise.all([
    Subscription.deleteMany({ userId: { $in: ids } }),
    Referral.deleteMany({
      $or: [{ referrerId: { $in: ids } }, { referredUserId: { $in: ids } }],
    }),
    UserFile.deleteMany({ userId: { $in: ids } }),
    UserTopicAssignment.deleteMany({ userId: { $in: ids } }),
    UserExercise.deleteMany({ userId: { $in: ids } }),
    Payment.deleteMany({ userId: { $in: ids } }),
    Doubt.deleteMany({ userId: { $in: ids } }),
    ChatMessage.deleteMany({ senderId: { $in: ids } }),
    VideoAccessLog.deleteMany({ userId: { $in: ids } }),
    SharedMembership.deleteMany({ sharedUserId: { $in: ids } }),
    TypingResult.deleteMany({ userId: { $in: idStrings } }),
    Result.deleteMany({ userId: { $in: idStrings } }),
    User.updateMany({ referredBy: { $in: ids } }, { $unset: { referredBy: 1 } }),
    Video.updateMany({}, { $pull: { assignedUsers: { $in: ids } } }),
  ]);
}

export async function DELETE(request) {
  try {
    const gate = await assertAdmin(request);
    if (gate.error) return gate.error;

    const body = await request.json();
    const rawIds = Array.isArray(body.userIds) ? body.userIds : body.userId ? [body.userId] : [];

    const userIds = [...new Set(rawIds.map((id) => String(id).trim()).filter(Boolean))];
    if (!userIds.length) {
      return NextResponse.json({ error: "userIds array required" }, { status: 400 });
    }

    await dbConnect();

    const currentAdminId = gate.admin.userId;
    const objectIds = userIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (!objectIds.length) {
      return NextResponse.json({ error: "No valid user IDs" }, { status: 400 });
    }

    const targets = await User.find({ _id: { $in: objectIds } }).select("_id role name email").lean();

    const skipped = [];
    const toDelete = [];

    for (const u of targets) {
      const id = u._id.toString();
      if (u.role === "admin") {
        skipped.push({ id, reason: "admin accounts cannot be deleted" });
        continue;
      }
      if (id === currentAdminId) {
        skipped.push({ id, reason: "cannot delete your own account" });
        continue;
      }
      toDelete.push(id);
    }

    const notFound = userIds.filter(
      (id) => !targets.some((u) => u._id.toString() === id)
    );

    if (!toDelete.length) {
      return NextResponse.json(
        {
          success: false,
          deleted: 0,
          skipped,
          notFound,
          error: "No users eligible for deletion",
        },
        { status: 400 }
      );
    }

    await purgeUserRelatedData(toDelete);
    const result = await User.deleteMany({ _id: { $in: toDelete.map((id) => new mongoose.Types.ObjectId(id)) } });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount || 0,
      skipped,
      notFound,
    });
  } catch (error) {
    console.error("Users delete error:", error);
    return NextResponse.json({ error: "Failed to delete users" }, { status: 500 });
  }
}
