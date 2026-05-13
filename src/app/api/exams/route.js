import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const subCategoryId = searchParams.get("subCategoryId");

    const query = {};
    if (key) {
      query.key = key;
    }
    if (subCategoryId) {
      query.subCategoryId = subCategoryId;
    }

    const exams = await Exam.find(query).sort({ title: 1, createdAt: 1 });

    return NextResponse.json({
      success: true,
      exams,
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

/** Admin: create exam (hierarchy-aware). */
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    await dbConnect();
    const body = await req.json();
    const payload = {
      ...body,
      createdBy: auth.user.userId,
    };
    const exam = await Exam.create(payload);
    return NextResponse.json({ success: true, exam });
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create exam" },
      { status: 500 }
    );
  }
}

