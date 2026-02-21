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

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    // Get all questions from CCC question bank
    const questionBank = await Question.find({
      examId: "CCC_QUESTION_BANK"
    });

    if (questionBank.length === 0) {
      return NextResponse.json(
        { error: "CCC question bank is empty. Please import questions first." },
        { status: 400 }
      );
    }

    // Get all CCC exams (should be 20)
    const cccExams = await Exam.find({ key: "CCC" }).sort({ title: 1 });
    
    if (cccExams.length === 0) {
      return NextResponse.json(
        { error: "No CCC exams found. Please create 20 CCC exams first." },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process each exam
    for (const exam of cccExams) {
      try {
        // Get section and part for this exam
        const section = await Section.findOne({ examId: exam._id });
        if (!section) {
          errors.push({ exam: exam.title, error: "Section not found" });
          continue;
        }

        const part = await Part.findOne({ examId: exam._id, sectionId: section._id });
        if (!part) {
          errors.push({ exam: exam.title, error: "Part not found" });
          continue;
        }

        // Delete existing questions for this exam
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Shuffle question bank and select 100 questions
        const shuffledBank = shuffleArray(questionBank);
        const selectedQuestions = shuffledBank.slice(0, 100);

        if (selectedQuestions.length < 100) {
          console.warn(`Warning: Only ${selectedQuestions.length} questions available for ${exam.title}`);
        }

        // Create questions for this exam
        const questionsToInsert = selectedQuestions.map((q, index) => {
          // Shuffle options for each question
          const options = [...q.options_en];
          const options_hi = [...q.options_hi];
          const correctAnswerIndex = q.correctAnswer;
          
          const indices = [0, 1, 2, 3];
          const shuffledIndices = shuffleArray(indices);
          
          const newCorrectAnswer = shuffledIndices.indexOf(correctAnswerIndex);
          const shuffledOptions = shuffledIndices.map(i => options[i]);
          const shuffledOptions_hi = shuffledIndices.map(i => options_hi[i]);

          return {
            id: `ccc-exam-${exam.title.replace('CCC Exam ', '')}-q-${index + 1}`,
            examId: String(exam._id),
            sectionId: String(section._id),
            partId: String(part._id),
            questionNumber: index + 1,
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: shuffledOptions,
            options_hi: shuffledOptions_hi,
            correctAnswer: newCorrectAnswer,
            explanation_en: q.explanation_en || `The correct answer is ${String.fromCharCode(65 + newCorrectAnswer)}. ${shuffledOptions[newCorrectAnswer]}`,
            explanation_hi: q.explanation_hi || `सही उत्तर ${String.fromCharCode(65 + newCorrectAnswer)} है। ${shuffledOptions_hi[newCorrectAnswer] || shuffledOptions[newCorrectAnswer]}`,
            marks: 1,
            negativeMarks: 0
          };
        });

        await Question.insertMany(questionsToInsert);

        results.push({
          examTitle: exam.title,
          questionsAdded: questionsToInsert.length
        });

      } catch (error) {
        errors.push({
          exam: exam.title,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Distributed questions to ${results.length} CCC exams`,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      totalQuestionsInBank: questionBank.length
    });

  } catch (error) {
    console.error("Error distributing CCC questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to distribute questions" },
      { status: 500 }
    );
  }
}

















