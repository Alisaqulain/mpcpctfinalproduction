import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserExercise from "@/lib/models/UserExercise";
import { jwtVerify } from "jose";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// GET - Fetch user's own exercises
export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    
    const exercises = await UserExercise.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error("User exercises fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user exercises" }, { status: 500 });
  }
}

// POST - Create user exercise
export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    
    const body = await request.json();
    const { name, content, difficulty } = body;

    if (!name) {
      return NextResponse.json({ error: "Exercise name is required" }, { status: 400 });
    }

    // Get user info for userName
    const User = (await import("@/lib/models/User")).default;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const exerciseData = {
      userId,
      userName: user.name || user.phoneNumber || "User",
      name: String(name),
      content: {
        english: content?.english || "",
        hindi_ramington: content?.hindi_ramington || "",
        hindi_inscript: content?.hindi_inscript || ""
      },
      difficulty: difficulty || "beginner"
    };

    const exercise = await UserExercise.create(exerciseData);

    return NextResponse.json({ success: true, exercise });
  } catch (error) {
    console.error("User exercise creation error:", error);
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
  }
}

// DELETE - Delete user's own exercise
export async function DELETE(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("_id");

    if (!exerciseId) {
      return NextResponse.json({ error: "Exercise ID is required" }, { status: 400 });
    }

    // Find exercise and verify ownership
    const exercise = await UserExercise.findById(exerciseId);
    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Check if user owns this exercise
    if (exercise.userId.toString() !== userId.toString()) {
      return NextResponse.json({ error: "You can only delete your own exercises" }, { status: 403 });
    }

    // Delete the physical file if it exists
    if (exercise.uploadedFilePath) {
      try {
        if (existsSync(exercise.uploadedFilePath)) {
          await unlink(exercise.uploadedFilePath);
          console.log(`Deleted file: ${exercise.uploadedFilePath}`);
        }
      } catch (fileError) {
        console.error("Error deleting file:", fileError);
        // Continue with exercise deletion even if file deletion fails
      }
    }

    await UserExercise.findByIdAndDelete(exerciseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User exercise deletion error:", error);
    return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
  }
}

