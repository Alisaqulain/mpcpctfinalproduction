import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";

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

// Helper function to parse questions from text - improved version
function parseQuestions(questionsText) {
  const questions = [];
  const failedQuestions = [];
  
  let normalized = questionsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Simple and reliable: Split by lines, each line that contains "Ans:" is a complete question
  const lines = normalized.split('\n').map(l => l.trim()).filter(l => l);
  const questionBlocks = [];
  
  // Each question is on a single line ending with "Ans: X"
  for (const line of lines) {
    // Check if this line is a complete question (has question mark, options, and answer)
    if (line.includes('?') && line.match(/[A-D]\.\s+/) && line.match(/Ans:\s*[A-D]/i)) {
      questionBlocks.push(line);
    }
  }
  
  console.log(`Found ${questionBlocks.length} question lines`);
  
  // Parse each question block
  for (const questionText of questionBlocks) {
    try {
      // Extract question text (everything before first option)
      const questionMatch = questionText.match(/^(.+?)\s+([A-D]\.\s+.+?)\s+Ans:\s*([A-D])/is);
      if (!questionMatch) {
        // Try alternative pattern: question might be on same line as first option
        const altMatch = questionText.match(/^(.+?[?])\s+([A-D]\.\s+.+?)\s+Ans:\s*([A-D])/is);
        if (!altMatch) continue;
        
        const questionFull = altMatch[1].trim();
        const optionsText = altMatch[2].trim();
        const correctAnswerText = altMatch[3].trim().toUpperCase();
        
        // Parse question (English and Hindi)
        let question_en = questionFull;
        let question_hi = questionFull;
        if (questionFull.includes('(') && questionFull.includes(')')) {
          const qMatch = questionFull.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          if (qMatch) {
            question_en = qMatch[1].trim();
            question_hi = qMatch[2].trim();
          }
        }
        
        // Parse options
        const options = [];
        const optionPattern = /([A-D])\.\s+(.+?)(?=\s+[A-D]\.\s+|$)/gs;
        let optMatch;
        while ((optMatch = optionPattern.exec(optionsText)) !== null) {
          const optText = optMatch[2].trim();
          const optParsed = parseOption(optText);
          options.push({
            en: optParsed.en,
            hi: optParsed.hi
          });
        }
        
        if (options.length === 4) {
          const correctAnswer = ['A', 'B', 'C', 'D'].indexOf(correctAnswerText);
          if (correctAnswer >= 0) {
            questions.push({
              question_en,
              question_hi,
              options_en: options.map(o => o.en),
              options_hi: options.map(o => o.hi),
              correctAnswer
            });
            continue;
          }
        }
      } else {
        const questionFull = questionMatch[1].trim();
        const optionsText = questionMatch[2].trim();
        const correctAnswerText = questionMatch[3].trim().toUpperCase();
        
        // Parse question (English and Hindi)
        let question_en = questionFull;
        let question_hi = questionFull;
        if (questionFull.includes('(') && questionFull.includes(')')) {
          const qMatch = questionFull.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          if (qMatch) {
            question_en = qMatch[1].trim();
            question_hi = qMatch[2].trim();
          }
        }
        
        // Parse options
        const options = [];
        const optionPattern = /([A-D])\.\s+(.+?)(?=\s+[A-D]\.\s+|$)/gs;
        let optMatch;
        while ((optMatch = optionPattern.exec(optionsText)) !== null) {
          const optText = optMatch[2].trim();
          const optParsed = parseOption(optText);
          options.push({
            en: optParsed.en,
            hi: optParsed.hi
          });
        }
        
        if (options.length === 4) {
          const correctAnswer = ['A', 'B', 'C', 'D'].indexOf(correctAnswerText);
          if (correctAnswer >= 0) {
            questions.push({
              question_en,
              question_hi,
              options_en: options.map(o => o.en),
              options_hi: options.map(o => o.hi),
              correctAnswer
            });
            continue;
          }
        }
      }
      
      failedQuestions.push({ reason: 'Failed to parse question structure' });
    } catch (error) {
      failedQuestions.push({ reason: error.message });
    }
  }
  
  return { questions, failedDetails: failedQuestions };
}

function parseOption(optionText) {
  const hindiMatch = optionText.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (hindiMatch) {
    return {
      en: hindiMatch[1].trim(),
      hi: hindiMatch[2].trim()
    };
  }
  return {
    en: optionText.trim(),
    hi: optionText.trim()
  };
}

// Parse reading comprehension passages - using improved logic
function parseReadingComprehension(text) {
  const results = [];
  const failed = [];
  
  // Normalize line endings
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into passage blocks - each passage starts with title (optional) then "English:"
  // Pattern: Title (Hindi Title) -> English: -> Hindi: -> 5 questions
  const passageBlocks = [];
  
  // Improved splitting: Find all passage starts by looking for titles or "English:" markers
  // Split the text into sections based on passage boundaries
  const lines = normalized.split('\n');
  const passageStarts = [];
  
  // Find all passage start points
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Check if this is a title pattern: "Something (Something)"
    if (line.match(/^[^\n:]+\([^)]+\)$/)) {
      // Look ahead for "English:" within next 10 lines (to handle blank lines)
      for (let j = i + 1; j < Math.min(i + 11, lines.length); j++) {
        if (lines[j].trim().toLowerCase().startsWith('english:')) {
          passageStarts.push(i);
          break;
        }
      }
    } else if (line.toLowerCase().startsWith('english:')) {
      // This is a passage start without title
      passageStarts.push(i);
    }
  }
  
  console.log(`Found ${passageStarts.length} passage start points`);
  
  // Split text into sections based on passage starts
  const sections = [];
  for (let i = 0; i < passageStarts.length; i++) {
    const start = passageStarts[i];
    const end = i < passageStarts.length - 1 ? passageStarts[i + 1] : lines.length;
    const section = lines.slice(start, end).join('\n');
    if (section.trim()) {
      sections.push(section);
    }
  }
  
  console.log(`Split into ${sections.length} sections`);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    // Get trimmed lines for processing
    const sectionLines = section.split('\n').map(l => l.trim()).filter(l => l);
    if (sectionLines.length < 3) {
      console.log(`Skipping section with only ${sectionLines.length} lines`);
      continue;
    }
    
    let title_en = '';
    let title_hi = '';
    let englishIndex = -1;
    let hindiIndex = -1;
    let startLine = 0;
    
    // Check if first non-empty line is a title (can have various formats)
    // Title pattern: "Title (Hindi Title)" - can be on its own line
    if (sectionLines[0] && sectionLines[0].match(/^[^:]+\([^)]+\)$/)) {
      const titleMatch = sectionLines[0].match(/^(.+?)\s*\(([^)]+)\)$/);
      if (titleMatch) {
        title_en = titleMatch[1].trim();
        title_hi = titleMatch[2].trim();
        startLine = 1;
      }
    }
    
    // Find English: and Hindi: markers (case insensitive, can have spaces)
    // Look for lines that start with "English:" or "Hindi:"
    for (let i = startLine; i < sectionLines.length; i++) {
      const lineLower = sectionLines[i].toLowerCase().trim();
      if (lineLower.startsWith('english:')) {
        englishIndex = i;
      } else if (lineLower.startsWith('hindi:')) {
        hindiIndex = i;
        break;
      }
    }
    
    if (englishIndex >= 0 && hindiIndex >= 0) {
      // Extract passages - get text between English: and Hindi:, and between Hindi: and questions
      const passage_en = sectionLines.slice(englishIndex + 1, hindiIndex).join(' ').trim();
      
      // Find where Hindi passage ends (before first question with "?")
      let hindiEnd = hindiIndex + 1;
      for (let i = hindiIndex + 1; i < sectionLines.length; i++) {
        // Look for question markers: "?" followed by option pattern or capital letter
        if (sectionLines[i].includes('?') && (sectionLines[i].includes('A.') || sectionLines[i].match(/^[A-Z]/) || sectionLines[i].match(/\s[A-D]\.\s/))) {
          hindiEnd = i;
          break;
        }
      }
      const passage_hi = sectionLines.slice(hindiIndex + 1, hindiEnd).join(' ').trim();
      
      // Get questions text (everything after Hindi passage)
      const questionsText = sectionLines.slice(hindiEnd).join('\n').trim();
      
      if (passage_en && passage_hi && questionsText) {
        passageBlocks.push({
          title_en,
          title_hi,
          passage_en,
          passage_hi,
          questionsText
        });
        console.log(`✅ Added passage: "${title_en || 'No title'}" - EN: ${passage_en.length} chars, HI: ${passage_hi.length} chars, Q: ${questionsText.length} chars`);
      } else {
        console.log(`❌ Skipped passage - EN: ${passage_en ? 'OK' : 'MISSING'}, HI: ${passage_hi ? 'OK' : 'MISSING'}, Q: ${questionsText ? 'OK' : 'MISSING'}`);
        if (englishIndex < 0 || hindiIndex < 0) {
          console.log(`   English index: ${englishIndex}, Hindi index: ${hindiIndex}`);
        }
      }
    } else {
      console.log(`❌ Section missing English: or Hindi: markers`);
      console.log(`   First 3 lines: ${sectionLines.slice(0, 3).join(' | ')}`);
    }
  }
  
  console.log(`Found ${passageBlocks.length} passage blocks`);
  
  // Parse questions for each passage
  for (let p = 0; p < passageBlocks.length; p++) {
    const passage = passageBlocks[p];
    
    // Use the improved parseQuestions function to parse questions from this passage
    const regularParsed = parseQuestions(passage.questionsText);
    
    console.log(`Passage ${p + 1} (${passage.title_en || 'No title'}): Found ${regularParsed.questions.length} questions`);
    
    // Associate passage with questions (limit to 5 per passage)
    const passageQuestions = regularParsed.questions.slice(0, 5);
    
    for (const question of passageQuestions) {
      question.passage_en = passage.passage_en;
      question.passage_hi = passage.passage_hi;
      if (passage.title_en) {
        question.title_en = passage.title_en;
        question.title_hi = passage.title_hi;
      }
      
      // Validate question
      if (question.question_en && question.options_en && question.options_en.length === 4 && question.correctAnswer >= 0) {
        results.push(question);
      } else {
        failed.push({
          passage: p + 1,
          title: passage.title_en || 'No title',
          reason: `Invalid question: Q=${!!question.question_en}, Options=${question.options_en?.length || 0}, Answer=${question.correctAnswer}`
        });
      }
    }
    
    if (passageQuestions.length < 5) {
      failed.push({
        passage: p + 1,
        title: passage.title_en || 'No title',
        reason: `Only found ${passageQuestions.length} questions, expected 5`
      });
    }
    
    // Add failed questions from this passage
    if (regularParsed.failedDetails) {
      for (const failedQ of regularParsed.failedDetails) {
        failed.push({
          passage: p + 1,
          title: passage.title_en || 'No title',
          reason: failedQ.reason || 'Failed to parse'
        });
      }
    }
  }
  
  console.log(`Reading comprehension: ${results.length} questions parsed, ${failed.length} failed`);
  
  return {
    questions: results,
    failed: failed.length,
    failedDetails: failed
  };
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await dbConnect();
    
    const { passagesText } = await req.json();
    
    if (!passagesText || !passagesText.trim()) {
      return NextResponse.json(
        { error: "No passages text provided" },
        { status: 400 }
      );
    }
    
    // Parse all passages
    console.log('📝 Starting to parse passages...');
    console.log('📏 Text length:', passagesText.length);
    const parsed = parseReadingComprehension(passagesText);
    
    console.log('📊 Parse results:', {
      questionsFound: parsed.questions.length,
      failed: parsed.failed,
      failedDetails: parsed.failedDetails?.slice(0, 5) // Show first 5 failures
    });
    
    if (parsed.questions.length === 0) {
      const errorMsg = `No valid passages found. Please check the format.`;
      const details = parsed.failedDetails?.slice(0, 10).map(f => `- ${f.reason || 'Unknown error'}`).join('\n') || '';
      return NextResponse.json(
        { 
          error: errorMsg,
          details: details || 'No passages could be parsed. Make sure each passage has:\n- Title (Hindi Title)\n- English: [passage]\n- Hindi: [passage]\n- 5 questions with options and answers'
        },
        { status: 400 }
      );
    }
    
    // Group questions by passage (5 questions per passage)
    const passages = [];
    for (let i = 0; i < parsed.questions.length; i += 5) {
      const passageQuestions = parsed.questions.slice(i, i + 5);
      if (passageQuestions.length === 5) {
        passages.push(passageQuestions);
      }
    }
    
    console.log(`Parsed ${passages.length} complete passages (5 questions each)`);
    
    if (passages.length === 0) {
      return NextResponse.json(
        { error: "No complete passages found (each passage must have exactly 5 questions)" },
        { status: 400 }
      );
    }
    
    // Import to question bank
    const partName = "READING COMPREHENSION";
    let importedCount = 0;
    
    for (const passageQuestions of passages) {
      for (const q of passageQuestions) {
        const bankQuestion = new Question({
          examId: "CPCT_QUESTION_BANK",
          partName: partName,
          question_en: q.question_en,
          question_hi: q.question_hi,
          options_en: q.options_en,
          options_hi: q.options_hi,
          correctAnswer: q.correctAnswer,
          passage_en: q.passage_en,
          passage_hi: q.passage_hi,
          title_en: q.title_en || '',
          title_hi: q.title_hi || '',
          marks: 1,
          negativeMarks: 0,
          questionType: "MCQ"
        });
        
        await bankQuestion.save();
        importedCount++;
      }
    }
    
    console.log(`Imported ${importedCount} questions to question bank`);
    
    // Get all CPCT exams
    const cpctExams = await Exam.find({ key: 'CPCT' })
      .sort({ title: 1 })
      .limit(20);
    
    if (cpctExams.length === 0) {
      return NextResponse.json(
        { error: "No CPCT exams found" },
        { status: 400 }
      );
    }
    
    // Distribute one passage to each exam
    const distributionResults = [];
    const errors = [];
    
    for (let i = 0; i < Math.min(passages.length, cpctExams.length); i++) {
      const exam = cpctExams[i];
      const passageQuestions = passages[i];
      
      try {
        // Get Section A
        const sectionA = await Section.findOne({ 
          examId: exam._id,
          name: { $in: ["Section A", "CPCT MCQ", "Section 1 (CPCT MCQ)"] }
        });
        
        if (!sectionA) {
          errors.push(`${exam.title}: Section A not found`);
          continue;
        }
        
        // Get Reading Comprehension part
        const readingPart = await Part.findOne({
          sectionId: sectionA._id,
          name: { $regex: /reading|comprehension/i }
        });
        
        if (!readingPart) {
          errors.push(`${exam.title}: Reading Comprehension part not found`);
          continue;
        }
        
        // Delete existing questions for this part
        await Question.deleteMany({
          examId: String(exam._id),
          partId: String(readingPart._id),
          questionType: { $ne: "TYPING" }
        });
        
        // Insert questions
        const questionsToInsert = passageQuestions.map((q, index) => {
          return {
            id: `cpct-exam-${exam.title.replace('CPCT Exam ', '')}-reading-q-${index + 1}`,
            examId: String(exam._id),
            sectionId: String(sectionA._id),
            partId: String(readingPart._id),
            questionNumber: index + 1,
            questionType: "MCQ",
            question_en: q.question_en,
            question_hi: q.question_hi,
            options_en: q.options_en,
            options_hi: q.options_hi,
            correctAnswer: q.correctAnswer,
            passage_en: q.passage_en,
            passage_hi: q.passage_hi,
            title_en: q.title_en || '',
            title_hi: q.title_hi || '',
            marks: 1,
            negativeMarks: 0,
            isFree: exam.isFree || false
          };
        });
        
        await Question.insertMany(questionsToInsert);
        
        distributionResults.push({
          examTitle: exam.title,
          questionsAdded: questionsToInsert.length
        });
        
        console.log(`✅ Distributed ${questionsToInsert.length} questions to ${exam.title}`);
      } catch (error) {
        errors.push(`${exam.title}: ${error.message}`);
        console.error(`Error distributing to ${exam.title}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      passagesParsed: passages.length,
      questionsImported: importedCount,
      examsUpdated: distributionResults.length,
      distributionResults,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json(
      { error: error.message || "Failed to bulk import reading comprehension" },
      { status: 500 }
    );
  }
}

