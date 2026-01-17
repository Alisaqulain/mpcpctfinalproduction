import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import Question from "@/lib/models/Question";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return { ok: false, error: "Unauthorized" };
    }
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return { ok: false, error: "Forbidden" };
    }
    return { ok: true, userId: payload.userId };
  } catch (error) {
    return { ok: false, error: "Unauthorized" };
  }
}

function parseQuestionsText(text) {
  const questions = [];
  const lines = text.split('\n').map(l => l.trim());
  
  let currentQuestion = null;
  let currentLanguage = 'en'; // 'en' or 'hi'
  let inOptions = false;
  let questionNumber = 0;
  let expectingQuestionText = false;
  let hasSeenOptions = false;
  
  // Comprehension passage tracking
  let inComprehensionPassage = false;
  let comprehensionPassage_en = '';
  let comprehensionPassage_hi = '';
  let seenSubQuestionsMarker = false;
  let comprehensionQuestionNumbers = []; // Track question numbers that belong to this comprehension
  let passageStartDetected = false; // Track if we've detected passage text before metadata
  let linesBeforeMetadata = []; // Collect lines before we see question metadata
  let seenFirstQuestionMetadata = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines but use them to reset state
    // However, don't reset inOptions on empty lines if we're still collecting options
    // (Hindi options might have empty lines between them)
    if (!line || line.length === 0) {
      // Don't reset inOptions on empty lines - Hindi options often have empty lines
      // We'll reset when we see a new question or clear non-option content
      // Add line break to passage if we're collecting passage
      if (inComprehensionPassage && !seenSubQuestionsMarker) {
        if (currentLanguage === 'en' && comprehensionPassage_en) {
          comprehensionPassage_en += '\n';
        } else if (currentLanguage === 'hi' && comprehensionPassage_hi) {
          comprehensionPassage_hi += '\n';
        }
      }
      // Also track empty lines before metadata for potential passage
      if (!seenFirstQuestionMetadata && !seenSubQuestionsMarker) {
        linesBeforeMetadata.push('');
      }
      continue;
    }
    
    // Reset inOptions if we see a new question (not just empty lines)
    if (inOptions && line.includes('Question Number :') && line.includes('Question Id :')) {
      inOptions = false;
      hasSeenOptions = false;
    }
    
    // Detect comprehension question type
    if (line.includes('Question Type : COMPREHENSION')) {
      // If we see a new COMPREHENSION marker and we've already processed sub-questions,
      // check if this is the same comprehension (Hindi version) or a new one
      // If we have questions already and this is likely the Hindi version, don't reset
      if (seenSubQuestionsMarker && comprehensionQuestionNumbers.length > 0 && questions.length > 0) {
        // This might be the Hindi version of the same comprehension
        // Don't reset, just start collecting Hindi passage
        inComprehensionPassage = true;
        seenSubQuestionsMarker = false; // Reset to collect Hindi passage
        currentLanguage = 'hi';
      } else if (seenSubQuestionsMarker && (comprehensionPassage_en || comprehensionPassage_hi)) {
        // This is a completely new comprehension - reset
        comprehensionPassage_en = '';
        comprehensionPassage_hi = '';
        comprehensionQuestionNumbers = [];
        inComprehensionPassage = true;
        seenSubQuestionsMarker = false;
        currentLanguage = 'en';
      } else {
        inComprehensionPassage = true;
        seenSubQuestionsMarker = false;
        currentLanguage = 'en';
      }
      // Process any lines we collected before this marker as passage
      if (linesBeforeMetadata.length > 0) {
        let lang = 'en';
        for (const prevLine of linesBeforeMetadata) {
          if (prevLine.match(/[\u0900-\u097F]/)) {
            lang = 'hi';
          } else if (prevLine.match(/^[A-Za-z]/) && prevLine.length > 3) {
            lang = 'en';
          }
          if (prevLine && prevLine.length > 10) { // Only add substantial lines
            if (lang === 'en') {
              comprehensionPassage_en += (comprehensionPassage_en ? ' ' : '') + prevLine;
            } else {
              comprehensionPassage_hi += (comprehensionPassage_hi ? ' ' : '') + prevLine;
            }
          }
        }
      }
      linesBeforeMetadata = [];
      continue;
    }
    
    // Detect "Sub questions" marker - end of passage, start of sub-questions
    if (line.toLowerCase().includes('sub questions') || line.toLowerCase().includes('sub question')) {
      // If we have collected lines before metadata, treat them as passage
      if (linesBeforeMetadata.length > 0 && !seenFirstQuestionMetadata) {
        inComprehensionPassage = true;
        let lang = 'en';
        for (const prevLine of linesBeforeMetadata) {
          if (prevLine && prevLine.length > 0) {
            if (prevLine.match(/[\u0900-\u097F]/)) {
              lang = 'hi';
            } else if (prevLine.match(/^[A-Za-z]/) && prevLine.length > 3) {
              lang = 'en';
            }
            if (prevLine.length > 10) { // Only add substantial lines
              if (lang === 'en') {
                comprehensionPassage_en += (comprehensionPassage_en ? ' ' : '') + prevLine;
              } else {
                comprehensionPassage_hi += (comprehensionPassage_hi ? ' ' : '') + prevLine;
              }
            }
          }
        }
        linesBeforeMetadata = [];
      }
      if (inComprehensionPassage || comprehensionPassage_en || comprehensionPassage_hi) {
        seenSubQuestionsMarker = true;
        inComprehensionPassage = false;
        currentLanguage = 'en';
      }
      continue;
    }
    
    // If we're collecting comprehension passage (before "Sub questions")
    if (inComprehensionPassage && !seenSubQuestionsMarker) {
      // Detect language switch (Hindi text contains Devanagari characters)
      if (line.match(/[\u0900-\u097F]/)) {
        currentLanguage = 'hi';
      } else if (line.match(/^[A-Za-z]/) && line.length > 3) {
        currentLanguage = 'en';
      }
      
      // Skip metadata lines
      if (line.includes('Question Number') || 
          line.includes('Question Id') || 
          line.includes('Question Type') ||
          line.includes('Option Shuffling') ||
          line.includes('Display Question Number') ||
          line.includes('Correct Marks') ||
          line.includes('Wrong Marks') ||
          line.includes('Options :')) {
        continue;
      }
      
      // Collect passage text
      if (currentLanguage === 'en') {
        if (comprehensionPassage_en) {
          comprehensionPassage_en += ' ' + line;
        } else {
          comprehensionPassage_en = line;
        }
      } else {
        if (comprehensionPassage_hi) {
          comprehensionPassage_hi += ' ' + line;
        } else {
          comprehensionPassage_hi = line;
        }
      }
      continue;
    }
    
    // Before we see any question metadata, collect lines that might be a passage
    if (!seenFirstQuestionMetadata && 
        !seenSubQuestionsMarker && 
        !line.includes('Question Number') &&
        !line.includes('Question Id') &&
        !line.includes('Question Type') &&
        line.length > 10) { // Substantial text line
      linesBeforeMetadata.push(line);
      continue;
    }
    
    // Detect question number and metadata (for sub-questions or regular questions)
    if (line.includes('Question Number :') && line.includes('Question Id :')) {
      // Mark that we've seen first question metadata
      if (!seenFirstQuestionMetadata) {
        seenFirstQuestionMetadata = true;
        // If we have collected lines before this and haven't seen "Sub questions", 
        // check if they look like a passage (long text blocks)
        if (linesBeforeMetadata.length > 5) {
          const totalLength = linesBeforeMetadata.join(' ').length;
          // If we have substantial text (more than 200 chars) before metadata, treat as passage
          if (totalLength > 200) {
            inComprehensionPassage = true;
            let lang = 'en';
            for (const prevLine of linesBeforeMetadata) {
              if (prevLine && prevLine.length > 0) {
                if (prevLine.match(/[\u0900-\u097F]/)) {
                  lang = 'hi';
                } else if (prevLine.match(/^[A-Za-z]/) && prevLine.length > 3) {
                  lang = 'en';
                }
                if (prevLine.length > 10) {
                  if (lang === 'en') {
                    comprehensionPassage_en += (comprehensionPassage_en ? ' ' : '') + prevLine;
                  } else {
                    comprehensionPassage_hi += (comprehensionPassage_hi ? ' ' : '') + prevLine;
                  }
                }
              }
            }
          }
        }
        linesBeforeMetadata = [];
      }
      
      // Extract question number
      const qNumMatch = line.match(/Question Number : (\d+)/);
      const qIdMatch = line.match(/Question Id : (\d+)/);
      const qTypeMatch = line.match(/Question Type : (\w+)/);
      
      const newQuestionNumber = qNumMatch ? parseInt(qNumMatch[1]) : questionNumber + 1;
      
      // If this is a comprehension sub-question, track it
      if ((seenSubQuestionsMarker || comprehensionPassage_en || comprehensionPassage_hi) && 
          (comprehensionPassage_en || comprehensionPassage_hi)) {
        if (!comprehensionQuestionNumbers.includes(newQuestionNumber)) {
          comprehensionQuestionNumbers.push(newQuestionNumber);
        }
      }
      
      // Check if this is the same question number appearing again (Hindi section)
      // Also check if we've already created this question in the questions array
      const existingQuestionInArray = questions.find(q => q.questionNumber === newQuestionNumber);
      if (newQuestionNumber === questionNumber && 
          currentQuestion && 
          currentQuestion.question_en && 
          currentQuestion.options_en.length > 0 &&
          !currentQuestion.question_hi) {
        // This is the Hindi version - same question number repeated
        currentLanguage = 'hi';
        inOptions = false;
        hasSeenOptions = false;
        expectingQuestionText = true;
        if (qIdMatch && currentQuestion) {
          currentQuestion.questionId = qIdMatch[1];
        }
        // Update passage if we have Hindi passage
        if (comprehensionPassage_hi) {
          currentQuestion.passage_hi = comprehensionPassage_hi.trim();
        }
        continue;
      }
      
      // If this is a new question number, save previous and start new
      if (newQuestionNumber !== questionNumber) {
        // Save previous question if it exists and has English content
        // But only if it's not already in the array (for Hindi updates, it's already there)
        if (currentQuestion && currentQuestion.question_en) {
          const alreadyInArray = questions.includes(currentQuestion);
          if (!alreadyInArray) {
            questions.push(currentQuestion);
          }
        }
        
        // Check if this question number already exists in array (for Hindi updates)
        if (existingQuestionInArray && !existingQuestionInArray.question_hi) {
          // We're processing Hindi version of an existing question
          // Update it in place (don't remove from array)
          currentQuestion = existingQuestionInArray;
          questionNumber = newQuestionNumber;
          currentLanguage = 'hi';
          inOptions = false;
          hasSeenOptions = false;
          expectingQuestionText = true;
          // Update passage if we have Hindi passage
          if (comprehensionPassage_hi) {
            currentQuestion.passage_hi = comprehensionPassage_hi.trim();
          }
          // Don't push to array - it's already there, we're just updating it
        } else {
          // This is a new question (English or first time seeing it)
          questionNumber = newQuestionNumber;
          currentQuestion = {
            questionNumber: newQuestionNumber,
            questionId: qIdMatch ? qIdMatch[1] : `${Date.now()}-${Math.random()}`,
            questionType: qTypeMatch ? qTypeMatch[1] : 'MCQ',
            correctMarks: 1,
            wrongMarks: 0,
            question_en: '',
            question_hi: '',
            options_en: [],
            options_hi: [],
            correctAnswer: 0, // Default to 0, will be updated if answer is detected
            // Add comprehension passage if this is a sub-question
            passage_en: ((seenSubQuestionsMarker || comprehensionPassage_en) && comprehensionPassage_en) ? comprehensionPassage_en.trim() : '',
            passage_hi: ((seenSubQuestionsMarker || comprehensionPassage_hi) && comprehensionPassage_hi) ? comprehensionPassage_hi.trim() : ''
          };
          currentLanguage = 'en';
          inOptions = false;
          hasSeenOptions = false;
          expectingQuestionText = true;
        }
      } else if (newQuestionNumber === questionNumber && currentQuestion && !currentQuestion.question_en) {
        // Same question number but we haven't set question text yet - update metadata
        if (qIdMatch) currentQuestion.questionId = qIdMatch[1];
        if (qTypeMatch) currentQuestion.questionType = qTypeMatch[1];
        expectingQuestionText = true;
      }
      continue;
    }
    
    // Detect "Correct Marks" and "Wrong Marks" on separate lines
    if (line.includes('Correct Marks :')) {
      const correctMarksMatch = line.match(/Correct Marks : (\d+)/);
      if (currentQuestion && correctMarksMatch) {
        currentQuestion.correctMarks = parseInt(correctMarksMatch[1]);
      }
      continue;
    }
    
    if (line.includes('Wrong Marks :')) {
      const wrongMarksMatch = line.match(/Wrong Marks : (\d+)/);
      if (currentQuestion && wrongMarksMatch) {
        currentQuestion.wrongMarks = parseInt(wrongMarksMatch[1]);
      }
      continue;
    }
    
    // Detect correct answer in various formats
    // Formats: "Answer: 3", "Ans: 3", "Correct Answer: 3", "Answer Key: 3", etc.
    if (currentQuestion && (line.match(/^(Answer|Ans|Correct Answer|Answer Key|Correct Option)[\s:]+(\d+)/i))) {
      const answerMatch = line.match(/(?:Answer|Ans|Correct Answer|Answer Key|Correct Option)[\s:]+(\d+)/i);
      if (answerMatch) {
        const answerNum = parseInt(answerMatch[1]);
        // Answer is 1-indexed in text, convert to 0-indexed for storage
        if (answerNum >= 1 && answerNum <= 4) {
          currentQuestion.correctAnswer = answerNum - 1;
        }
      }
      continue;
    }
    
    // Also check for answer in format like "Answer is 3" or "The answer is 3"
    if (currentQuestion && line.match(/answer\s+is\s+(\d+)/i)) {
      const answerMatch = line.match(/answer\s+is\s+(\d+)/i);
      if (answerMatch) {
        const answerNum = parseInt(answerMatch[1]);
        if (answerNum >= 1 && answerNum <= 4) {
          currentQuestion.correctAnswer = answerNum - 1;
        }
      }
      continue;
    }
    
    // Detect "Options :" marker
    if (line.includes('Options :')) {
      inOptions = true;
      hasSeenOptions = false;
      continue;
    }
    
    // Parse options (numbered 1-4)
    // Handle both formats: "1. text" and "1." (with text on next line)
    // Also detect checkmarks (☑, ✓, ✅) or markers indicating correct answer
    if (inOptions && line.match(/^\d+\./)) {
      const optionMatch = line.match(/^\d+\.\s*(.+)/);
      const optionNumMatch = line.match(/^(\d+)\./);
      const optionNumber = optionNumMatch ? parseInt(optionNumMatch[1]) : 0;
      
      // Check for checkmarks or correct answer markers
      const hasCheckmark = /[☑✓✅√]/u.test(line);
      const isMarkedCorrect = hasCheckmark || line.toLowerCase().includes('(correct)') || line.toLowerCase().includes('[correct]');
      
      if (currentQuestion) {
        const currentOptions = currentLanguage === 'en' ? currentQuestion.options_en : currentQuestion.options_hi;
        
        // If this option is marked as correct, set the answer
        // Use English options index (0-based) for correctAnswer
        if (isMarkedCorrect && currentLanguage === 'en') {
          currentQuestion.correctAnswer = optionNumber - 1;
        } else if (isMarkedCorrect && currentLanguage === 'hi' && currentQuestion.correctAnswer === 0 && currentQuestion.options_en.length === 0) {
          // If we're processing Hindi and haven't set answer yet, set it
          currentQuestion.correctAnswer = optionNumber - 1;
        }
        
        if (optionMatch && optionMatch[1].trim().length > 0) {
          // Format: "1. text" or "1. ☑ text" - text is on same line
          // Remove checkmarks from option text
          let optionText = optionMatch[1].trim().replace(/[☑✓✅√]/gu, '').trim();
          optionText = optionText.replace(/\(correct\)/gi, '').replace(/\[correct\]/gi, '').trim();
          
          // Ensure we have enough slots for this option number
          while (currentOptions.length < optionNumber) {
            currentOptions.push('');
          }
          // Set the option at the correct index (optionNumber - 1)
          if (optionNumber > 0 && optionNumber <= 4) {
            currentOptions[optionNumber - 1] = optionText;
          }
          hasSeenOptions = true;
        } else {
          // Format: "1." or "2." - text will be on next line(s)
          // Create placeholder for this option number
          while (currentOptions.length < optionNumber) {
            currentOptions.push('');
          }
          // Set empty placeholder at correct index
          if (optionNumber > 0 && optionNumber <= 4) {
            if (currentOptions[optionNumber - 1] === undefined) {
              currentOptions[optionNumber - 1] = '';
            }
          }
          hasSeenOptions = true;
        }
      }
      continue;
    }
    
    // If we're in options mode and this line doesn't start with a number,
    // it might be option text that follows a numbered line like "2."
    // OR it might be an answer indicator
    if (inOptions && hasSeenOptions && !line.match(/^\d+\./) && 
        !line.includes('Question Number') && 
        !line.includes('Question Id') &&
        !line.includes('Question Type') &&
        !line.includes('Correct Marks') &&
        !line.includes('Wrong Marks') &&
        !line.includes('Option Shuffling') &&
        !line.includes('Display Question Number') &&
        line.length > 0 &&
        line.trim().length > 0) {
      
      // First check if this line indicates the answer
      // Patterns like: "Answer: 3", "Correct: 3", "Right answer: 3", etc.
      const answerPatterns = [
        /^(?:answer|correct|right|ans)[\s:]+(\d+)/i,
        /^(\d+)\s*(?:is\s+)?(?:the\s+)?(?:correct|right|answer)/i,
        /^option\s+(\d+)\s*(?:is\s+)?(?:correct|right)/i
      ];
      
      let isAnswerLine = false;
      for (const pattern of answerPatterns) {
        const match = line.match(pattern);
        if (match) {
          const answerNum = parseInt(match[1]);
          if (answerNum >= 1 && answerNum <= 4 && currentQuestion) {
            currentQuestion.correctAnswer = answerNum - 1;
            isAnswerLine = true;
            break;
          }
        }
      }
      
      // Also check if the line contains just a number (might be the answer)
      // But only if we have all 4 options already
      if (!isAnswerLine && currentQuestion) {
        const currentOptions = currentLanguage === 'en' ? currentQuestion.options_en : currentQuestion.options_hi;
        if (currentOptions.length >= 4) {
          const justNumber = line.match(/^(\d+)$/);
          if (justNumber) {
            const answerNum = parseInt(justNumber[1]);
            if (answerNum >= 1 && answerNum <= 4) {
              currentQuestion.correctAnswer = answerNum - 1;
              isAnswerLine = true;
            }
          }
        }
      }
      
      if (isAnswerLine) {
        // This was an answer line, not option text
        inOptions = false; // End options parsing
        continue;
      }
      
      // This is likely option text that came after a numbered line like "2."
      // Find the first empty option slot and fill it
      if (currentQuestion) {
        const currentOptions = currentLanguage === 'en' ? currentQuestion.options_en : currentQuestion.options_hi;
        // Find first empty option or add to end if all are filled but less than 4
        let foundEmpty = false;
        for (let i = 0; i < currentOptions.length && i < 4; i++) {
          if (currentOptions[i] === '' || currentOptions[i] === undefined) {
            currentOptions[i] = line.trim();
            foundEmpty = true;
            break;
          }
        }
        // If no empty slot found but we have less than 4 options, add new one
        if (!foundEmpty && currentOptions.length < 4) {
          currentOptions.push(line.trim());
        }
      }
      continue;
    }
    
    // After options section ends, look for answer indicators
    // Sometimes answer appears as a standalone number or text after all options
    if (!inOptions && currentQuestion && 
        currentQuestion.options_en.length >= 4 && 
        !line.includes('Question Number') && 
        !line.includes('Question Id') &&
        !line.includes('Question Type') &&
        !line.includes('Options :') &&
        line.trim().length > 0 &&
        line.trim().length < 50) { // Short lines are more likely to be answers
      
      // Check for answer patterns
      const answerPatterns = [
        /^(?:answer|correct|right|ans)[\s:]+(\d+)/i,
        /^(\d+)\s*(?:is\s+)?(?:the\s+)?(?:correct|right|answer)/i,
        /^option\s+(\d+)\s*(?:is\s+)?(?:correct|right)/i,
        /^(\d+)$/ // Just a number might be the answer
      ];
      
      for (const pattern of answerPatterns) {
        const match = line.match(pattern);
        if (match) {
          const answerNum = parseInt(match[1] || match[0]);
          if (answerNum >= 1 && answerNum <= 4 && currentQuestion.correctAnswer === 0) {
            // Only set if not already set (default is 0, so check if it's still default)
            // Actually, let's always update if we find an explicit answer
            currentQuestion.correctAnswer = answerNum - 1;
            break;
          }
        }
      }
    }
    
    // Detect language switch (Hindi text contains Devanagari characters)
    // But don't reset inOptions if we're in the middle of parsing options
    if (line.match(/[\u0900-\u097F]/)) {
      // Only switch if we haven't already processed Hindi for this question
      if (currentLanguage !== 'hi' || !currentQuestion?.question_hi) {
        currentLanguage = 'hi';
        // Don't reset inOptions here - we might be switching language mid-options
        // Only reset if we're not currently parsing options
        if (!inOptions) {
          hasSeenOptions = false;
          expectingQuestionText = true;
        }
      }
    } else if (line.match(/^[A-Za-z]/) && line.length > 5 && 
               !line.includes('Question') && 
               !line.includes('Options') &&
               !line.includes('Correct') &&
               !line.includes('Wrong') &&
               !line.includes('Option Shuffling') &&
               !line.includes('Display Question Number')) {
      // English text - only set if we're in English mode and haven't set question yet
      if (currentLanguage === 'en' && currentQuestion && !currentQuestion.question_en) {
        expectingQuestionText = true;
      }
    }
    
    // Parse question text (not options, not metadata)
    if (currentQuestion && !inOptions && 
        !line.includes('Question Number') && 
        !line.includes('Question Id') &&
        !line.includes('Question Type') &&
        !line.includes('Correct Marks') &&
        !line.includes('Wrong Marks') &&
        !line.includes('Option Shuffling') &&
        !line.includes('Display Question Number') &&
        !line.match(/^\d+\.\s+/) &&
        line.length > 3) {
      
      // Check if this looks like question text (not metadata)
      const isMetadata = line.includes('Yes') || line.includes('No') || 
                        line.match(/^(Option Shuffling|Display Question Number)/);
      
      if (!isMetadata) {
        if (currentLanguage === 'en') {
          if (!currentQuestion.question_en) {
            currentQuestion.question_en = line;
          } else if (line.length > 5) {
            currentQuestion.question_en += ' ' + line;
          }
          expectingQuestionText = false;
        } else {
          if (!currentQuestion.question_hi) {
            currentQuestion.question_hi = line;
          } else if (line.length > 5) {
            currentQuestion.question_hi += ' ' + line;
          }
          expectingQuestionText = false;
        }
      }
    }
  }
  
  // Save last question (only if not already in array)
  if (currentQuestion && currentQuestion.question_en) {
    // Check if a question with this number already exists
    const existingIndex = questions.findIndex(q => q.questionNumber === currentQuestion.questionNumber);
    if (existingIndex !== -1) {
      // Update existing question
      questions[existingIndex] = currentQuestion;
    } else {
      // Add new question
      questions.push(currentQuestion);
    }
  }
  
  // Debug: log what we parsed
  console.log(`📝 Parsed ${questions.length} questions:`, questions.map(q => ({
    num: q.questionNumber,
    hasEn: !!q.question_en,
    hasHi: !!q.question_hi,
    enOpts: q.options_en?.length || 0,
    hiOpts: q.options_hi?.length || 0,
    hasPassage: !!(q.passage_en || q.passage_hi)
  })));
  
  return questions;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { examId, partId, paperName, questionsText } = body;

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    if (!partId) {
      return NextResponse.json({ error: "Part ID is required" }, { status: 400 });
    }

    if (!questionsText || !questionsText.trim()) {
      return NextResponse.json({ error: "Questions text is required" }, { status: 400 });
    }

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.key !== "CPCT") {
      return NextResponse.json({ error: "This endpoint is only for CPCT exams" }, { status: 400 });
    }

    // Verify part exists
    const part = await Part.findById(partId);
    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    if (part.examId.toString() !== examId) {
      return NextResponse.json({ error: "Part does not belong to the selected exam" }, { status: 400 });
    }

    // Get section for this part
    const section = await Section.findById(part.sectionId);
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Parse questions from text
    const parsedQuestions = parseQuestionsText(questionsText);

    if (!parsedQuestions || parsedQuestions.length === 0) {
      return NextResponse.json({ error: "No questions found in the text" }, { status: 400 });
    }

    let imported = 0;
    let errors = 0;
    const errorDetails = [];

    // Import questions
    for (const qData of parsedQuestions) {
      try {
        // Check if question already exists by question number
        const existingQuestion = await Question.findOne({
          examId: String(examId),
          sectionId: String(section._id),
          partId: String(partId),
          questionNumber: qData.questionNumber
        });

        const questionDoc = {
          examId: String(examId),
          sectionId: String(section._id),
          partId: String(partId),
          id: `cpct-text-q-${qData.questionId || qData.questionNumber}`,
          questionType: qData.questionType === 'MCQ' ? 'MCQ' : 'MCQ',
          marks: qData.correctMarks || 1,
          negativeMarks: qData.wrongMarks || 0,
          isFree: true,
          questionNumber: qData.questionNumber,
          question_en: qData.question_en || '',
          question_hi: qData.question_hi || '',
          options_en: qData.options_en || [],
          options_hi: qData.options_hi || [],
          correctAnswer: qData.correctAnswer !== undefined && qData.correctAnswer >= 0 ? qData.correctAnswer : 0,
          // Add passage fields for comprehension questions
          passage_en: qData.passage_en || '',
          passage_hi: qData.passage_hi || ''
        };

        // Store paper name if provided
        if (paperName && paperName.trim()) {
          questionDoc.paperName = paperName.trim();
        }

        if (existingQuestion) {
          // Update existing question
          Object.assign(existingQuestion, questionDoc);
          await existingQuestion.save();
        } else {
          // Create new question
          await Question.create(questionDoc);
        }

        imported++;
      } catch (error) {
        console.error(`Error importing question ${qData.questionNumber}:`, error);
        errorDetails.push({ questionNumber: qData.questionNumber, error: error.message });
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} questions to part "${part.name}"`,
      imported,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails.slice(0, 10) : undefined
    });

  } catch (error) {
    console.error("Error importing CPCT text questions:", error);
    return NextResponse.json({ 
      error: "Failed to import questions", 
      details: error.message 
    }, { status: 500 });
  }
}

