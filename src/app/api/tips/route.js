import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Tip from "@/lib/models/Tip";

// GET - Fetch tip by lessonId
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
    }

    await dbConnect();
    const tip = await Tip.findOne({ lessonId }).lean();

    if (!tip) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    return NextResponse.json({ tip });
  } catch (error) {
    console.error("Error fetching tip:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tip" }, { status: 500 });
  }
}

// POST - Create a new tip
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      lessonId,
      title_en,
      title_hi,
      paragraph_en,
      paragraph_hi,
      steps_en,
      steps_hi,
      tip_en,
      tip_hi,
      imageUrl,
      cancelText_en,
      cancelText_hi,
      nextText_en,
      nextText_hi,
    } = body;

    if (!lessonId || !title_en) {
      return NextResponse.json({ error: "lessonId and title_en are required" }, { status: 400 });
    }

    await dbConnect();

    // Check if tip already exists
    const existing = await Tip.findOne({ lessonId });
    if (existing) {
      return NextResponse.json({ error: "Tip for this lesson already exists" }, { status: 400 });
    }

    const tip = await Tip.create({
      lessonId,
      title_en,
      title_hi: title_hi || "",
      paragraph_en: paragraph_en || "",
      paragraph_hi: paragraph_hi || "",
      steps_en: steps_en || [],
      steps_hi: steps_hi || [],
      tip_en: tip_en || "",
      tip_hi: tip_hi || "",
      imageUrl: imageUrl || "/homefinger.jpg",
      cancelText_en: cancelText_en || "Cancel",
      cancelText_hi: cancelText_hi || "रद्द करें",
      nextText_en: nextText_en || "Next",
      nextText_hi: nextText_hi || "आगे",
    });

    return NextResponse.json({ tip }, { status: 201 });
  } catch (error) {
    console.error("Error creating tip:", error);
    if (error.code === 11000) {
      return NextResponse.json({ error: "Tip for this lesson already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create tip" }, { status: 500 });
  }
}

// PUT - Update an existing tip
export async function PUT(req) {
  try {
    const body = await req.json();
    const { _id, lessonId, ...updateData } = body;

    if (!_id && !lessonId) {
      return NextResponse.json({ error: "_id or lessonId is required" }, { status: 400 });
    }

    await dbConnect();

    const query = _id ? { _id } : { lessonId };
    const tip = await Tip.findOneAndUpdate(query, updateData, { new: true, runValidators: true });

    if (!tip) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    return NextResponse.json({ tip });
  } catch (error) {
    console.error("Error updating tip:", error);
    return NextResponse.json({ error: error.message || "Failed to update tip" }, { status: 500 });
  }
}

// DELETE - Delete a tip
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get("_id");
    const lessonId = searchParams.get("lessonId");

    if (!_id && !lessonId) {
      return NextResponse.json({ error: "_id or lessonId is required" }, { status: 400 });
    }

    await dbConnect();

    const query = _id ? { _id } : { lessonId };
    const tip = await Tip.findOneAndDelete(query);

    if (!tip) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Tip deleted successfully" });
  } catch (error) {
    console.error("Error deleting tip:", error);
    return NextResponse.json({ error: error.message || "Failed to delete tip" }, { status: 500 });
  }
}

