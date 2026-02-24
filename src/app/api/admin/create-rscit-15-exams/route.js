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

    // Create 20 exams
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
            totalQuestions: 50, // 50 questions (35 + 15)
            isFree: examNum === 1 // First exam is free, others are paid
          });
        } else {
          // Update existing exam
          exam.totalTime = 60; // 60 minutes for Section B
          exam.totalQuestions = 50;
          exam.isFree = examNum === 1;
          await exam.save();
        }

        // Delete existing questions for this exam to avoid duplicates
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Section A: 15 questions, 2 marks each (FIRST - order 1)
        // 15 minutes separate timer for Section A
        // Minimum 12 marks required to proceed to Section B
        const sectionAId = `${examId}-section-a`;
        let sectionA = await Section.findOne({
          examId: exam._id,
          id: sectionAId
        });

        if (!sectionA) {
          sectionA = await Section.create({
            id: sectionAId,
            name: "Section A",
            examId: exam._id,
            lessonNumber: 1,
            order: 1,
            typingTime: 15, // 15 minutes separate timer for Section A
            minimumMarks: 12, // Minimum 12 marks required to proceed to Section B
            maxMarks: 30 // 15 questions × 2 marks = 30 marks
          });
        } else {
          sectionA.name = "Section A";
          sectionA.order = 1;
          sectionA.lessonNumber = 1;
          sectionA.typingTime = 15; // 15 minutes separate timer
          sectionA.minimumMarks = 12; // Minimum 12 marks required
          sectionA.maxMarks = 30; // 15 questions × 2 marks
          await sectionA.save();
        }

        // Create part: RSCIT for Section A
        const partAId = `${sectionAId}-part-rscit`;
        let partA = await Part.findOne({
          examId: exam._id,
          sectionId: sectionA._id,
          id: partAId
        });

        if (!partA) {
          partA = await Part.create({
            id: partAId,
            name: "RSCIT",
            examId: exam._id,
            sectionId: sectionA._id,
            order: 1
          });
        } else {
          partA.name = "RSCIT";
          partA.order = 1;
          await partA.save();
        }

        // Create 15 questions for Section A (2 marks each)
        let totalQuestionsCreated = 0;
        for (let qIndex = 0; qIndex < 15; qIndex++) {
          totalQuestionsCreated++;
          const questionId = `${examId}-section-a-q-${qIndex + 1}`;
          
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(sectionA._id),
            partId: String(partA._id),
            questionNumber: totalQuestionsCreated,
            questionType: "MCQ",
            question_en: `RSCIT Exam ${examNum} - Section A - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: `RSCIT परीक्षा ${examNum} - अनुभाग A - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
            options_en: [
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ],
            options_hi: [
              "विकल्प A",
              "विकल्प B",
              "विकल्प C",
              "विकल्प D"
            ],
            correctAnswer: 0,
            marks: 2,
            negativeMarks: 0
          });
        }

        // Section B: 35 questions, 2 marks each (SECOND - order 2)
        // 60 minutes main timer for Section B (fresh, not remaining from Section A)
        // Minimum 28 marks required in Section B to pass
        const sectionBId = `${examId}-section-b`;
        let sectionB = await Section.findOne({
          examId: exam._id,
          id: sectionBId
        });

        if (!sectionB) {
          sectionB = await Section.create({
            id: sectionBId,
            name: "Section B",
            examId: exam._id,
            lessonNumber: 2,
            order: 2,
            requiresPreviousSection: true, // Requires Section A to be completed with minimum marks
            minimumMarks: 28, // Minimum 28 marks required in Section B to pass
            maxMarks: 70 // 35 questions × 2 marks = 70 marks
          });
        } else {
          sectionB.name = "Section B";
          sectionB.order = 2;
          sectionB.lessonNumber = 2;
          sectionB.requiresPreviousSection = true;
          sectionB.minimumMarks = 28; // Minimum 28 marks required
          sectionB.maxMarks = 70; // 35 questions × 2 marks
          await sectionB.save();
        }

        // Create part: RSCIT for Section B
        const partBId = `${sectionBId}-part-rscit`;
        let partB = await Part.findOne({
          examId: exam._id,
          sectionId: sectionB._id,
          id: partBId
        });

        if (!partB) {
          partB = await Part.create({
            id: partBId,
            name: "RSCIT",
            examId: exam._id,
            sectionId: sectionB._id,
            order: 1
          });
        } else {
          partB.name = "RSCIT";
          partB.order = 1;
          await partB.save();
        }

        // Create 35 questions for Section B (2 marks each)
        for (let qIndex = 0; qIndex < 35; qIndex++) {
          totalQuestionsCreated++;
          const questionId = `${examId}-section-b-q-${qIndex + 1}`;
          
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(sectionB._id),
            partId: String(partB._id),
            questionNumber: totalQuestionsCreated,
            questionType: "MCQ",
            question_en: `RSCIT Exam ${examNum} - Section B - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: `RSCIT परीक्षा ${examNum} - अनुभाग B - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
            options_en: [
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ],
            options_hi: [
              "विकल्प A",
              "विकल्प B",
              "विकल्प C",
              "विकल्प D"
            ],
            correctAnswer: 0,
            marks: 2,
            negativeMarks: 0
          });
        }

        createdExams.push({
          examId: exam._id.toString(),
          title: exam.title,
          isFree: exam.isFree,
          sections: 2,
          parts: 2,
          questions: totalQuestionsCreated,
          totalTime: exam.totalTime,
          totalQuestions: exam.totalQuestions
        });

        console.log(`✅ Created exam ${examNum}/20: ${examTitle} (${exam.isFree ? 'FREE' : 'PAID'}) with ${totalQuestionsCreated} questions (15 in Section A first with 15 min timer, 35 in Section B second with 60 min timer)`);

      } catch (error) {
        console.error(`❌ Error creating exam ${examNum}:`, error);
        errors.push({
          examNum,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdExams.length} RSCIT exams (20 total)`,
      exams: createdExams,
      summary: {
        total: createdExams.length,
        free: createdExams.filter(e => e.isFree).length,
        paid: createdExams.filter(e => !e.isFree).length
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "Each exam has 2 sections: Section A first (15 questions @ 2 marks = 30 marks, 15 minutes separate timer, minimum 12 marks to proceed), then Section B (35 questions @ 2 marks = 70 marks, 60 minutes main timer, minimum 28 marks to pass). Total: 50 questions @ 2 marks = 100 marks. Total time: 90 minutes (15 + 60). Section B always gets fresh 60 minutes, not remaining from Section A. Passing criteria: Minimum 12 marks in Section A AND minimum 28 marks in Section B. No negative marks."
    });

  } catch (error) {
    console.error("Create RSCIT exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create RSCIT exams" 
    }, { status: 500 });
  }
}

