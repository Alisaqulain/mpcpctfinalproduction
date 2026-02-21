import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }
    return { ok: true, userId: payload.userId };
  } catch (error) {
    return { ok: false, error: "Unauthorized" };
  }
}

// Function to clean question text - remove tags like [V51], [V52], etc. and (Question X) patterns
function cleanQuestionText(text) {
  if (!text) return text;
  // Remove patterns like [V51], [V52], [V123], etc.
  let cleaned = text.replace(/\[V\d+\]/g, '');
  // Remove patterns like "(Question 57)", "(Question X)" from question text
  cleaned = cleaned.replace(/\s*\(Question\s+\d+\)/gi, '').trim();
  return cleaned;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    // Get all RSCIT questions
    const Exam = (await import("@/lib/models/Exam")).default;
    const rscitExams = await Exam.find({ key: "RSCIT" });
    const examIds = rscitExams.flatMap(exam => [String(exam._id), exam._id]);

    const questions = await Question.find({
      $or: examIds.flatMap(id => [{ examId: id }])
    });

    let updated = 0;
    for (const question of questions) {
      let needsUpdate = false;
      const updates = {};

      // Clean question_en
      if (question.question_en) {
        const cleaned = cleanQuestionText(question.question_en);
        if (cleaned !== question.question_en) {
          updates.question_en = cleaned;
          needsUpdate = true;
        }
      }

      // Clean question_hi
      if (question.question_hi) {
        const cleaned = cleanQuestionText(question.question_hi);
        if (cleaned !== question.question_hi) {
          updates.question_hi = cleaned;
          needsUpdate = true;
        }
      }

      // Clean options_en
      if (question.options_en && Array.isArray(question.options_en)) {
        const cleaned = question.options_en.map(opt => cleanQuestionText(opt));
        if (JSON.stringify(cleaned) !== JSON.stringify(question.options_en)) {
          updates.options_en = cleaned;
          needsUpdate = true;
        }
      }

      // Clean options_hi
      if (question.options_hi && Array.isArray(question.options_hi)) {
        const cleaned = question.options_hi.map(opt => cleanQuestionText(opt));
        if (JSON.stringify(cleaned) !== JSON.stringify(question.options_hi)) {
          updates.options_hi = cleaned;
          needsUpdate = true;
        }
      }

      // Clean explanation_en
      if (question.explanation_en) {
        const cleaned = cleanQuestionText(question.explanation_en);
        if (cleaned !== question.explanation_en) {
          updates.explanation_en = cleaned;
          needsUpdate = true;
        }
      }

      // Clean explanation_hi
      if (question.explanation_hi) {
        const cleaned = cleanQuestionText(question.explanation_hi);
        if (cleaned !== question.explanation_hi) {
          updates.explanation_hi = cleaned;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Question.updateOne({ _id: question._id }, { $set: updates });
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned ${updated} questions`,
      totalQuestions: questions.length,
      updated: updated
    });

  } catch (error) {
    console.error("Clean RSCIT questions error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to clean questions" 
    }, { status: 500 });
  }
}

