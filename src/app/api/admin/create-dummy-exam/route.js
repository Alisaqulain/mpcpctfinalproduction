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

    // Create or find Dummy exam
    let exam = await Exam.findOne({ key: "DUMMY" });
    if (!exam) {
      exam = await Exam.create({
        key: "DUMMY",
        title: "Dummy Practice Exam - CPCT",
        totalTime: 120,
        totalQuestions: 75 // 5 sections * 3 parts * 5 questions = 75
      });
    } else {
      exam.title = "Dummy Practice Exam - CPCT";
      exam.totalTime = 120;
      exam.totalQuestions = 75;
      await exam.save();
    }

    // Create 5 MCQ sections, each with 3 parts, 5 questions each
    const sectionNames = ["Section 1", "Section 2", "Section 3", "Section 4", "Section 5"];
    const createdSections = [];
    let questionCount = 0;

    for (let secIndex = 0; secIndex < sectionNames.length; secIndex++) {
      const sectionName = sectionNames[secIndex];
      const sectionId = `dummy-section-${secIndex + 1}`;
      
      // Create or find section
      let section = await Section.findOne({ 
        examId: exam._id,
        id: sectionId
      });

      if (!section) {
        section = await Section.create({
          id: sectionId,
          name: sectionName,
          examId: exam._id,
          lessonNumber: secIndex + 1,
          order: secIndex + 1
        });
      }
      createdSections.push(section);

      // Create 3 parts for this section
      for (let partIndex = 0; partIndex < 3; partIndex++) {
        const partName = `Part ${partIndex + 1}`;
        const partId = `dummy-part-${secIndex + 1}-${partIndex + 1}`;
        
        let part = await Part.findOne({
          examId: exam._id,
          sectionId: section._id,
          id: partId
        });

        if (!part) {
          part = await Part.create({
            id: partId,
            name: partName,
            examId: exam._id,
            sectionId: section._id,
            order: partIndex + 1
          });
        }

        // Create 5 questions for this part
        for (let qIndex = 0; qIndex < 5; qIndex++) {
          questionCount++;
          const questionId = `dummy-q-${secIndex + 1}-${partIndex + 1}-${qIndex + 1}`;
          
          const questionExists = await Question.findOne({
            examId: exam._id,
            sectionId: section._id,
            partId: part._id,
            id: questionId
          });

          if (!questionExists) {
            await Question.create({
              id: questionId,
              examId: exam._id,
              sectionId: section._id,
              partId: part._id,
              questionNumber: questionCount,
              questionType: "MCQ",
              question_en: `Question ${qIndex + 1} in ${sectionName} - ${partName}: What is the answer?`,
              question_hi: `प्रश्न ${qIndex + 1} ${sectionName} - ${partName} में: उत्तर क्या है?`,
              options: [
                { text_en: "Option A", text_hi: "विकल्प A" },
                { text_en: "Option B", text_hi: "विकल्प B" },
                { text_en: "Option C", text_hi: "विकल्प C" },
                { text_en: "Option D", text_hi: "विकल्प D" }
              ],
              correctAnswer: "A",
              marks: 1,
              negativeMarks: 0
            });
          }
        }
      }
    }

    // Create Typing section after 5 sections
    const typingSectionId = `dummy-section-typing`;
    let typingSection = await Section.findOne({
      examId: exam._id,
      id: typingSectionId
    });

    if (!typingSection) {
      typingSection = await Section.create({
        id: typingSectionId,
        name: "English Typing Test",
        examId: exam._id,
        lessonNumber: 6,
        order: 6
      });
    }

    // Create a typing question
    const typingQuestionId = `dummy-typing-q-1`;
    const typingQuestionExists = await Question.findOne({
      examId: exam._id,
      sectionId: typingSection._id,
      id: typingQuestionId
    });

    if (!typingQuestionExists) {
      await Question.create({
        id: typingQuestionId,
        examId: exam._id,
        sectionId: typingSection._id,
        questionType: "TYPING TEST",
        question_en: "Type the following text: The quick brown fox jumps over the lazy dog. Practice typing to improve your speed and accuracy.",
        question_hi: "निम्नलिखित पाठ टाइप करें: तेज़ भूरी लोमड़ी आलसी कुत्ते के ऊपर कूदती है। अपनी गति और सटीकता में सुधार करने के लिए टाइपिंग का अभ्यास करें।",
        typingContent: "The quick brown fox jumps over the lazy dog. Practice typing to improve your speed and accuracy.",
        typingContent_hindi: "तेज़ भूरी लोमड़ी आलसी कुत्ते के ऊपर कूदती है। अपनी गति और सटीकता में सुधार करने के लिए टाइपिंग का अभ्यास करें।",
        typingDuration: 10, // 10 minutes
        typingLanguage: "English",
        typingScriptType: "Inscript",
        typingBackspaceEnabled: true,
        marks: 0
      });
    }

    return NextResponse.json({
      success: true,
      message: "Dummy exam created successfully",
      exam: {
        _id: exam._id,
        key: exam.key,
        title: exam.title
      },
      sections: createdSections.length + 1, // 5 MCQ + 1 Typing
      parts: sectionNames.length * 3, // 5 sections * 3 parts
      questions: questionCount + 1, // 75 MCQ + 1 Typing
      note: "Break time after 5 sections: 10 minutes"
    });

  } catch (error) {
    console.error("Create dummy exam error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create dummy exam" 
    }, { status: 500 });
  }
}



