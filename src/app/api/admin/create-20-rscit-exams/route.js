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

    const createdExams = [];
    const errors = [];

    // Create 20 RSCIT exams
    for (let examNum = 1; examNum <= 20; examNum++) {
      try {
        const examTitle = `RSCIT Exam ${examNum}`;
        const examId = `rscit-exam-${examNum}`;
        
        // Check if exam already exists
        let exam = await Exam.findOne({ 
          key: "RSCIT",
          title: examTitle
        });

        if (!exam) {
          // Create new exam
          exam = await Exam.create({
            key: "RSCIT",
            title: examTitle,
            totalTime: 60, // 60 minutes for Section B (main timer), Section A has separate 15 min timer
            totalQuestions: 50, // 50 questions total (15 + 35)
            isFree: examNum === 1 // First exam is free, others are paid
          });
          console.log(`✅ Created exam: ${examTitle}`);
        } else {
          // Update existing exam
          exam.totalTime = 60;
          exam.totalQuestions = 50;
          exam.isFree = examNum === 1;
          await exam.save();
          console.log(`✅ Updated exam: ${examTitle}`);
        }

        // HARD DELETE: Delete all existing sections, parts, and questions for this exam
        await Section.deleteMany({ examId: exam._id });
        await Part.deleteMany({ examId: exam._id });
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // ========== SECTION A: 15 questions, 15 min timer, 2 marks each, min 12 marks ==========
        const sectionAId = `${examId}-section-a`;
        const sectionA = await Section.create({
          id: sectionAId,
          name: "Section A",
          examId: exam._id,
          lessonNumber: 1,
          order: 1, // FIRST section
          typingTime: 15, // 15 minutes separate timer (doesn't use main timer)
          minimumMarks: 12, // Minimum 12 marks required to proceed to Section B
          maxMarks: 30, // 15 questions × 2 marks = 30 marks
          requiresPreviousSection: false // First section, no previous requirement
        });
        console.log(`  ✅ Created Section A for ${examTitle}`);

        // Create part for Section A
        const partAId = `${sectionAId}-part-rscit`;
        const partA = await Part.create({
          id: partAId,
          name: "RSCIT",
          examId: exam._id,
          sectionId: sectionA._id,
          order: 1
        });

        // Create 15 questions for Section A (2 marks each)
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
            question_en: `RSCIT Exam ${examNum} - Section A - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: `RSCIT परीक्षा ${examNum} - अनुभाग A - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
            options_en: ["Option A", "Option B", "Option C", "Option D"],
            options_hi: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: 0, // Default to option A
            marks: 2, // 2 marks per question
            negativeMarks: 0
          });
        }
        console.log(`  ✅ Created 15 questions for Section A`);

        // ========== SECTION B: 35 questions, 60 min timer (fresh, not remaining from A), 2 marks each, min 28 marks ==========
        const sectionBId = `${examId}-section-b`;
        const sectionB = await Section.create({
          id: sectionBId,
          name: "Section B",
          examId: exam._id,
          lessonNumber: 2,
          order: 2, // SECOND section
          typingTime: null, // No separate timer, uses main timer (60 min) - FRESH, not remaining from Section A
          minimumMarks: 28, // Minimum 28 marks required in Section B to pass
          requiresPreviousSection: true, // Requires Section A to be completed with minimum 12 marks
          maxMarks: 70 // 35 questions × 2 marks = 70 marks
        });
        console.log(`  ✅ Created Section B for ${examTitle}`);

        // Create part for Section B
        const partBId = `${sectionBId}-part-rscit`;
        const partB = await Part.create({
          id: partBId,
          name: "RSCIT",
          examId: exam._id,
          sectionId: sectionB._id,
          order: 1
        });

        // Create 35 questions for Section B (2 marks each)
        for (let qIndex = 0; qIndex < 35; qIndex++) {
          const questionId = `${examId}-section-b-q-${qIndex + 1}`;
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(sectionB._id),
            partId: String(partB._id),
            questionNumber: questionNumber++,
            questionType: "MCQ",
            question_en: `RSCIT Exam ${examNum} - Section B - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: `RSCIT परीक्षा ${examNum} - अनुभाग B - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
            options_en: ["Option A", "Option B", "Option C", "Option D"],
            options_hi: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
            correctAnswer: 0, // Default to option A
            marks: 2, // 2 marks per question
            negativeMarks: 0
          });
        }
        console.log(`  ✅ Created 35 questions for Section B`);

        createdExams.push({
          examNumber: examNum,
          title: examTitle,
          sectionA: { questions: 15, marks: 30, minMarks: 12, time: 15 },
          sectionB: { questions: 35, marks: 70, minMarks: 28, time: 60 }
        });

      } catch (error) {
        console.error(`❌ Error creating RSCIT Exam ${examNum}:`, error);
        errors.push({
          examNumber: examNum,
          error: error.message || "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created/updated ${createdExams.length} RSCIT exams`,
      created: createdExams,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalExams: createdExams.length,
        totalQuestions: createdExams.length * 50, // 50 questions per exam
        sectionAQuestions: createdExams.length * 15,
        sectionBQuestions: createdExams.length * 35
      }
    });

  } catch (error) {
    console.error("Create 20 RSCIT exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create RSCIT exams" 
    }, { status: 500 });
  }
}


















