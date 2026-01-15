import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
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
    
    if (cpctExams.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No CPCT exams found to delete",
        deleted: {
          exams: 0,
          sections: 0,
          parts: 0,
          questions: 0
        }
      });
    }

    const examIds = cpctExams.map(exam => exam._id);
    
    // Delete all questions
    const questionsResult = await Question.deleteMany({
      $or: examIds.map(id => [
        { examId: String(id) },
        { examId: id }
      ]).flat()
    });

    // Delete all parts
    const partsResult = await Part.deleteMany({
      examId: { $in: examIds }
    });

    // Delete all sections
    const sectionsResult = await Section.deleteMany({
      examId: { $in: examIds }
    });

    // Delete all exams
    const examsResult = await Exam.deleteMany({ key: "CPCT" });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all CPCT exams and related data`,
      deleted: {
        exams: examsResult.deletedCount,
        sections: sectionsResult.deletedCount,
        parts: partsResult.deletedCount,
        questions: questionsResult.deletedCount,
        total: examsResult.deletedCount + sectionsResult.deletedCount + partsResult.deletedCount + questionsResult.deletedCount
      }
    });

  } catch (error) {
    console.error("Error deleting CPCT exams:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete CPCT exams" },
      { status: 500 }
    );
  }
}


