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
        const examTitle = `CCC Exam ${examNum}`;
        const examId = `ccc-exam-${examNum}`;
        
        // Check if exam already exists
        let exam = await Exam.findOne({ 
          key: "CCC",
          title: examTitle
        });

        if (!exam) {
          // Create new exam
          exam = await Exam.create({
            key: "CCC",
            title: examTitle,
            totalTime: 90, // 90 minutes
            totalQuestions: 100, // 100 questions
            isFree: examNum === 1 // First exam is free, others are paid
          });
        } else {
          // Update existing exam
          exam.totalTime = 90;
          exam.totalQuestions = 100;
          exam.isFree = examNum === 1;
          await exam.save();
        }

        // Create section: Computer Concepts
        const sectionId = `${examId}-section-1`;
        let section = await Section.findOne({
          examId: exam._id,
          id: sectionId
        });

        if (!section) {
          section = await Section.create({
            id: sectionId,
            name: "Computer Concepts",
            examId: exam._id,
            lessonNumber: 1,
            order: 1
          });
        } else {
          section.name = "Computer Concepts";
          section.order = 1;
          await section.save();
        }

        // Create part: CCC
        const partId = `${sectionId}-part-ccc`;
        let part = await Part.findOne({
          examId: exam._id,
          sectionId: section._id,
          id: partId
        });

        if (!part) {
          part = await Part.create({
            id: partId,
            name: "CCC",
            examId: exam._id,
            sectionId: section._id,
            order: 1
          });
        } else {
          part.name = "CCC";
          part.order = 1;
          await part.save();
        }

        // Delete existing questions for this exam to avoid duplicates
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Create 100 questions for this exam
        let totalQuestionsCreated = 0;
        for (let qIndex = 0; qIndex < 100; qIndex++) {
          totalQuestionsCreated++;
          const questionId = `${examId}-q-${qIndex + 1}`;
          
          await Question.create({
            id: questionId,
            examId: String(exam._id),
            sectionId: String(section._id),
            partId: String(part._id),
            questionNumber: totalQuestionsCreated,
            questionType: "MCQ",
            question_en: `CCC Exam ${examNum} - Question ${qIndex + 1}: What is the correct answer?`,
            question_hi: `CCC परीक्षा ${examNum} - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
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
            correctAnswer: 0, // Default to option A (0-indexed)
            marks: 1,
            negativeMarks: 0
          });
        }

        createdExams.push({
          examId: exam._id.toString(),
          title: exam.title,
          isFree: exam.isFree,
          sections: 1,
          parts: 1,
          questions: totalQuestionsCreated,
          totalTime: exam.totalTime,
          totalQuestions: exam.totalQuestions
        });

        console.log(`✅ Created exam ${examNum}/20: ${examTitle} (${exam.isFree ? 'FREE' : 'PAID'}) with ${totalQuestionsCreated} questions`);

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
      message: `Successfully created ${createdExams.length} CCC exams (20 total)`,
      exams: createdExams,
      summary: {
        total: createdExams.length,
        free: createdExams.filter(e => e.isFree).length,
        paid: createdExams.filter(e => !e.isFree).length
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "Each exam has 1 section (Computer Concepts) with 1 part (CCC) containing 100 questions, 1 mark each, no negative marks, 90 minutes duration."
    });

  } catch (error) {
    console.error("Create CCC exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create CCC exams" 
    }, { status: 500 });
  }
}

