import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
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

// Parse the exam data from the provided text
function parseExamData(text) {
  const sections = [];
  let currentSection = null;
  let currentQuestion = null;
  let currentSubQuestions = [];
  let inOptions = false;
  let currentOptions = [];
  let isEnglish = true;
  let questionNumber = 0;

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section
    if (line.includes('Section Id :') && line.includes('Section Number :')) {
      // Save previous section if exists
      if (currentSection && currentQuestion) {
        if (currentQuestion.questionType === 'COMPREHENSION' && currentSubQuestions.length > 0) {
          currentQuestion.subQuestions = currentSubQuestions;
        }
        currentSection.questions.push(currentQuestion);
        currentQuestion = null;
        currentSubQuestions = [];
      }
      if (currentSection) {
        sections.push(currentSection);
      }

      const sectionNameMatch = line.match(/Section type : (\w+)/);
      const sectionNumberMatch = line.match(/Section Number : (\d+)/);
      const sectionName = getSectionName(line, lines, i);

      currentSection = {
        sectionNumber: sectionNumberMatch ? parseInt(sectionNumberMatch[1]) : 1,
        name: sectionName,
        sectionType: sectionNameMatch ? sectionNameMatch[1] : 'Online',
        questions: []
      };
      isEnglish = true;
      continue;
    }

    // Detect question
    if (line.includes('Question Number :') && line.includes('Question Id :')) {
      // Save previous question
      if (currentQuestion) {
        if (currentQuestion.questionType === 'COMPREHENSION' && currentSubQuestions.length > 0) {
          currentQuestion.subQuestions = currentSubQuestions;
        }
        if (currentSection) {
          currentSection.questions.push(currentQuestion);
        }
      }

      const qNumMatch = line.match(/Question Number : (\d+)/);
      const qIdMatch = line.match(/Question Id : (\d+)/);
      const qTypeMatch = line.match(/Question Type : (\w+)/);
      const correctMarksMatch = line.match(/Correct Marks : (\d+)/);
      const wrongMarksMatch = line.match(/Wrong Marks : (\d+)/);

      questionNumber = qNumMatch ? parseInt(qNumMatch[1]) : questionNumber + 1;
      const questionType = qTypeMatch ? qTypeMatch[1] : 'MCQ';

      currentQuestion = {
        questionNumber,
        questionId: qIdMatch ? qIdMatch[1] : `${Date.now()}-${Math.random()}`,
        questionType: questionType === 'TYPING TEST' ? 'TYPING' : (questionType === 'COMPREHENSION' ? 'COMPREHENSION' : 'MCQ'),
        correctMarks: correctMarksMatch ? parseInt(correctMarksMatch[1]) : 1,
        wrongMarks: wrongMarksMatch ? parseInt(wrongMarksMatch[1]) : 0,
        question_en: '',
        question_hi: '',
        options_en: [],
        options_hi: [],
        correctAnswer: 0,
        isFree: true // Make all questions free
      };

      if (questionType === 'TYPING TEST') {
        currentQuestion.typingLanguage = 'English';
        currentQuestion.typingScriptType = 'Inscript';
        currentQuestion.typingContent_english = '';
        currentQuestion.typingContent_hindi_ramington = '';
        currentQuestion.typingContent_hindi_inscript = '';
        currentQuestion.typingDuration = 5;
        currentQuestion.typingBackspaceEnabled = true;
      }

      currentSubQuestions = [];
      currentOptions = [];
      inOptions = false;
      isEnglish = true;
      continue;
    }

    // Detect sub-question for comprehension
    if (line.includes('Sub questions') || (line.includes('Question Number :') && currentQuestion?.questionType === 'COMPREHENSION')) {
      if (line.includes('Question Number :')) {
        const subQNumMatch = line.match(/Question Number : (\d+)/);
        const subQIdMatch = line.match(/Question Id : (\d+)/);
        if (subQNumMatch && subQIdMatch) {
          const subQuestion = {
            questionNumber: parseInt(subQNumMatch[1]),
            questionId: subQIdMatch[1],
            question_en: '',
            question_hi: '',
            options_en: [],
            options_hi: [],
            correctAnswer: 0
          };
          currentSubQuestions.push(subQuestion);
          currentQuestion = subQuestion;
          inOptions = false;
          currentOptions = [];
          isEnglish = true;
          continue;
        }
      }
    }

    // Detect language switch (Hindi)
    if (line.includes('OS म') || line.includes('िनम्न म') || line.includes('िदए गए') || 
        line.includes('टनर') || line.includes('कौन-सा') || line.includes('का पूण')) {
      isEnglish = false;
    }

    // Detect options
    if (line.includes('Options :')) {
      inOptions = true;
      currentOptions = [];
      continue;
    }

    // Parse options
    if (inOptions && line.match(/^\d+\./)) {
      const optionText = line.replace(/^\d+\.\s*/, '').trim();
      if (optionText) {
        if (isEnglish) {
          if (!currentQuestion.options_en) currentQuestion.options_en = [];
          currentQuestion.options_en.push(optionText);
        } else {
          if (!currentQuestion.options_hi) currentQuestion.options_hi = [];
          currentQuestion.options_hi.push(optionText);
        }
      }
      continue;
    }

    // Parse question text (not options, not metadata)
    if (currentQuestion && !inOptions && line && 
        !line.includes('Question Number') && 
        !line.includes('Question Id') && 
        !line.includes('Question Type') &&
        !line.includes('Correct Marks') &&
        !line.includes('Wrong Marks') &&
        !line.includes('Options :') &&
        !line.match(/^\d+\./) &&
        !line.includes('Section') &&
        !line.includes('Group') &&
        !line.includes('Restricted') &&
        !line.includes('Keyboard Layout') &&
        !line.includes('Show Details') &&
        !line.includes('Allow Back Space') &&
        !line.includes('Display Question Number') &&
        !line.includes('Sub-Section') &&
        !line.includes('Question Shuffling')) {
      
      // For typing questions, collect content
      if (currentQuestion.questionType === 'TYPING') {
        if (isEnglish) {
          currentQuestion.typingContent_english += (currentQuestion.typingContent_english ? ' ' : '') + line;
        } else {
          // Check for keyboard layout
          if (line.includes('Remington') || line.includes('Remington Gail')) {
            currentQuestion.typingScriptType = 'Ramington Gail';
            currentQuestion.typingContent_hindi_ramington += (currentQuestion.typingContent_hindi_ramington ? ' ' : '') + line.replace(/.*Remington.*?:\s*/, '');
          } else {
            currentQuestion.typingContent_hindi_inscript += (currentQuestion.typingContent_hindi_inscript ? ' ' : '') + line;
          }
        }
      } else {
        // For MCQ/Comprehension questions
        if (isEnglish) {
          if (!currentQuestion.question_en) {
            currentQuestion.question_en = line;
          } else if (line.length > 10) { // Only append substantial lines
            currentQuestion.question_en += ' ' + line;
          }
        } else {
          if (!currentQuestion.question_hi) {
            currentQuestion.question_hi = line;
          } else if (line.length > 10) {
            currentQuestion.question_hi += ' ' + line;
          }
        }
      }
    }

    // Detect typing test settings
    if (line.includes('Keyboard Layout :')) {
      const layoutMatch = line.match(/Keyboard Layout : (\w+)/);
      if (layoutMatch && currentQuestion) {
        if (layoutMatch[1] === 'Remington' || layoutMatch[1].includes('Remington')) {
          currentQuestion.typingScriptType = 'Ramington Gail';
        } else {
          currentQuestion.typingScriptType = 'Inscript';
        }
      }
    }

    if (line.includes('Allow Back Space :')) {
      const backspaceMatch = line.match(/Allow Back Space : (\w+)/);
      if (backspaceMatch && currentQuestion) {
        currentQuestion.typingBackspaceEnabled = backspaceMatch[1] === 'Yes';
      }
    }
  }

  // Save last question and section
  if (currentQuestion) {
    if (currentQuestion.questionType === 'COMPREHENSION' && currentSubQuestions.length > 0) {
      currentQuestion.subQuestions = currentSubQuestions;
    }
    if (currentSection) {
      currentSection.questions.push(currentQuestion);
    }
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function getSectionName(line, allLines, currentIndex) {
  // Look for section name patterns
  const patterns = [
    /COMPUTER PROFICIENCY/,
    /READING COMPREHENSION/,
    /QUANTITATIVE APTITUDE/,
    /GENERAL MENTAL ABILITY/,
    /GENERAL AWARENESS/,
    /English Mock/,
    /English Actual/,
    /Hindi Mock/,
    /Hindi Actual/
  ];

  // Check current and nearby lines
  for (let i = Math.max(0, currentIndex - 5); i < Math.min(allLines.length, currentIndex + 10); i++) {
    for (const pattern of patterns) {
      if (pattern.test(allLines[i])) {
        return allLines[i].trim();
      }
    }
  }

  return 'Untitled Section';
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    const body = await req.json();
    const { examData } = body;

    if (!examData) {
      return NextResponse.json({ error: "Exam data is required" }, { status: 400 });
    }

    await dbConnect();

    // Create or update CPCT exam
    let exam = await Exam.findOne({ key: "CPCT" });
    if (!exam) {
      exam = await Exam.create({
        key: "CPCT",
        title: "Computer Proficiency Certification Test - 21st Nov 2025 Shift 2 QP1",
        totalTime: 120,
        totalQuestions: 75
      });
    } else {
      exam.title = "Computer Proficiency Certification Test - 21st Nov 2025 Shift 2 QP1";
      exam.totalTime = 120;
      exam.totalQuestions = 75;
      await exam.save();
    }

    // Parse exam data
    const sections = parseExamData(examData);

    let totalImported = 0;
    let totalErrors = 0;
    const errors = [];

    // Import sections and questions
    for (const sectionData of sections) {
      try {
        // Create or find section
        const sectionId = `cpct-section-${sectionData.sectionNumber}`;
        let section = await Section.findOne({ 
          examId: exam._id,
          id: sectionId
        });

        if (!section) {
          section = await Section.create({
            id: sectionId,
            name: sectionData.name,
            examId: exam._id,
            lessonNumber: sectionData.sectionNumber,
            order: sectionData.sectionNumber
          });
        } else {
          section.name = sectionData.name;
          await section.save();
        }

        // Import questions
        for (const qData of sectionData.questions) {
          try {
            const questionId = `cpct-q-${qData.questionId}`;
            
            // Check if question already exists
            let question = await Question.findOne({ id: questionId });

            const questionDoc = {
              examId: String(exam._id),
              sectionId: String(section._id),
              id: questionId,
              questionType: qData.questionType,
              marks: qData.correctMarks || 1,
              negativeMarks: qData.wrongMarks || 0,
              isFree: true // Make exam free
            };

            if (qData.questionType === 'TYPING') {
              questionDoc.typingLanguage = qData.typingLanguage || 'English';
              questionDoc.typingScriptType = qData.typingScriptType || 'Inscript';
              questionDoc.typingContent_english = qData.typingContent_english || '';
              questionDoc.typingContent_hindi_ramington = qData.typingContent_hindi_ramington || '';
              questionDoc.typingContent_hindi_inscript = qData.typingContent_hindi_inscript || '';
              questionDoc.typingDuration = qData.typingDuration || 5;
              questionDoc.typingBackspaceEnabled = qData.typingBackspaceEnabled !== false;
            } else if (qData.questionType === 'COMPREHENSION') {
              // Handle comprehension questions
              questionDoc.question_en = qData.question_en || '';
              questionDoc.question_hi = qData.question_hi || '';
              questionDoc.options_en = qData.options_en || [];
              questionDoc.options_hi = qData.options_hi || [];
              questionDoc.correctAnswer = qData.correctAnswer || 0;
              // Store sub-questions as a passage or in explanation
              if (qData.subQuestions && qData.subQuestions.length > 0) {
                questionDoc.passage_en = qData.question_en || '';
                questionDoc.passage_hi = qData.question_hi || '';
                // For now, we'll create separate questions for sub-questions
                // Or store them in a way that can be retrieved
              }
            } else {
              // MCQ questions
              questionDoc.question_en = qData.question_en || '';
              questionDoc.question_hi = qData.question_hi || '';
              questionDoc.options_en = qData.options_en || [];
              questionDoc.options_hi = qData.options_hi || [];
              questionDoc.correctAnswer = qData.correctAnswer || 0;
            }

            if (question) {
              // Update existing question
              Object.assign(question, questionDoc);
              await question.save();
            } else {
              // Create new question
              await Question.create(questionDoc);
            }
            totalImported++;
          } catch (error) {
            totalErrors++;
            errors.push({ questionId: qData.questionId, error: error.message });
            console.error(`Error importing question ${qData.questionId}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error importing section ${sectionData.name}:`, error);
        errors.push({ section: sectionData.name, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported CPCT exam paper. Imported ${totalImported} questions.`,
      imported: totalImported,
      errors: totalErrors,
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit error details
      exam: {
        _id: exam._id,
        key: exam.key,
        title: exam.title
      },
      note: "All questions are set as FREE. You can edit questions and add images through the admin panel."
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to import exam data" 
    }, { status: 500 });
  }
}

