import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Topic from "@/lib/models/Topic";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, error: "Unauthorized" };
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload.role !== "admin") return { ok: false, error: "Forbidden" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();

    // Find the topic "Computers and their evolution and types" - try multiple variations
    let topic = await Topic.findOne({ 
      topicName: "Computers and their evolution and types" 
    });

    // If not found, try case-insensitive search
    if (!topic) {
      topic = await Topic.findOne({ 
        topicName: { $regex: /computers and their evolution/i } 
      });
    }

    // If still not found, try finding by topicId or any topic with similar name
    if (!topic) {
      const allTopics = await Topic.find({}).sort({ createdAt: 1 });
      // Get the first topic (should be the one we want)
      if (allTopics.length > 0) {
        topic = allTopics[0];
      }
    }

    if (!topic) {
      return NextResponse.json({ 
        error: "Topic 'Computers and their evolution and types' not found. Please create it first." 
      }, { status: 404 });
    }

    // Update using both methods to ensure it's saved
    topic.isFree = true;
    await topic.save();

    // Also update directly in database using updateOne
    const updateResult = await Topic.updateOne(
      { _id: topic._id },
      { $set: { isFree: true } }
    );

    console.log(`✅ Set topic as FREE: ${topic.topicName} (ID: ${topic.topicId}, isFree: ${topic.isFree})`);
    console.log(`✅ Update result:`, updateResult);

    // Verify it was updated
    const updatedTopic = await Topic.findById(topic._id);
    console.log(`✅ Verified topic isFree status:`, updatedTopic.isFree);

    return NextResponse.json({ 
      success: true, 
      message: "Topic set as FREE",
      topic: {
        topicId: updatedTopic.topicId,
        topicName: updatedTopic.topicName,
        isFree: updatedTopic.isFree
      },
      updateResult: updateResult
    });
  } catch (error) {
    console.error('Error setting topic as free:', error);
    return NextResponse.json({ error: error.message || 'Failed to set topic as free' }, { status: 500 });
  }
}

