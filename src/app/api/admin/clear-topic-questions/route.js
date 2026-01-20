import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";

async function requireAdmin(req) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return { ok: false, error: "Unauthorized" };
    }

    const { jwtVerify } = await import("jose");
    const JWT_SECRET = process.env.JWT_SECRET || "secret123";
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

    const User = (await import("@/lib/models/User")).default;
    await dbConnect();
    const user = await User.findById(payload.userId);

    if (!user || user.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }

    return { ok: true, userId: payload.userId };
  } catch (error) {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { topicId } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: "Missing topicId parameter" },
        { status: 400 }
      );
    }

    // Find the topic
    const topic = await Topic.findOne({ topicId });
    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Delete all questions for this topic
    const deletedResult = await TopicWiseMCQ.deleteMany({ topicId });
    const deletedCount = deletedResult.deletedCount;

    console.log(`✅ Deleted ${deletedCount} questions for topic: ${topic.topicName}`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleared all questions for topic: ${topic.topicName}`,
      deletedCount: deletedCount,
      topicName: topic.topicName,
      topicId: topicId
    });

  } catch (error) {
    console.error("Error clearing topic questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear topic questions" },
      { status: 500 }
    );
  }
}

















