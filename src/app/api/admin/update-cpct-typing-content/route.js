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

    const { examId, englishContent, hindiContent } = await req.json();

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Verify it's a CPCT exam
    if (exam.key !== "CPCT") {
      return NextResponse.json({ error: "This endpoint is only for CPCT exams" }, { status: 400 });
    }

    // Find Section B (English Typing) and Section C (Hindi Typing)
    const sectionB = await Section.findOne({ examId: exam._id, name: "Section B" });
    const sectionC = await Section.findOne({ examId: exam._id, name: "Section C" });

    if (!sectionB || !sectionC) {
      return NextResponse.json({ 
        error: "Section B or Section C not found. Please ensure the exam has the correct structure." 
      }, { status: 404 });
    }

    // Find or get the parts for these sections
    const partB = await Part.findOne({ examId: exam._id, sectionId: sectionB._id });
    const partC = await Part.findOne({ examId: exam._id, sectionId: sectionC._id });

    if (!partB || !partC) {
      return NextResponse.json({ 
        error: "Parts for Section B or Section C not found. Please ensure the exam has the correct structure." 
      }, { status: 404 });
    }

    const results = {
      sectionB: { updated: false, created: false },
      sectionC: { updated: false, created: false }
    };

    // Update or create English typing question (Section B)
    if (englishContent !== undefined && englishContent !== null) {
      let englishQuestion = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(sectionB._id),
        questionType: "TYPING",
        typingLanguage: "English"
      });

      if (englishQuestion) {
        // Update existing question
        englishQuestion.typingContent_english = englishContent.trim();
        await englishQuestion.save();
        results.sectionB.updated = true;
      } else {
        // Create new question
        const questionId = `${sectionB._id}-typing-question-1`;
        englishQuestion = await Question.create({
          examId: String(exam._id),
          sectionId: String(sectionB._id),
          partId: String(partB._id),
          id: questionId,
          questionType: "TYPING",
          typingLanguage: "English",
          typingContent_english: englishContent.trim(),
          typingDuration: 15,
          typingBackspaceEnabled: true,
          marks: 0,
          isFree: false
        });
        results.sectionB.created = true;
      }
    }

    // Update or create Hindi typing question (Section C)
    if (hindiContent !== undefined && hindiContent !== null) {
      let hindiQuestion = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(sectionC._id),
        questionType: "TYPING",
        typingLanguage: "Hindi"
      });

      if (hindiQuestion) {
        // Update existing question - update both Ramington and Inscript
        hindiQuestion.typingContent_hindi_ramington = hindiContent.trim();
        hindiQuestion.typingContent_hindi_inscript = hindiContent.trim();
        // Default to Ramington Gail if script type not set
        if (!hindiQuestion.typingScriptType) {
          hindiQuestion.typingScriptType = "Ramington Gail";
        }
        await hindiQuestion.save();
        results.sectionC.updated = true;
      } else {
        // Create new question
        const questionId = `${sectionC._id}-typing-question-1`;
        hindiQuestion = await Question.create({
          examId: String(exam._id),
          sectionId: String(sectionC._id),
          partId: String(partC._id),
          id: questionId,
          questionType: "TYPING",
          typingLanguage: "Hindi",
          typingScriptType: "Ramington Gail",
          typingContent_hindi_ramington: hindiContent.trim(),
          typingContent_hindi_inscript: hindiContent.trim(),
          typingDuration: 15,
          typingBackspaceEnabled: true,
          marks: 0,
          isFree: false
        });
        results.sectionC.created = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Typing content updated successfully",
      results: {
        english: results.sectionB.updated ? "Updated" : results.sectionB.created ? "Created" : "Skipped",
        hindi: results.sectionC.updated ? "Updated" : results.sectionC.created ? "Created" : "Skipped"
      }
    });

  } catch (error) {
    console.error("Error updating CPCT typing content:", error);
    return NextResponse.json({ 
      error: "Failed to update typing content", 
      details: error.message 
    }, { status: 500 });
  }
}














