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

    // Get all CCC exams
    const cccExams = await Exam.find({ key: "CCC" });
    const examIds = cccExams.map(exam => [String(exam._id), exam._id]).flat();

    // Delete all questions from CCC exams ONLY (NOT the question bank)
    const deleteResult = await Question.deleteMany({
      $or: examIds.map(id => ({ examId: id }))
    });

    // DO NOT delete question bank - keep it for redistribution
    // The question bank should remain intact so questions can be redistributed

    return NextResponse.json({
      success: true,
      message: `Cleared all CCC exam questions (question bank preserved)`,
      deleted: {
        examQuestions: deleteResult.deletedCount,
        questionBank: 0, // Question bank is preserved
        total: deleteResult.deletedCount
      },
      examsAffected: cccExams.length,
      note: "Question bank was preserved - you can redistribute questions without re-importing"
    });

  } catch (error) {
    console.error("Error clearing CCC questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear questions" },
      { status: 500 }
    );
  }
}

