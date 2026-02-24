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

// Parse the exam data from the provided text (reusing logic from import-cpct-real-paper)
function parseExamData(text) {
  const sections = [];
  let currentSection = null;
  let currentQuestion = null;
  let currentSubQuestions = [];
  let inOptions = false;
  let currentOptions = [];
  let isEnglish = true;
  let questionNumber = 0;
  let inComprehensionPassage = false;
  let comprehensionPassage_en = '';
  let comprehensionPassage_hi = '';

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section - section name appears BEFORE "Section Id :" line
    if (line.includes('Section Id :')) {
      // Look backwards (up to 5 lines) for section name
      let sectionName = '';
      let sectionNumber = 1;
      let sectionType = 'Online';
      
      // Extract section number from current or next line
      const sectionNumberMatch = line.match(/Section Number : (\d+)/) || 
                                 (i < lines.length - 1 && lines[i+1]?.match(/Section Number : (\d+)/));
      if (sectionNumberMatch) {
        sectionNumber = parseInt(sectionNumberMatch[1]);
      }
      
      // Extract section type
      const sectionTypeMatch = lines.slice(i, i+5).find(l => l.includes('Section type :'))?.match(/Section type : (\w+)/);
      if (sectionTypeMatch) {
        sectionType = sectionTypeMatch[1];
      }
      
      // Look backwards for section name (usually 1-3 lines before Section Id)
      for (let j = Math.max(0, i - 5); j < i; j++) {
        const prevLine = lines[j];
        if (prevLine && prevLine.length > 10 && 
            !prevLine.includes('Section') && 
            !prevLine.includes('Group') &&
            !prevLine.includes('Question') &&
            !prevLine.includes('Number') &&
            !prevLine.includes('Id') &&
            (prevLine === prevLine.toUpperCase() || 
             prevLine.includes('COMPUTER PROFICIENCY') ||
             prevLine.includes('READING COMPREHENSION') ||
             prevLine.includes('QUANTITATIVE APTITUDE') ||
             prevLine.includes('GENERAL MENTAL ABILITY') ||
             prevLine.includes('GENERAL AWARENESS') ||
             prevLine.includes('English Typing') ||
             prevLine.includes('Hindi Typing') ||
             prevLine.includes('English Mock') ||
             prevLine.includes('Hindi Mock'))) {
          sectionName = prevLine.trim();
          break;
        }
      }
      
      // If no name found, use default
      if (!sectionName) {
        sectionName = `Section ${sectionNumber}`;
      }
      
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

      currentSection = {
        sectionNumber: sectionNumber,
        name: sectionName,
        sectionType: sectionType,
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
        isFree: true
      };

      if (questionType === 'TYPING TEST') {
        currentQuestion.typingLanguage = 'English';
        currentQuestion.typingScriptType = 'Ramington Gail';
        currentQuestion.typingContent_english = '';
        currentQuestion.typingContent_hindi_ramington = '';
        currentQuestion.typingContent_hindi_inscript = '';
        currentQuestion.typingDuration = 15;
        currentQuestion.typingBackspaceEnabled = true;
      }

      currentSubQuestions = [];
      currentOptions = [];
      inOptions = false;
      inComprehensionPassage = false;
      comprehensionPassage_en = '';
      comprehensionPassage_hi = '';
      continue;
    }

    // Detect correct answer from option markers (☑ or ☐) - if present
    if (line.match(/^\d+\.\s*[☑☐]/) && currentQuestion) {
      const optionMatch = line.match(/^\d+\.\s*([☑☐])\s*(.+)/);
      if (optionMatch) {
        const isCorrect = optionMatch[1] === '☑';
        const optionText = optionMatch[2].trim();
        
        // Determine option index (0-based)
        const optionIndex = isEnglish ? currentQuestion.options_en.length : currentQuestion.options_hi.length;
        
        if (isCorrect) {
          // Set correct answer - use the same index for both languages
          currentQuestion.correctAnswer = optionIndex;
        }

        if (isEnglish) {
          currentQuestion.options_en.push(optionText);
        } else {
          currentQuestion.options_hi.push(optionText);
        }
      }
      continue;
    }

    // Detect options (numbered list without checkmarks)
    if (line.includes('Options :')) {
      inOptions = true;
      continue;
    }
    
    // Parse numbered options (1. option text or 1.  option text)
    if (inOptions && currentQuestion && line.match(/^\d+\.\s+/)) {
      const optionMatch = line.match(/^\d+\.\s+(.+)/);
      if (optionMatch) {
        const optionText = optionMatch[1].trim();
        if (optionText.length > 0) {
          if (isEnglish) {
            currentQuestion.options_en.push(optionText);
          } else {
            currentQuestion.options_hi.push(optionText);
          }
        }
      }
      continue;
    }
    
    // Stop options parsing when we hit a blank line or new question/section
    if (inOptions && (line.length === 0 || line.includes('Question Number') || line.includes('Section'))) {
      inOptions = false;
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
        !line.includes('Question Shuffling') &&
        !line.includes('Read the given passage') &&
        !line.includes('Sub questions')) {
      
      // For typing questions, collect content
      if (currentQuestion.questionType === 'TYPING') {
        // Skip metadata lines
        if (line.includes('Restricted') || line.includes('Paragraph Display') || 
            line.includes('Show Details Panel') || line.includes('Show Error Count') ||
            line.includes('Highlight') || line.includes('Allow Back Space') ||
            line.includes('Show Back Space Count') || line.includes('Keyboard Layout') ||
            line.includes('Sub-Section Number') || line.includes('Sub-Section Id') ||
            line.includes('Question Shuffling') || line.includes('Is Section Default') ||
            line.includes('Question Number') || line.includes('Question Id') ||
            line.includes('Question Type') || line.includes('Display Question Number') ||
            line.includes('Calculator') || line.length < 3) {
          // Extract keyboard layout if present
          if (line.includes('Remington') || line.includes('Remington Gail')) {
            currentQuestion.typingScriptType = 'Ramington Gail';
          }
          continue;
        }
        
        // Collect typing content - look for actual content (not metadata)
        const hasHindi = line.match(/[\u0900-\u097F]/);
        const isContent = line.length > 5 && 
                         !line.match(/^[A-Z\s:]+$/) && 
                         !line.match(/^\d+\./) &&
                         !line.includes('Restricted') && 
                         !line.includes('Paragraph') &&
                         !line.includes('Show') && 
                         !line.includes('Highlight') &&
                         !line.includes('Allow') && 
                         !line.includes('Keyboard') &&
                         !line.includes('Group') &&
                         !line.includes('Section');
        
        if (hasHindi && isContent) {
          // This is Hindi typing content
          if (!currentQuestion.typingContent_hindi_ramington) {
            currentQuestion.typingContent_hindi_ramington = line;
          } else {
            currentQuestion.typingContent_hindi_ramington += ' ' + line;
          }
          // Also set inscript to same content
          currentQuestion.typingContent_hindi_inscript = currentQuestion.typingContent_hindi_ramington;
        } else if (!hasHindi && isContent && line.match(/^[a-zA-Z]/)) {
          // This is English typing content
          if (!currentQuestion.typingContent_english) {
            currentQuestion.typingContent_english = line;
          } else {
            currentQuestion.typingContent_english += ' ' + line;
          }
        }
      } else {
        // For MCQ/Comprehension questions
        if (isEnglish) {
          if (!currentQuestion.question_en) {
            currentQuestion.question_en = line;
          } else if (line.length > 5) {
            currentQuestion.question_en += ' ' + line;
          }
        } else {
          if (!currentQuestion.question_hi) {
            currentQuestion.question_hi = line;
          } else if (line.length > 5) {
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

    // Toggle language detection (simple heuristic)
    if (line.match(/[\u0900-\u097F]/)) {
      isEnglish = false;
    } else if (line.match(/^[A-Za-z]/) && line.length > 10) {
      isEnglish = true;
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
  // Look ahead for section name
  for (let i = currentIndex + 1; i < Math.min(currentIndex + 10, allLines.length); i++) {
    const nextLine = allLines[i];
    if (nextLine && nextLine.length > 10 && 
        !nextLine.includes('Section') && 
        !nextLine.includes('Number') &&
        !nextLine.includes('Question') &&
        !nextLine.includes('Mandatory') &&
        !nextLine.includes('Optional') &&
        !nextLine.includes('Marks')) {
      return nextLine;
    }
  }
  return 'Section ' + (currentIndex + 1);
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const formData = await req.formData();
    const file = formData.get('pdf');
    const examId = formData.get('examId');
    const paperName = formData.get('paperName');

    if (!file) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.key !== "CPCT") {
      return NextResponse.json({ error: "This endpoint is only for CPCT exams" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    let pdfText;
    try {
      // pdf-parse v2.4.5 is an ESM module, so we need to use dynamic import
      // The module exports a default function for parsing PDFs
      const pdfParseModule = await import("pdf-parse");
      
      // Get the default export (the parsing function)
      // pdf-parse exports the function as default in ESM
      const pdfParse = pdfParseModule.default;
      
      if (typeof pdfParse !== 'function') {
        // Fallback: check if it's exported differently
        // Some versions might export it as a named export or the module itself
        const fallback = pdfParseModule.pdfParse || pdfParseModule;
        if (typeof fallback === 'function') {
          const pdfData = await fallback(buffer);
          pdfText = pdfData.text;
        } else {
          throw new Error(`pdf-parse default export is not a function. Type: ${typeof pdfParse}, Module keys: ${Object.keys(pdfParseModule).slice(0, 5).join(', ')}`);
        }
      } else {
        const pdfData = await pdfParse(buffer);
        pdfText = pdfData.text;
      }
    } catch (error) {
      console.error("PDF parsing error:", error);
      return NextResponse.json({ error: "Failed to parse PDF: " + error.message }, { status: 400 });
    }

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json({ error: "PDF appears to be empty or could not extract text" }, { status: 400 });
    }

    // Parse exam data from text
    const sections = parseExamData(pdfText);

    if (!sections || sections.length === 0) {
      return NextResponse.json({ error: "No sections or questions found in PDF" }, { status: 400 });
    }

    let totalImported = 0;
    let totalErrors = 0;
    const errors = [];

    // Import sections and questions
    for (const sectionData of sections) {
      try {
        // Map section names to CPCT structure
        let sectionName = sectionData.name;
        let targetSection = null;

        // Find or create section based on section number/name
        // All MCQ sections (1-5) go to Section A
        if (sectionName.includes('COMPUTER PROFICIENCY') || 
            sectionName.includes('READING COMPREHENSION') ||
            sectionName.includes('QUANTITATIVE APTITUDE') ||
            sectionName.includes('GENERAL MENTAL ABILITY') ||
            sectionName.includes('GENERAL AWARENESS') ||
            (sectionData.sectionNumber >= 1 && sectionData.sectionNumber <= 5 && !sectionName.toLowerCase().includes('typing'))) {
          // These are all parts of Section A
          targetSection = await Section.findOne({ examId: exam._id, name: "Section A" });
        } else if (sectionName.includes('English Typing') || sectionName.includes('English Mock') || sectionName.includes('English Actual') || 
                   sectionName.toLowerCase().includes('english typing') || sectionName.toLowerCase().includes('english mock')) {
          // This is Section B (English Typing)
          targetSection = await Section.findOne({ examId: exam._id, name: "Section B" });
        } else if (sectionName.includes('Hindi Typing') || sectionName.includes('Hindi Mock') || sectionName.includes('Hindi Actual') ||
                   sectionName.toLowerCase().includes('hindi typing') || sectionName.toLowerCase().includes('hindi mock')) {
          // This is Section C (Hindi Typing)
          targetSection = await Section.findOne({ examId: exam._id, name: "Section C" });
        }

        if (!targetSection) {
          console.warn(`Section not found for: ${sectionName} (Section ${sectionData.sectionNumber}), skipping...`);
          continue;
        }
        
        // For Section A, find or create the appropriate part
        let targetPart = null;
        if (targetSection.name === "Section A") {
          // Map section names to parts
          let partName = "IT SKILLS"; // default
          if (sectionName.includes('READING COMPREHENSION')) {
            partName = "READING COMPREHENSION";
          } else if (sectionName.includes('QUANTITATIVE APTITUDE')) {
            partName = "QUANTITATIVE APTITUDE";
          } else if (sectionName.includes('GENERAL MENTAL ABILITY')) {
            partName = "GENERAL MENTAL ABILITY AND REASONING";
          } else if (sectionName.includes('GENERAL AWARENESS')) {
            partName = "GENERAL AWARENESS";
          } else if (sectionName.includes('COMPUTER PROFICIENCY')) {
            partName = "IT SKILLS";
          }
          
          targetPart = await Part.findOne({ 
            examId: exam._id, 
            sectionId: targetSection._id,
            name: partName
          });
          
          if (!targetPart) {
            // Create part if it doesn't exist
            const partOrder = partName === "IT SKILLS" ? 1 :
                            partName === "READING COMPREHENSION" ? 2 :
                            partName === "QUANTITATIVE APTITUDE" ? 3 :
                            partName === "GENERAL MENTAL ABILITY AND REASONING" ? 4 : 5;
            targetPart = await Part.create({
              examId: exam._id,
              sectionId: targetSection._id,
              name: partName,
              order: partOrder
            });
          }
        } else {
          // For typing sections, get the part
          targetPart = await Part.findOne({ examId: exam._id, sectionId: targetSection._id });
        }

        // Import questions
        for (const qData of sectionData.questions) {
          try {
            const questionId = `cpct-pdf-q-${qData.questionId || qData.questionNumber}`;
            
            // Check if question already exists - update it
            let question = await Question.findOne({ 
              examId: String(exam._id),
              sectionId: String(targetSection._id),
              questionNumber: qData.questionNumber
            });

            const questionDoc = {
              examId: String(exam._id),
              sectionId: String(targetSection._id),
              id: questionId,
              questionType: qData.questionType,
              marks: qData.correctMarks || 1,
              negativeMarks: qData.wrongMarks || 0,
              isFree: true,
              questionNumber: qData.questionNumber // Store question number
            };
            
            // Add partId if we have a part
            if (targetPart) {
              questionDoc.partId = String(targetPart._id);
            }
            
            // Store paper name if provided
            if (paperName && paperName.trim()) {
              questionDoc.paperName = paperName.trim();
            }

            if (qData.questionType === 'TYPING') {
              questionDoc.typingLanguage = targetSection.name === 'Section B' ? 'English' : 'Hindi';
              questionDoc.typingScriptType = qData.typingScriptType || 'Ramington Gail';
              questionDoc.typingContent_english = qData.typingContent_english || '';
              questionDoc.typingContent_hindi_ramington = qData.typingContent_hindi_ramington || '';
              questionDoc.typingContent_hindi_inscript = qData.typingContent_hindi_inscript || qData.typingContent_hindi_ramington || '';
              questionDoc.typingDuration = 15;
              questionDoc.typingBackspaceEnabled = qData.typingBackspaceEnabled !== false;
            } else {
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
            console.error(`Error importing question ${qData.questionNumber}:`, error);
            errors.push({ questionNumber: qData.questionNumber, error: error.message });
            totalErrors++;
          }
        }
      } catch (error) {
        console.error(`Error importing section ${sectionData.name}:`, error);
        errors.push({ section: sectionData.name, error: error.message });
        totalErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${totalImported} questions from PDF`,
      imported: totalImported,
      errors: totalErrors,
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit error details
    });

  } catch (error) {
    console.error("Error importing CPCT PDF:", error);
    return NextResponse.json({ 
      error: "Failed to import PDF", 
      details: error.message 
    }, { status: 500 });
  }
}

