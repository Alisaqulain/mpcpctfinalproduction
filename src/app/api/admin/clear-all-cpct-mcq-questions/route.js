import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Question from "@/lib/models/Question";

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

    // Get all CPCT exams
    const cpctExams = await Exam.find({ key: "CPCT" });
    const examIds = cpctExams.map(exam => [String(exam._id), exam._id]).flat();

    if (examIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No CPCT exams found",
        deleted: {
          mcqQuestions: 0,
          total: 0
        },
        examsAffected: 0
      });
    }

    // Delete ONLY MCQ and COMPREHENSION questions from CPCT exams (NOT typing questions)
    const deleteResult = await Question.deleteMany({
      $and: [
        {
          $or: examIds.map(id => ({ examId: id }))
        },
        {
          questionType: { $ne: "TYPING" } // Exclude typing questions, include MCQ, COMPREHENSION, and any other non-typing types
        }
      ]
    });

    // Count how many MCQ questions were deleted vs typing questions preserved
    const typingQuestions = await Question.countDocuments({
      $or: examIds.map(id => ({ examId: id })),
      questionType: "TYPING"
    });

    return NextResponse.json({
      success: true,
      message: `Cleared all CPCT MCQ questions (typing questions preserved)`,
      deleted: {
        mcqQuestions: deleteResult.deletedCount,
        typingQuestionsPreserved: typingQuestions,
        total: deleteResult.deletedCount
      },
      examsAffected: cpctExams.length,
      note: "Only MCQ questions were deleted - typing questions (Section B & C) were preserved"
    });

  } catch (error) {
    console.error("Error clearing CPCT MCQ questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear questions" },
      { status: 500 }
    );
  }
}

