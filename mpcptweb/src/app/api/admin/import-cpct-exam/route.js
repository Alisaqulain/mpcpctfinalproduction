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
  if (!token) return { ok: false, error: "Unauthorized" };
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload.role !== "admin") return { ok: false, error: "Forbidden" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Unauthorized" };
  }
}

// Helper function to parse question data
function parseQuestionData(text) {
  const questions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentQuestion = null;
  let currentOptions = [];
  let inOptions = false;
  let isEnglish = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect language switch
    if (line.includes('OS म') || line.includes('िनम्न म') || line.includes('िदए गए')) {
      isEnglish = false;
    }
    
    // Question number detection
    if (line.includes('Question Number :') && line.includes('Question Id :')) {
      if (currentQuestion && currentOptions.length > 0) {
        if (isEnglish) {
          currentQuestion.options_en = currentOptions;
        } else {
          currentQuestion.options_hi = currentOptions;
          questions.push(currentQuestion);
          currentQuestion = null;
        }
        currentOptions = [];
      }
      
      const qNumMatch = line.match(/Question Number : (\d+)/);
      const qIdMatch = line.match(/Question Id : (\d+)/);
      const correctMatch = line.match(/Correct Marks : (\d+)/);
      const wrongMatch = line.match(/Wrong Marks : (\d+)/);
      
      if (qNumMatch && qIdMatch) {
        currentQuestion = {
          questionNumber: parseInt(qNumMatch[1]),
          questionId: qIdMatch[1],
          correctMarks: correctMatch ? parseInt(correctMatch[1]) : 1,
          wrongMarks: wrongMatch ? parseInt(wrongMatch[1]) : 0,
          questionType: line.includes('TYPING') ? 'TYPING' : 'MCQ',
          options_en: [],
          options_hi: [],
          isEnglish: true
        };
        isEnglish = true;
        inOptions = false;
      }
    }
    
    // Question text
    if (currentQuestion && line && !line.includes('Question Number') && !line.includes('Options :') && !line.includes('Question Id') && !line.match(/^\d+\./)) {
      if (!inOptions) {
        if (isEnglish && !currentQuestion.question_en) {
          currentQuestion.question_en = line;
        } else if (!isEnglish && !currentQuestion.question_hi) {
          currentQuestion.question_hi = line;
        }
      }
    }
    
    // Options detection
    if (line.includes('Options :')) {
      inOptions = true;
      currentOptions = [];
    }
    
    // Parse options
    if (inOptions && line.match(/^\d+\./)) {
      const optionText = line.replace(/^\d+\.\s*/, '').trim();
      if (optionText) {
        currentOptions.push(optionText);
      }
    }
    
    // Typing content
    if (currentQuestion && currentQuestion.questionType === 'TYPING') {
      if (line && !line.includes('Question Number') && !line.includes('Question Id') && !line.includes('Options')) {
        if (isEnglish) {
          if (!currentQuestion.typingContent_english) {
            currentQuestion.typingContent_english = line;
          } else {
            currentQuestion.typingContent_english += ' ' + line;
          }
        } else {
          // Check keyboard layout
          if (line.includes('Remington') || currentQuestion.typingScriptType === 'Ramington Gail') {
            if (!currentQuestion.typingContent_hindi_ramington) {
              currentQuestion.typingContent_hindi_ramington = line;
            } else {
              currentQuestion.typingContent_hindi_ramington += ' ' + line;
            }
            currentQuestion.typingScriptType = 'Ramington Gail';
          } else {
            if (!currentQuestion.typingContent_hindi_inscript) {
              currentQuestion.typingContent_hindi_inscript = line;
            } else {
              currentQuestion.typingContent_hindi_inscript += ' ' + line;
            }
            currentQuestion.typingScriptType = 'Inscript';
          }
        }
      }
    }
  }
  
  // Add last question
  if (currentQuestion && currentOptions.length > 0) {
    if (isEnglish) {
      currentQuestion.options_en = currentOptions;
    } else {
      currentQuestion.options_hi = currentOptions;
    }
    questions.push(currentQuestion);
  }
  
  return questions;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const body = await req.json();
    const { action, sectionData } = body;

    await dbConnect();

    // Find or create CPCT exam
    let cpctExam = await Exam.findOne({ key: "CPCT" });
    if (!cpctExam) {
      cpctExam = await Exam.create({
        key: "CPCT",
        title: "Computer Proficiency Certification Test",
        totalTime: 120,
        totalQuestions: 75
      });
    }

    if (action === "import-section") {
      // Import a specific section
      const { sectionName, sectionId, sectionNumber, questionsData } = sectionData;
      
      // Create or find section
      let section = await Section.findOne({ 
        examId: cpctExam._id,
        id: `cpct-section-${sectionNumber}`
      });
      
      if (!section) {
        section = await Section.create({
          id: `cpct-section-${sectionNumber}`,
          name: sectionName,
          examId: cpctExam._id,
          lessonNumber: sectionNumber,
          order: sectionNumber
        });
      }

      // Import questions for this section
      let imported = 0;
      let errors = [];

      for (const qData of questionsData) {
        try {
          const questionId = `cpct-q-${qData.questionId || Date.now()}-${Math.random()}`;
          
          const questionDoc = {
            examId: String(cpctExam._id),
            sectionId: String(section._id),
            id: questionId,
            questionType: qData.questionType || 'MCQ',
            marks: qData.correctMarks || 1,
            negativeMarks: qData.wrongMarks || 0,
            isFree: false
          };

          if (qData.questionType === 'TYPING') {
            questionDoc.typingLanguage = qData.typingLanguage || 'English';
            questionDoc.typingScriptType = qData.typingScriptType || 'Inscript';
            questionDoc.typingContent_english = qData.typingContent_english || '';
            questionDoc.typingContent_hindi_ramington = qData.typingContent_hindi_ramington || '';
            questionDoc.typingContent_hindi_inscript = qData.typingContent_hindi_inscript || '';
            questionDoc.typingDuration = qData.typingDuration || 5;
            questionDoc.typingBackspaceEnabled = qData.allowBackSpace !== false;
          } else {
            questionDoc.question_en = qData.question_en || '';
            questionDoc.question_hi = qData.question_hi || '';
            questionDoc.options_en = qData.options_en || [];
            questionDoc.options_hi = qData.options_hi || [];
            questionDoc.correctAnswer = qData.correctAnswer || 0;
          }

          await Question.create(questionDoc);
          imported++;
        } catch (error) {
          errors.push({ questionId: qData.questionId, error: error.message });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Imported ${imported} questions to section "${sectionName}"`,
        imported,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message || "Failed to import exam data" }, { status: 500 });
  }
}






