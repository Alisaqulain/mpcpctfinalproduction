import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
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

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const updatedExams = [];
    const errors = [];

    // Get all RSCIT exams
    const exams = await Exam.find({ key: "RSCIT" }).sort({ title: 1 });

    for (const exam of exams) {
      try {
        const examId = `rscit-exam-${exam.title.match(/\d+$/)?.[0] || '1'}`;

        // HARD DELETE: Delete all existing sections, parts, and questions
        await Section.deleteMany({ examId: exam._id });
        await Part.deleteMany({ examId: exam._id });
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Update exam timing
        exam.totalTime = 60; // 60 minutes for Section B (main timer), Section A has separate 15 min timer
        exam.totalQuestions = 50;
        await exam.save();

        // FRESH CREATE: Section A FIRST (15 questions, 15 min timer, min 12 marks)
        const sectionAId = `${examId}-section-a`;
        const sectionA = await Section.create({
          id: sectionAId,
          name: "Section A",
          examId: exam._id,
          lessonNumber: 1,
          order: 1,
          typingTime: 15, // 15 minutes separate timer
          minimumMarks: 12, // Minimum 12 marks required to proceed to Section B
          maxMarks: 30 // 15 questions × 2 marks = 30 marks
        });

        // Create part for Section A
        const partAId = `${sectionAId}-part-rscit`;
        const partA = await Part.create({
          id: partAId,
          name: "RSCIT",
          examId: exam._id,
          sectionId: sectionA._id,
          order: 1
        });

        // Create 15 questions for Section A (questions 1-15)
        let questionNumber = 1;
        for (let qIndex = 0; qIndex < 15; qIndex++) {
          const questionId = `${examId}-section-a-q-${qIndex + 1}`;
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(sectionA._id),
            partId: String(partA._id),
            questionNumber: questionNumber++,
            questionType: "MCQ",
            question_en: `RSCIT Exam ${exam.title.match(/\d+$/)?.[0] || '1'} - Section A - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: `RSCIT परीक्षा ${exam.title.match(/\d+$/)?.[0] || '1'} - अनुभाग A - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
            options_en: ["Option A", "Option B", "Option C", "Option D"],
            options_hi: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: 0,
            marks: 2,
            negativeMarks: 0
          });
        }

        // FRESH CREATE: Section B SECOND (35 questions, 60 min timer, min 28 marks)
        const sectionBId = `${examId}-section-b`;
        const sectionB = await Section.create({
          id: sectionBId,
          name: "Section B",
          examId: exam._id,
          lessonNumber: 2,
          order: 2,
          typingTime: null, // No separate timer, uses main timer (60 min)
          minimumMarks: 28, // Minimum 28 marks required in Section B to pass
          requiresPreviousSection: true, // Requires Section A to be completed with minimum marks
          maxMarks: 70 // 35 questions × 2 marks = 70 marks
        });

        // Create part for Section B
        const partBId = `${sectionBId}-part-rscit`;
        const partB = await Part.create({
          id: partBId,
          name: "RSCIT",
          examId: exam._id,
          sectionId: sectionB._id,
          order: 1
        });

        // Create 35 questions for Section B (questions 16-50)
        for (let qIndex = 0; qIndex < 35; qIndex++) {
          const questionId = `${examId}-section-b-q-${qIndex + 1}`;
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(sectionB._id),
            partId: String(partB._id),
            questionNumber: questionNumber++,
            questionType: "MCQ",
            question_en: `RSCIT Exam ${exam.title.match(/\d+$/)?.[0] || '1'} - Section B - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: `RSCIT परीक्षा ${exam.title.match(/\d+$/)?.[0] || '1'} - अनुभाग B - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
            options_en: ["Option A", "Option B", "Option C", "Option D"],
            options_hi: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: 0,
            marks: 2,
            negativeMarks: 0
          });
        }

        updatedExams.push({
          examId: exam._id.toString(),
          title: exam.title,
          sectionsCreated: 2,
          questionsCreated: 50
        });

        console.log(`✅ Updated exam: ${exam.title} (Hard delete and fresh create: Section A first with 15 questions/15 min timer, Section B second with 35 questions/60 min timer)`);

      } catch (error) {
        console.error(`❌ Error updating exam ${exam.title}:`, error);
        errors.push({
          examTitle: exam.title,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedExams.length} RSCIT exams to new structure`,
      exams: updatedExams,
      summary: {
        total: updatedExams.length
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "All exams now have Section A first (15 questions, 30 marks, 15 minutes separate timer, minimum 12 marks to proceed), then Section B (35 questions, 70 marks, 60 minutes main timer, minimum 28 marks to pass). Total time: 90 minutes. Section B always gets fresh 60 minutes, not remaining from Section A. Passing criteria: Minimum 12 marks in Section A AND minimum 28 marks in Section B."
    });

  } catch (error) {
    console.error("Update RSCIT exams structure error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to update RSCIT exams structure" 
    }, { status: 500 });
  }
}

