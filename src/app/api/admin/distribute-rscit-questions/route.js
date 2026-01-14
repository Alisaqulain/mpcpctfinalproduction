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

    // Get all questions from RSCIT question banks
    const sectionAQuestions = await Question.find({
      examId: "RSCIT_QUESTION_BANK_A"
    });

    const sectionBQuestions = await Question.find({
      examId: "RSCIT_QUESTION_BANK_B"
    });

    if (sectionAQuestions.length === 0) {
      return NextResponse.json(
        { error: "RSCIT Section A question bank is empty. Please import Section A questions first." },
        { status: 400 }
      );
    }

    if (sectionBQuestions.length === 0) {
      return NextResponse.json(
        { error: "RSCIT Section B question bank is empty. Please import Section B questions first." },
        { status: 400 }
      );
    }

    // Get all RSCIT exams
    const rscitExams = await Exam.find({ key: "RSCIT" }).sort({ title: 1 });
    
    if (rscitExams.length === 0) {
      return NextResponse.json(
        { error: "No RSCIT exams found. Please create RSCIT exams first." },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process each exam
    for (const exam of rscitExams) {
      try {
        // Get sections for this exam
        const sectionA = await Section.findOne({ examId: exam._id, name: "Section A" });
        const sectionB = await Section.findOne({ examId: exam._id, name: "Section B" });

        if (!sectionA || !sectionB) {
          errors.push({ exam: exam.title, error: "Sections not found. Please create exam structure first." });
          continue;
        }

        const partA = await Part.findOne({ examId: exam._id, sectionId: sectionA._id });
        const partB = await Part.findOne({ examId: exam._id, sectionId: sectionB._id });

        if (!partA || !partB) {
          errors.push({ exam: exam.title, error: "Parts not found. Please create exam structure first." });
          continue;
        }

        // Delete existing questions for this exam
        await Question.deleteMany({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Shuffle and select 15 questions for Section A
        const shuffledSectionA = shuffleArray(sectionAQuestions);
        const selectedSectionA = shuffledSectionA.slice(0, 15);

        if (selectedSectionA.length < 15) {
          console.warn(`Warning: Only ${selectedSectionA.length} Section A questions available for ${exam.title}`);
        }

        // Shuffle and select 35 questions for Section B
        const shuffledSectionB = shuffleArray(sectionBQuestions);
        const selectedSectionB = shuffledSectionB.slice(0, 35);

        if (selectedSectionB.length < 35) {
          console.warn(`Warning: Only ${selectedSectionB.length} Section B questions available for ${exam.title}`);
        }

        // Process Section A questions
        const sectionAQuestionsToInsert = selectedSectionA.map((q, index) => {
          // Shuffle options
          const options = [...q.options_en];
          const options_hi = [...q.options_hi];
          const correctAnswerIndex = q.correctAnswer;
          
          const indices = [0, 1, 2, 3];
          const shuffledIndices = shuffleArray(indices);
          
          const newCorrectAnswer = shuffledIndices.indexOf(correctAnswerIndex);
          const shuffledOptions = shuffledIndices.map(i => options[i]);
          const shuffledOptions_hi = shuffledIndices.map(i => options_hi[i]);

          return {
            id: `rscit-exam-${exam.title.replace('RSCIT Exam ', '')}-section-a-q-${index + 1}`,
            examId: String(exam._id),
            sectionId: String(sectionA._id),
            partId: String(partA._id),
            questionNumber: index + 1,
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: shuffledOptions,
            options_hi: shuffledOptions_hi,
            correctAnswer: newCorrectAnswer,
            explanation_en: q.explanation_en || `The correct answer is ${String.fromCharCode(65 + newCorrectAnswer)}. ${shuffledOptions[newCorrectAnswer]}`,
            explanation_hi: q.explanation_hi || `सही उत्तर ${String.fromCharCode(65 + newCorrectAnswer)} है। ${shuffledOptions_hi[newCorrectAnswer] || shuffledOptions[newCorrectAnswer]}`,
            marks: 2,
            negativeMarks: 0
          };
        });

        // Process Section B questions
        const sectionBQuestionsToInsert = selectedSectionB.map((q, index) => {
          // Shuffle options
          const options = [...q.options_en];
          const options_hi = [...q.options_hi];
          const correctAnswerIndex = q.correctAnswer;
          
          const indices = [0, 1, 2, 3];
          const shuffledIndices = shuffleArray(indices);
          
          const newCorrectAnswer = shuffledIndices.indexOf(correctAnswerIndex);
          const shuffledOptions = shuffledIndices.map(i => options[i]);
          const shuffledOptions_hi = shuffledIndices.map(i => options_hi[i]);

          return {
            id: `rscit-exam-${exam.title.replace('RSCIT Exam ', '')}-section-b-q-${index + 1}`,
            examId: String(exam._id),
            sectionId: String(sectionB._id),
            partId: String(partB._id),
            questionNumber: 16 + index, // Questions 16-50 (after Section A's 15 questions)
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: shuffledOptions,
            options_hi: shuffledOptions_hi,
            correctAnswer: newCorrectAnswer,
            explanation_en: q.explanation_en || `The correct answer is ${String.fromCharCode(65 + newCorrectAnswer)}. ${shuffledOptions[newCorrectAnswer]}`,
            explanation_hi: q.explanation_hi || `सही उत्तर ${String.fromCharCode(65 + newCorrectAnswer)} है। ${shuffledOptions_hi[newCorrectAnswer] || shuffledOptions[newCorrectAnswer]}`,
            marks: 2,
            negativeMarks: 0
          };
        });

        // Insert all questions
        await Question.insertMany([...sectionAQuestionsToInsert, ...sectionBQuestionsToInsert]);

        results.push({
          examTitle: exam.title,
          sectionAQuestions: sectionAQuestionsToInsert.length,
          sectionBQuestions: sectionBQuestionsToInsert.length,
          totalQuestions: sectionAQuestionsToInsert.length + sectionBQuestionsToInsert.length
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
      message: `Distributed questions to ${results.length} RSCIT exams`,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      totalQuestionsInBank: {
        sectionA: sectionAQuestions.length,
        sectionB: sectionBQuestions.length
      }
    });

  } catch (error) {
    console.error("Error distributing RSCIT questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to distribute questions" },
      { status: 500 }
    );
  }
}

