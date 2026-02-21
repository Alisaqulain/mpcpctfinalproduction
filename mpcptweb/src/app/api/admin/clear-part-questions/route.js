import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import Question from "@/lib/models/Question";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return { ok: false, error: "Unauthorized" };
    }
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
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

    const body = await req.json();
    const { partId } = body;

    if (!partId) {
      return NextResponse.json({ error: "Part ID is required" }, { status: 400 });
    }

    // Verify part exists
    const part = await Part.findById(partId);
    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    // Get section for this part
    const section = await Section.findById(part.sectionId);
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Get exam for this section
    const exam = await Exam.findById(section.examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Delete all questions for this part
    const deletedQuestions = await Question.deleteMany({
      partId: String(partId)
    });

    console.log(`✅ Deleted ${deletedQuestions.deletedCount} questions from part: ${part.name}`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${deletedQuestions.deletedCount} questions from part "${part.name}"`,
      deletedCount: deletedQuestions.deletedCount,
      partName: part.name
    });

  } catch (error) {
    console.error("Error clearing part questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear part questions" },
      { status: 500 }
    );
  }
}




