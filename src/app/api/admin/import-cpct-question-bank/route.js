import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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

function parseReadingComprehension(text) {
  const results = [];
  const failed = [];
  
  // Normalize line endings
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split into passage blocks - each passage starts with title (optional) then "English:"
  // Pattern: Title (Hindi Title) -> English: -> Hindi: -> 5 questions
  const passageBlocks = [];
  
  // First, split by title pattern or "English:" marker
  const sections = normalized.split(/(?=\n[^\n:]+\([^)]+\)\s*\n\s*English:|\n\s*English:)/i);
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 3) continue;
    
    let title_en = '';
    let title_hi = '';
    let englishIndex = -1;
    let hindiIndex = -1;
    let startLine = 0;
    
    // Check if first line is a title
    if (lines[0] && lines[0].match(/^[^:]+\([^)]+\)$/)) {
      const titleMatch = lines[0].match(/^(.+?)\s*\(([^)]+)\)$/);
      if (titleMatch) {
        title_en = titleMatch[1].trim();
        title_hi = titleMatch[2].trim();
        startLine = 1;
      }
    }
    
    // Find English: and Hindi: markers
    for (let i = startLine; i < lines.length; i++) {
      if (lines[i].toLowerCase().startsWith('english:')) {
        englishIndex = i;
      } else if (lines[i].toLowerCase().startsWith('hindi:')) {
        hindiIndex = i;
        break;
      }
    }
    
    if (englishIndex >= 0 && hindiIndex >= 0) {
      // Extract passages
      const passage_en = lines.slice(englishIndex + 1, hindiIndex).join(' ').trim();
      
      // Find where Hindi passage ends (before first question with "?")
      let hindiEnd = hindiIndex + 1;
      for (let i = hindiIndex + 1; i < lines.length; i++) {
        if (lines[i].includes('?') && (lines[i].includes('A.') || lines[i].match(/^[A-Z]/))) {
          hindiEnd = i;
          break;
        }
      }
      const passage_hi = lines.slice(hindiIndex + 1, hindiEnd).join(' ').trim();
      
      // Get questions text (everything after Hindi passage)
      const questionsText = lines.slice(hindiEnd).join('\n').trim();
      
      if (passage_en && passage_hi && questionsText) {
        passageBlocks.push({
          title_en,
          title_hi,
          passage_en,
          passage_hi,
          questionsText
        });
      }
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

function parseQuestions(questionsText) {
  const questions = [];
  const failedQuestions = [];
  
  let normalized = questionsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // First try splitting by double newlines (multi-line questions)
  let questionBlocks = normalized.split(/\n\s*\n/).map(block => block.trim()).filter(block => block);
  
  // If we got very few blocks, try splitting by "Ans:" pattern (for questions without line breaks)
  if (questionBlocks.length < 10) {
    // Check if text has multiple "Ans:" markers - indicates questions are concatenated
    const ansMatches = normalized.match(/Ans:\s*[A-D]/gi);
    if (ansMatches && ansMatches.length > 1) {
      // Simple approach: Split by "Ans: X" followed by capital letter (new question)
      // Pattern: "Ans: X" followed immediately by capital letter (start of next question)
      const splitPattern = /(Ans:\s*[A-D])\s*([A-Z])/gi;
      const splits = [];
      let lastIndex = 0;
      let match;
      
      while ((match = splitPattern.exec(normalized)) !== null) {
        // The split point is right before the capital letter (start of new question)
        const splitPoint = match.index + match[1].length;
        const questionText = normalized.substring(lastIndex, splitPoint).trim();
        
        // Remove passage markers
        const cleanText = questionText.replace(/^(English:|Hindi:)\s*/gi, '').trim();
        
        // Check if this looks like a complete question
        if (cleanText.match(/[A-D]\.\s+/) && cleanText.match(/Ans:\s*[A-D]/i)) {
          questionBlocks.push(cleanText);
        }
        
        lastIndex = splitPoint;
      }
      
      // Add last question
      if (lastIndex < normalized.length) {
        let lastQuestion = normalized.substring(lastIndex).trim();
        lastQuestion = lastQuestion.replace(/^(English:|Hindi:)\s*/gi, '').trim();
        if (lastQuestion.match(/[A-D]\.\s+/) && lastQuestion.match(/Ans:\s*[A-D]/i)) {
          questionBlocks.push(lastQuestion);
        }
      }
      
      // If still no blocks, try even simpler: split by "Ans: X" anywhere
      if (questionBlocks.length === 0 && ansMatches.length > 1) {
        const simpleSplits = normalized.split(/(?=Ans:\s*[A-D])/i);
        questionBlocks = [];
        
        for (let i = 0; i < simpleSplits.length; i++) {
          let block = simpleSplits[i].trim();
          if (!block) continue;
          
          // Remove passage markers
          block = block.replace(/^(English:|Hindi:)\s*/gi, '').trim();
          
          // If this block has "Ans:" and options, it's a question
          if (block.match(/[A-D]\.\s+/) && block.match(/Ans:\s*[A-D]/i)) {
            // Check if this is complete (has question text with "?")
            if (block.includes('?') || block.match(/^[A-Z]/)) {
              questionBlocks.push(block);
            }
          }
        }
      }
    } else {
      // Fallback: split by single lines
      const lines = normalized.split('\n').map(l => l.trim()).filter(l => l);
      questionBlocks = [];
      
      // Each line with "Ans:" is a complete question
      for (const line of lines) {
        if (line.includes('Ans:') && (line.includes('?') || line.match(/[A-D]\.\s+/))) {
          questionBlocks.push(line);
        }
      }
    }
  }
  
  for (let blockIndex = 0; blockIndex < questionBlocks.length; blockIndex++) {
    const block = questionBlocks[blockIndex];
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const fullText = lines.join(' ').trim();
    
    if (!fullText) continue;
    
    try {
      let question_en = '';
      let question_hi = '';
      let options_en = [];
      let options_hi = [];
      let correctAnswer = -1;
      
      // Extract answer first - handle both "Ans: B" and "Ans: B. 4:3" formats
      const ansMatch = fullText.match(/Ans:\s*([A-D])\.?\s*([^A-Z]*?)(?=\s*[A-Z][^?]*\?|$)/i);
      if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      }
      
      // Remove answer from text to get question + options section
      // Find the last "Ans:" occurrence (in case there are multiple)
      const lastAnsIndex = fullText.lastIndexOf('Ans:');
      const textBeforeAns = lastAnsIndex >= 0 ? fullText.substring(0, lastAnsIndex).trim() : fullText.trim();
      
      // Extract question (English and Hindi)
      // Pattern: Question text? (Hindi text) followed by A.
      // Try multiple patterns to handle variations
      let questionMatch = textBeforeAns.match(/^(.+?)\?\s*\(([^)]+)\)\s*(?=[A-D]\.)/);
      if (questionMatch) {
        question_en = questionMatch[1].trim();
        question_hi = questionMatch[2].trim().replace(/\?+\s*$/, '');
      } else {
        // Try: Question text (Hindi text?) followed by A.
        questionMatch = textBeforeAns.match(/^(.+?)\s*\(([^)]+)\)\s*(?=[A-D]\.)/);
        if (questionMatch) {
          question_en = questionMatch[1].trim().replace(/\?+\s*$/, '');
          question_hi = questionMatch[2].trim().replace(/\?+\s*$/, '');
        } else {
          // Try without Hindi - question ends with ? or just before A.
          const simpleQuestionMatch = textBeforeAns.match(/^(.+?)\?\s*(?=[A-D]\.)/);
          if (simpleQuestionMatch) {
            question_en = simpleQuestionMatch[1].trim();
            question_hi = question_en;
          } else {
            // Last resort: everything before first A. is the question
            const firstOptionIndex = textBeforeAns.search(/[A-D]\./i);
            if (firstOptionIndex > 0) {
              const questionPart = textBeforeAns.substring(0, firstOptionIndex).trim();
              // Try to extract Hindi if present
              const hindiMatch = questionPart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
              if (hindiMatch) {
                question_en = hindiMatch[1].trim().replace(/\?+\s*$/, '');
                question_hi = hindiMatch[2].trim().replace(/\?+\s*$/, '');
              } else {
                // No Hindi - just use the question part as-is
                question_en = questionPart.replace(/\?+\s*$/, '').trim();
                question_hi = question_en;
              }
            }
          }
        }
      }
      
      // Extract options section (between question and Ans:)
      const questionEndIndex = textBeforeAns.search(/[A-D]\./i);
      if (questionEndIndex < 0) {
        throw new Error('Could not find options section');
      }
      
      const optionsSection = textBeforeAns.substring(questionEndIndex).trim();
      
      // Extract each option using a more robust approach
      // Split by option markers: A., B., C., D.
      const tempOptions = [];
      
      // Method 1: Use regex to find each option marker and extract text until next marker
      const optionMarkers = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < optionMarkers.length; i++) {
        const currentMarker = optionMarkers[i];
        const nextMarker = i < optionMarkers.length - 1 ? optionMarkers[i + 1] : null;
        
        // Build pattern: currentMarker. followed by text until nextMarker. or end
        let pattern;
        if (nextMarker) {
          pattern = new RegExp(`${currentMarker}\\.\\s*(.+?)(?=\\s+${nextMarker}\\.)`, 'is');
        } else {
          pattern = new RegExp(`${currentMarker}\\.\\s*(.+?)(?=\\s*$)`, 'is');
        }
        
        const match = optionsSection.match(pattern);
        if (match) {
          const optionText = match[1].trim();
          const parsed = parseOption(optionText);
          tempOptions.push(parsed);
        }
      }
      
      // Method 2: If we don't have 4 options, try splitting by markers more carefully
      if (tempOptions.length !== 4) {
        tempOptions.length = 0;
        const parts = optionsSection.split(/\s+([A-D])\.\s+/);
        
        if (parts.length >= 9) {
          // parts[0] is text before first option, parts[1] is first letter, parts[2] is first option text, etc.
          for (let i = 1; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
              const letter = parts[i].toUpperCase();
              let text = parts[i + 1].trim();
              
              // Remove text that belongs to next option
              if (i + 2 < parts.length) {
                text = text.replace(/\s+[A-D]\.\s+.*$/, '').trim();
              }
              
              const expectedLetter = String.fromCharCode(65 + tempOptions.length);
              if (letter === expectedLetter && text) {
                const parsed = parseOption(text);
                tempOptions.push(parsed);
              }
            }
          }
        }
      }
      
      if (tempOptions.length === 4) {
        options_en = tempOptions.map(opt => opt.en);
        options_hi = tempOptions.map(opt => opt.hi);
      }
      
      // Validate and add question
      if (question_en && options_en.length === 4 && correctAnswer >= 0 && correctAnswer < 4) {
        questions.push({
          question_en: question_en,
          question_hi: question_hi || question_en,
          options_en: options_en,
          options_hi: options_hi,
          correctAnswer: correctAnswer
        });
      } else {
        failedQuestions.push({
          index: blockIndex + 1,
          block: fullText.substring(0, 200),
          reason: `Q: ${question_en ? 'OK' : 'MISSING'}, Options: ${options_en.length}/4, Answer: ${correctAnswer >= 0 ? 'OK' : 'MISSING'}`
        });
      }
    } catch (error) {
      failedQuestions.push({
        index: blockIndex + 1,
        block: fullText.substring(0, 200),
        reason: `Error: ${error.message}`
      });
    }
  }
  
  return {
    questions: questions,
    failed: failedQuestions.length,
    failedDetails: failedQuestions
  };
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { questionText, partName } = body;

    if (!questionText || !questionText.trim()) {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400 }
      );
    }

    // Detect if this is reading comprehension format (has "English:" and "Hindi:" markers)
    const isReadingComprehension = questionText.includes('English:') && questionText.includes('Hindi:');
    
    // Parse questions - use reading comprehension parser if detected
    let parsed;
    if (isReadingComprehension) {
      parsed = parseReadingComprehension(questionText);
    } else {
      parsed = parseQuestions(questionText);
    }

    if (parsed.questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found in the text. ${parsed.failed > 0 ? `${parsed.failed} questions failed to parse.` : 'Please check the format.'}` },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;
    let errors = 0;
    const errorDetails = [];

    // Import questions to question bank
    for (let i = 0; i < parsed.questions.length; i++) {
      const qData = parsed.questions[i];
      
      try {
        // Validate question data
        if (!qData.question_en || !qData.question_hi) {
          errors++;
          errorDetails.push({ index: i + 1, error: "Missing question text" });
          continue;
        }
        
        if (!qData.options_en || qData.options_en.length !== 4) {
          errors++;
          errorDetails.push({ index: i + 1, error: "Must have exactly 4 options" });
          continue;
        }
        
        if (qData.correctAnswer < 0 || qData.correctAnswer > 3) {
          errors++;
          errorDetails.push({ index: i + 1, error: "Invalid answer (must be A, B, C, or D)" });
          continue;
        }

        // Use updateOne with upsert - simpler approach like CCC
        const trimmedPartName = partName && partName.trim() ? partName.trim() : null;
        
        // Check if question exists first
        const existingQuestion = await Question.findOne({
          examId: "CPCT_QUESTION_BANK",
          question_en: qData.question_en.trim()
        });
        
        if (existingQuestion) {
          // Update existing question - only update fields that need updating
          const updateResult = await Question.updateOne(
            { _id: existingQuestion._id },
            {
              $set: {
                partName: trimmedPartName,
                question_hi: qData.question_hi.trim(),
                options_en: qData.options_en.map(opt => opt.trim()),
                options_hi: qData.options_hi.map(opt => opt.trim()),
                correctAnswer: qData.correctAnswer,
                marks: 1,
                negativeMarks: 0,
                isFree: true,
                ...(qData.passage_en && { passage_en: qData.passage_en.trim() }),
                ...(qData.passage_hi && { passage_hi: qData.passage_hi.trim() })
              }
            }
          );
          
          // Verify partName was saved
          const verifyDoc = await Question.findById(existingQuestion._id);
          if (trimmedPartName && verifyDoc && verifyDoc.partName !== trimmedPartName) {
            console.warn(`partName not saved! Attempting direct update...`);
            await Question.updateOne(
              { _id: existingQuestion._id },
              { $set: { partName: trimmedPartName } }
            );
          }
          
          updated++;
          if (updated <= 3) {
            const finalCheck = await Question.findById(existingQuestion._id);
            console.log(`Updated question ${updated}: partName="${finalCheck?.partName || 'NOT SET'}", expected="${trimmedPartName}"`);
          }
        } else {
          // Create new question
          const questionDoc = {
            examId: "CPCT_QUESTION_BANK",
            sectionId: "CPCT_QUESTION_BANK_SECTION_A",
            partId: "CPCT_QUESTION_BANK_PART",
            id: `cpct-bank-q-${Date.now()}-${i}`,
            questionType: "MCQ",
            question_en: qData.question_en.trim(),
            question_hi: qData.question_hi.trim(),
            options_en: qData.options_en.map(opt => opt.trim()),
            options_hi: qData.options_hi.map(opt => opt.trim()),
            correctAnswer: qData.correctAnswer,
            marks: 1,
            negativeMarks: 0,
            isFree: true
          };

          // Add passage if present (for reading comprehension)
          if (qData.passage_en) {
            questionDoc.passage_en = qData.passage_en.trim();
          }
          if (qData.passage_hi) {
            questionDoc.passage_hi = qData.passage_hi.trim();
          }

          // Add part name if provided
          if (trimmedPartName) {
            questionDoc.partName = trimmedPartName;
          }

          const created = await Question.create(questionDoc);
          imported++;
          if (imported <= 3) {
            console.log(`Created question ${imported}: partName="${created.partName || 'NOT SET'}", expected="${trimmedPartName}", hasPassage="${!!qData.passage_en}"`);
          }
        }
      } catch (error) {
        console.error(`Error importing question ${i + 1}:`, error);
        errors++;
        errorDetails.push({ index: i + 1, error: error.message });
      }
    }

    // Get the count for this specific part after import
    let partCount = 0;
    if (partName && partName.trim()) {
      const trimmedPartName = partName.trim();
      
      // Wait a moment for database to sync
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Count questions with this partName (case-insensitive match)
      // Use regex for case-insensitive matching
      partCount = await Question.countDocuments({
        examId: "CPCT_QUESTION_BANK",
        partName: { $regex: new RegExp(`^${trimmedPartName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      console.log(`After import - Count for "${trimmedPartName}": ${partCount}`);
      
      // Also try exact match
      const exactCount = await Question.countDocuments({
        examId: "CPCT_QUESTION_BANK",
        partName: trimmedPartName
      });
      console.log(`Exact match count for "${trimmedPartName}": ${exactCount}`);
      
      // Use exact count if regex didn't work
      if (exactCount > partCount) {
        partCount = exactCount;
      }
      
      // Also count all questions in bank
      const totalInBank = await Question.countDocuments({
        examId: "CPCT_QUESTION_BANK"
      });
      console.log(`Total questions in CPCT_QUESTION_BANK: ${totalInBank}`);
      
      // Count questions without partName
      const withoutPartName = await Question.countDocuments({
        examId: "CPCT_QUESTION_BANK",
        $or: [
          { partName: { $exists: false } },
          { partName: null },
          { partName: "" }
        ]
      });
      console.log(`Questions without partName: ${withoutPartName}`);
      
      // DEBUG: Get all unique partNames in the database
      const dbPartNames = await Question.distinct("partName", {
        examId: "CPCT_QUESTION_BANK"
      });
      console.log(`All partNames in database:`, dbPartNames);
      
      // DEBUG: Get a few sample questions to see their partName
      const sampleQuestions = await Question.find({
        examId: "CPCT_QUESTION_BANK"
      }).limit(5).select("question_en partName");
      console.log(`Sample questions with partName:`, sampleQuestions.map(q => ({
        question: q.question_en.substring(0, 50),
        partName: q.partName
      })));
      
      // Also verify by checking a sample question
      const sampleQuestion = await Question.findOne({
        examId: "CPCT_QUESTION_BANK",
        partName: trimmedPartName
      });
      if (sampleQuestion) {
        console.log(`✅ Sample question found: partName="${sampleQuestion.partName}"`);
      } else {
        console.warn(`⚠️ No sample question found with partName="${trimmedPartName}"`);
        
        // Try to find ANY question in the bank
        const anyQuestion = await Question.findOne({
          examId: "CPCT_QUESTION_BANK"
        });
        if (anyQuestion) {
          console.log(`Found a question in bank: partName="${anyQuestion.partName || 'NULL'}", question_en="${anyQuestion.question_en?.substring(0, 50)}..."`);
        }
      }
      
      // List all distinct partNames in bank for debugging
      const distinctPartNames = await Question.distinct("partName", {
        examId: "CPCT_QUESTION_BANK",
        partName: { $exists: true, $ne: null, $ne: "" }
      });
      console.log(`All partNames in bank:`, distinctPartNames);
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} new questions, updated ${updated} existing questions`,
      imported,
      updated,
      errors,
      total: parsed.questions.length,
      failed: parsed.failed,
      partCount: partCount, // Add the count for this part
      partName: partName, // Include the part name for reference
      errorDetails: errors > 0 ? errorDetails : undefined,
      failedDetails: parsed.failedDetails
    });

  } catch (error) {
    console.error("Error importing CPCT question bank:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import questions" },
      { status: 500 }
    );
  }
}
