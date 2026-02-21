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

    // Create or find RSCIT exam
    let exam = await Exam.findOne({ key: "RSCIT" });
    if (!exam) {
      exam = await Exam.create({
        key: "RSCIT",
        title: "RSCIT Dummy Practice Exam",
        totalTime: 110, // 90 min MCQ + 10 min English + 10 min Hindi = 110 min total
        totalQuestions: 100 // Only MCQ questions count
      });
    } else {
      // Update existing exam
      exam.title = "RSCIT Dummy Practice Exam";
      exam.totalTime = 110;
      exam.totalQuestions = 100;
      await exam.save();

      // Delete all existing sections, parts, and questions for this exam to avoid duplicate key errors
      const examId = String(exam._id);
      const existingSections = await Section.find({ examId: exam._id });
      
      // Delete all parts for these sections
      for (const section of existingSections) {
        await Part.deleteMany({ sectionId: section._id });
      }
      
      // Delete all questions for this exam (try both string and ObjectId formats)
      await Question.deleteMany({ 
        $or: [
          { examId: examId },
          { examId: exam._id }
        ]
      });
      
      // Delete all sections
      await Section.deleteMany({ examId: exam._id });
      
      console.log('✅ Deleted existing RSCIT sections, parts, and questions before creating new ones');
    }

    let totalQuestionsCreated = 0;
    const createdSections = [];

    // Section 1: 100 MCQ questions (90 minutes)
    const section1Id = `rscit-section-1-mcq`;
    // Delete existing section with this id if it exists (to avoid duplicate key error)
    await Section.deleteOne({ id: section1Id });
    
    const section1 = await Section.create({
      id: section1Id,
      name: "Section 1 - MCQ Questions",
      examId: exam._id,
      lessonNumber: 1,
      order: 1
    });
    createdSections.push(section1);

    // Delete all existing questions for Section 1 before creating new ones
    const deletedSection1Questions = await Question.deleteMany({
      $or: [
        { examId: String(exam._id), sectionId: String(section1._id) },
        { examId: exam._id, sectionId: section1._id }
      ]
    });
    console.log(`✅ Deleted ${deletedSection1Questions.deletedCount} existing questions for Section 1`);

    // Create 100 MCQ questions for Section 1
    for (let qIndex = 0; qIndex < 100; qIndex++) {
      totalQuestionsCreated++;
      const questionId = `rscit-s1-q-${qIndex + 1}`;
      
      // Delete any existing question with this id (to avoid duplicate key error)
      await Question.deleteOne({ id: questionId });
      
      const createdQuestion = await Question.create({
        id: questionId,
        examId: String(exam._id),
        sectionId: String(section1._id),
        questionNumber: totalQuestionsCreated,
        questionType: "MCQ",
        question_en: `RSCIT Section 1 - Question ${qIndex + 1}: What is the correct answer?`,
        question_hi: `RSCIT अनुभाग 1 - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
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
      
      if (qIndex === 0 || qIndex === 99) {
        console.log(`✅ Created question ${qIndex + 1}: ${createdQuestion._id} (id: ${createdQuestion.id})`);
      }
    }
    console.log(`✅ Created ${totalQuestionsCreated} MCQ questions for Section 1`);

    // Section 2: English Typing (10 minutes)
    const section2Id = `rscit-section-2-english-typing`;
    // Delete existing section with this id if it exists (to avoid duplicate key error)
    await Section.deleteOne({ id: section2Id });
    
    const section2 = await Section.create({
      id: section2Id,
      name: "English Typing",
      examId: exam._id,
      lessonNumber: 2,
      order: 2
    });
    createdSections.push(section2);

    // Delete all existing questions for Section 2 before creating new ones
    const deletedSection2Questions = await Question.deleteMany({
      $or: [
        { examId: String(exam._id), sectionId: String(section2._id) },
        { examId: exam._id, sectionId: section2._id }
      ]
    });
    console.log(`✅ Deleted ${deletedSection2Questions.deletedCount} existing questions for Section 2`);

    // Create English typing question
    const englishTypingQuestionId = `rscit-english-typing-q-1`;
    // Delete any existing question with this id (to avoid duplicate key error)
    await Question.deleteOne({ id: englishTypingQuestionId });
    
    totalQuestionsCreated++;
    const englishTypingQuestion = await Question.create({
      id: englishTypingQuestionId,
      examId: String(exam._id),
      sectionId: String(section2._id),
      questionNumber: totalQuestionsCreated,
      questionType: "TYPING",
      typingLanguage: "English",
      typingContent_english: "The quick brown fox jumps over the lazy dog. Practice typing to improve your speed and accuracy. This is a sample English typing test for RSCIT exam preparation. Type carefully and focus on accuracy. Speed will come with practice. Keep your fingers on the home row and maintain proper posture while typing.",
      typingDuration: 10, // 10 minutes
      typingBackspaceEnabled: true,
      marks: 0
    });
    console.log(`✅ Created English typing question: ${englishTypingQuestion._id} (id: ${englishTypingQuestion.id})`);

    // Section 3: Hindi Typing (10 minutes)
    const section3Id = `rscit-section-3-hindi-typing`;
    // Delete existing section with this id if it exists (to avoid duplicate key error)
    await Section.deleteOne({ id: section3Id });
    
    const section3 = await Section.create({
      id: section3Id,
      name: "हिंदी टाइपिंग",
      examId: exam._id,
      lessonNumber: 3,
      order: 3
    });
    createdSections.push(section3);

    // Delete all existing questions for Section 3 before creating new ones
    const deletedSection3Questions = await Question.deleteMany({
      $or: [
        { examId: String(exam._id), sectionId: String(section3._id) },
        { examId: exam._id, sectionId: section3._id }
      ]
    });
    console.log(`✅ Deleted ${deletedSection3Questions.deletedCount} existing questions for Section 3`);

    // Create Hindi typing question
    const hindiTypingQuestionId = `rscit-hindi-typing-q-1`;
    // Delete any existing question with this id (to avoid duplicate key error)
    await Question.deleteOne({ id: hindiTypingQuestionId });
    
    totalQuestionsCreated++;
    const hindiTypingQuestion = await Question.create({
      id: hindiTypingQuestionId,
      examId: String(exam._id),
      sectionId: String(section3._id),
      questionNumber: totalQuestionsCreated,
      questionType: "TYPING",
      typingLanguage: "Hindi",
      typingScriptType: "Ramington Gail",
      typingContent_hindi_ramington: "किताब ज्ञान का भंडार होती है। इनमें हर तरह का ज्ञान भरा होता है। ये मानव की सबसे बेहतरीन मित्र होती है। किताब इंसान को सही पथ दिखने का काम करती है और उसे गलत राह पर चलने से सदैव रोकती है। कोई भी किताब किसी इंसान या ज्ञानी आदमी के ज्ञान व अनुभवों का विवेचन होती है। कम समय में अधिक से अधिक जानकारी व ज्ञान पाने का किताब ही बेहतरीन जरिया है।",
      typingContent_hindi_inscript: "किताब ज्ञान का भंडार होती है। इनमें हर तरह का ज्ञान भरा होता है। ये मानव की सबसे बेहतरीन मित्र होती है। किताब इंसान को सही पथ दिखने का काम करती है और उसे गलत राह पर चलने से सदैव रोकती है। कोई भी किताब किसी इंसान या ज्ञानी आदमी के ज्ञान व अनुभवों का विवेचन होती है। कम समय में अधिक से अधिक जानकारी व ज्ञान पाने का किताब ही बेहतरीन जरिया है।",
      typingDuration: 10, // 10 minutes
      typingBackspaceEnabled: true,
      marks: 0
    });
    console.log(`✅ Created Hindi typing question: ${hindiTypingQuestion._id} (id: ${hindiTypingQuestion.id})`);

    return NextResponse.json({
      success: true,
      message: "RSCIT dummy exam created successfully with 3 sections",
      exam: {
        _id: exam._id,
        key: exam.key,
        title: exam.title,
        totalTime: exam.totalTime,
        totalQuestions: exam.totalQuestions
      },
      structure: {
        section1: {
          name: "Section 1 - MCQ Questions",
          questions: 100,
          duration: "90 minutes",
          type: "MCQ"
        },
        section2: {
          name: "English Typing",
          questions: 1,
          duration: "10 minutes",
          type: "TYPING"
        },
        section3: {
          name: "हिंदी टाइपिंग",
          questions: 1,
          duration: "10 minutes",
          type: "TYPING"
        }
      },
      totalQuestions: totalQuestionsCreated,
      sectionsCreated: createdSections.length,
      totalTime: "110 minutes (90 min MCQ + 10 min English + 10 min Hindi)"
    });

  } catch (error) {
    console.error("Create RSCIT dummy exam error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create RSCIT dummy exam" 
    }, { status: 500 });
  }
}

