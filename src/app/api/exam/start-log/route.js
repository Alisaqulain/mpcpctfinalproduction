import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamStartLog from "@/lib/models/ExamStartLog";
import Exam from "@/lib/models/Exam";
import Topic from "@/lib/models/Topic";
import { getAuth } from "@/lib/apiAuth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, mobile, city, examId, topicId, examType } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(String(mobile || "").trim())) {
      return NextResponse.json({ error: "Valid 10-digit mobile number required" }, { status: 400 });
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }

    await dbConnect();

    let examTitle = "";
    if (examId) {
      const exam = await Exam.findById(examId).select("title").lean();
      examTitle = exam?.title || "";
    }

    let topicName = "";
    if (topicId) {
      const topic = await Topic.findOne({ topicId: String(topicId) })
        .select("topicName topicName_hi")
        .lean();
      topicName = topic?.topicName || topic?.topicName_hi || "";
    }

    const auth = await getAuth(request);
    const userId = auth.user?.userId || null;

    const log = await ExamStartLog.create({
      name: name.trim(),
      mobile: String(mobile).trim(),
      city: city.trim(),
      examId: examId || null,
      examTitle,
      topicId: topicId ? String(topicId) : "",
      topicName,
      examType: examType ? String(examType) : "",
      userId,
    });

    return NextResponse.json({ success: true, id: log._id });
  } catch (error) {
    console.error("Exam start log error:", error);
    return NextResponse.json({ error: "Failed to save exam start details" }, { status: 500 });
  }
}
