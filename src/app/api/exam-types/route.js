import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamType from "@/lib/models/ExamType";

const DEFAULT_EXAM_TYPES = [
  { key: "CPCT", label: "CPCT", order: 0, isTopicWise: false },
  { key: "RSCIT", label: "RSCIT", order: 1, isTopicWise: false },
  { key: "CCC", label: "CCC", order: 2, isTopicWise: false },
  { key: "CUSTOM", label: "Topic Wise MCQ", order: 3, isTopicWise: true },
];

export async function GET() {
  try {
    await dbConnect();
    let types = await ExamType.find().sort({ order: 1 });
    if (types.length === 0) {
      await ExamType.insertMany(DEFAULT_EXAM_TYPES);
      types = await ExamType.find().sort({ order: 1 });
    }
    return NextResponse.json({ examTypes: types });
  } catch (error) {
    console.error("Error fetching exam types:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam types" },
      { status: 500 }
    );
  }
}
