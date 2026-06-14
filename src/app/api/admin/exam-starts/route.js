import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamStartLog from "@/lib/models/ExamStartLog";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500);
    const examId = searchParams.get("examId");
    const examType = searchParams.get("examType");

    const query = {};
    if (examId) query.examId = examId;
    if (examType) query.examType = examType;

    const logs = await ExamStartLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email phoneNumber")
      .lean();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Admin exam starts fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch exam start logs" }, { status: 500 });
  }
}
