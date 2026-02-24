import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

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

export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    // Get topics from Topic collection
    const topics = await Topic.find({}).lean().sort({ createdAt: 1 });
    
    // Convert to the expected format
    const formattedTopics = topics.map(t => ({
      topicId: t.topicId,
      topicName: t.topicName || '',
      topicName_hi: (t.topicName_hi !== undefined && t.topicName_hi !== null) ? t.topicName_hi : '',
      isFree: t.isFree || false
    }));
    
    return NextResponse.json({ topics: formattedTopics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const body = await req.json();
    const { topicId, topicName, topicName_hi, isFree } = body;
    
    if (!topicId || !topicName) {
      return NextResponse.json({ error: "Missing required fields: topicId and topicName" }, { status: 400 });
    }
    
    // Safely handle topicName_hi - ensure it's a string or empty string
    const topicNameHiValue = (topicName_hi !== undefined && topicName_hi !== null) ? String(topicName_hi) : '';
    const isFreeValue = isFree === true || isFree === 'true';
    
    // Check if topic already exists in Topic collection
    const existingTopic = await Topic.findOne({ topicId });
    if (existingTopic) {
      // Update the topic
      existingTopic.topicName = topicName;
      existingTopic.topicName_hi = topicNameHiValue;
      existingTopic.isFree = isFreeValue;
      await existingTopic.save();
      
      // Also update all questions with this topicId to have the new topic name
      await TopicWiseMCQ.updateMany(
        { topicId },
        { $set: { topicName, topicName_hi: topicNameHiValue } }
      );
      return NextResponse.json({ success: true, message: "Topic updated" });
    }
    
    // Create new topic
    await Topic.create({
      topicId,
      topicName,
      topicName_hi: topicNameHiValue,
      isFree: isFreeValue
    });
    
    return NextResponse.json({ success: true, message: "Topic created successfully" });
  } catch (error) {
    console.error('Error creating topic:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Topic with this ID already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create topic' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    
    if (!topicId) {
      return NextResponse.json({ error: "Missing topicId parameter" }, { status: 400 });
    }
    
    // Delete all questions for this topic first
    const deletedQuestions = await TopicWiseMCQ.deleteMany({ topicId });
    console.log(`Deleted ${deletedQuestions.deletedCount} questions for topic ${topicId}`);
    
    // Delete the topic
    const deletedTopic = await Topic.findOneAndDelete({ topicId });
    if (!deletedTopic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Topic and all its questions deleted successfully",
      deletedQuestions: deletedQuestions.deletedCount
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete topic' }, { status: 500 });
  }
}

