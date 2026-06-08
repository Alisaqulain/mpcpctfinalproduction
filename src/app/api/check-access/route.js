import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import Exam from "@/lib/models/Exam";
import Topic from "@/lib/models/Topic";
import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/jwtSecret";

/** Map client type to subscription bucket */
function subscriptionTypeFor(type) {
  if (type === "exam" || type === "topic") return "exam";
  if (type === "skill" || type === "skill_test") return "learning";
  if (type === "learning") return "learning";
  return type || "learning";
}

async function checkFreeContent({ topicId, examId, isFree }) {
  if (isFree === true) {
    return { hasAccess: true, reason: "free" };
  }
  if (topicId) {
    const topic = await Topic.findOne({ topicId });
    if (!topic) return { hasAccess: false, reason: "topic_not_found", status: 404 };
    if (topic.isFree === true) return { hasAccess: true, reason: "free" };
  }
  if (examId) {
    const exam = await Exam.findById(examId);
    if (!exam) return { hasAccess: false, reason: "exam_not_found", status: 404 };
    if (exam.isFree === true) return { hasAccess: true, reason: "free" };
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, isFree, itemId, examId, topicId, allowGuest } = body;
    const subType = subscriptionTypeFor(type);

    await dbConnect();

    // Free exams/topics — no login required
    const freeResult = await checkFreeContent({ topicId, examId, isFree });
    if (freeResult) {
      const status = freeResult.status || 200;
      const { status: _s, ...payload } = freeResult;
      return NextResponse.json(payload, { status });
    }

    // Browse Learning / Skill Test / Exam sections without an account
    if (allowGuest === true) {
      return NextResponse.json({
        hasAccess: true,
        reason: "guest_browse",
        guest: true,
      });
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({
        hasAccess: false,
        reason: "no_token",
        requiresAuth: true,
        redirectTo: `/login?redirect=${encodeURIComponent(
          examId
            ? `/exam/exam-login?examId=${examId}${topicId ? `&topicId=${topicId}` : ""}`
            : type === "skill" || type === "skill_test"
              ? "/skill_test"
              : type === "learning"
                ? "/learning"
                : "/exam"
        )}`,
      });
    }

    let decoded;
    try {
      const { payload } = await jwtVerify(token, getJwtSecretBytes());
      decoded = payload;
    } catch {
      return NextResponse.json({
        hasAccess: false,
        reason: "invalid_token",
        requiresAuth: true,
        redirectTo: "/login",
      });
    }

    const user = await User.findById(decoded.userId);
    if (user?.role === "admin") {
      return NextResponse.json({ hasAccess: true, reason: "admin" });
    }

    let subscription = await Subscription.findOne({
      userId: decoded.userId,
      type: "all",
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (!subscription) {
      subscription = await Subscription.findOne({
        userId: decoded.userId,
        type: subType,
        status: "active",
        endDate: { $gt: new Date() },
      });
    }

    // Learning subscription also unlocks skill test in many plans
    if (!subscription && (subType === "skill_test" || type === "skill")) {
      subscription = await Subscription.findOne({
        userId: decoded.userId,
        type: "learning",
        status: "active",
        endDate: { $gt: new Date() },
      });
    }

    if (subscription) {
      return NextResponse.json({
        hasAccess: true,
        reason: "subscription",
        subscription: {
          plan: subscription.plan,
          endDate: subscription.endDate,
          type: subscription.type,
        },
      });
    }

    return NextResponse.json({
      hasAccess: false,
      reason: "no_subscription",
      redirectTo: `/payment-app?type=${subType}&itemId=${itemId || examId || topicId || ""}`,
    });
  } catch (error) {
    console.error("Access check error:", error);
    return NextResponse.json({ hasAccess: false, reason: "error" }, { status: 500 });
  }
}
