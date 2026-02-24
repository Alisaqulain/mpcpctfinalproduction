import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserTopicAssignment from "@/lib/models/UserTopicAssignment";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// GET - Fetch assigned topics for a user
export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await dbConnect();
    const assignments = await UserTopicAssignment.find({ userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("User topics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user topics" }, { status: 500 });
  }
}

// POST - Assign a topic to a user
export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await dbConnect();
    const { userId, topicId, topicName, description } = await request.json();

    if (!userId || !topicId || !topicName) {
      return NextResponse.json({ error: "userId, topicId, and topicName are required" }, { status: 400 });
    }

    // Check if already assigned
    const existing = await UserTopicAssignment.findOne({ userId, topicId });
    if (existing) {
      return NextResponse.json({ error: "Topic already assigned to this user" }, { status: 400 });
    }

    const assignment = await UserTopicAssignment.create({
      userId,
      topicId,
      topicName,
      assignedBy: payload.userId,
      description: description || "",
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error("Topic assignment error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Topic already assigned to this user" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to assign topic" }, { status: 500 });
  }
}

// DELETE - Remove topic assignment
export async function DELETE(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    await UserTopicAssignment.findByIdAndDelete(assignmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Topic removal error:", error);
    return NextResponse.json({ error: "Failed to remove topic assignment" }, { status: 500 });
  }
}

