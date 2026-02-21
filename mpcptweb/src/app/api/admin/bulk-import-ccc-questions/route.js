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

function parseOption(optionText) {
  // Extract English and Hindi from option text
  // Format: "English Text (Hindi Text)" or just "English Text"
  const hindiMatch = optionText.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (hindiMatch) {
    return {
      en: hindiMatch[1].trim(),
      hi: hindiMatch[2].trim()
    };
  } else {
    return {
      en: optionText.trim(),
      hi: optionText.trim() // Use English as Hindi if not provided
    };
  }
}

function parseQuestions(questionsText) {
  const questions = [];
  const failedQuestions = [];
  
  // Normalize line endings
  let normalized = questionsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by double newlines first
  let questionBlocks = normalized.split(/\n\s*\n/).map(block => block.trim()).filter(block => block);
  
  // If we got fewer blocks, try splitting by single newline when followed by a question pattern
  if (questionBlocks.length < 50) {
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l);
    questionBlocks = [];
    let currentBlock = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if this line starts a new question (starts with capital letter and has ? or (Hindi))
      const isNewQuestion = /^[A-Z]/.test(line) && (line.includes('?') || line.includes('('));
      
      if (isNewQuestion && currentBlock.length > 0) {
        questionBlocks.push(currentBlock.join('\n'));
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length > 0) {
      questionBlocks.push(currentBlock.join('\n'));
    }
  }
  
  console.log(`Found ${questionBlocks.length} question blocks`);
  
  for (let blockIndex = 0; blockIndex < questionBlocks.length; blockIndex++) {
    const block = questionBlocks[blockIndex];
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    const fullText = lines.join(' ');
    
    if (!fullText) continue;
    
    try {
      let question_en = '';
      let question_hi = '';
      let options_en = [];
      let options_hi = [];
      let correctAnswer = -1;
      
      // Extract question text with Hindi from first line
      const firstLine = lines[0] || '';
      const questionPattern = /^(.+?)\s*\(([^)]+)\)\s*(?=[A-D]\.|$)/;
      const questionMatch = firstLine.match(questionPattern);
      
      if (questionMatch) {
        question_en = questionMatch[1].trim().replace(/\?+\s*$/, '');
        question_hi = questionMatch[2].trim().replace(/\?+\s*$/, '');
      } else {
        // Try without Hindi
        const simpleQuestionMatch = firstLine.match(/^(.+?)\?(?=\s+[A-D]\.|$)/);
        if (simpleQuestionMatch) {
          question_en = simpleQuestionMatch[1].trim();
          question_hi = question_en;
        } else {
          // Try to extract from full text
          const fullTextMatch = fullText.match(/^(.+?)\s*\(([^)]+)\)\s*(?=[A-D]\.)/);
          if (fullTextMatch) {
            question_en = fullTextMatch[1].trim().replace(/\?+\s*$/, '');
            question_hi = fullTextMatch[2].trim().replace(/\?+\s*$/, '');
          } else {
            const simpleFullMatch = fullText.match(/^(.+?)\?(?=\s+[A-D]\.)/);
            if (simpleFullMatch) {
              question_en = simpleFullMatch[1].trim();
              question_hi = question_en;
            }
          }
        }
      }
      
      // Extract answer - check all lines for "Ans:"
      let answerLine = '';
      for (const line of lines) {
        if (/Ans:/i.test(line)) {
          answerLine = line;
          break;
        }
      }
      
      // If answer not found in lines, check full text
      if (!answerLine) {
        const ansMatch = fullText.match(/Ans:\s*([A-D])\.?\s*(.+?)(?:\n|$)/i);
        if (ansMatch) {
          answerLine = ansMatch[0];
        }
      }
      
      if (answerLine) {
        const ansMatch = answerLine.match(/Ans:\s*([A-D])\.?\s*(.+?)$/i);
        if (ansMatch) {
          correctAnswer = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
        }
      }
      
      // Extract options - find section between question and Ans:
      const ansIndex = fullText.search(/Ans:/i);
      let optionsSection = '';
      
      if (ansIndex > 0) {
        optionsSection = fullText.substring(0, ansIndex);
      } else {
        // If Ans: not found, try to extract options from lines
        // Options should be between question line and answer line
        const questionLineIndex = lines.findIndex(l => l.includes('?'));
        const answerLineIndex = lines.findIndex(l => /Ans:/i.test(l));
        
        if (questionLineIndex >= 0 && answerLineIndex > questionLineIndex) {
          optionsSection = lines.slice(questionLineIndex + 1, answerLineIndex).join(' ');
        } else if (questionLineIndex >= 0) {
          // No answer line found, try to extract from remaining lines
          optionsSection = lines.slice(questionLineIndex + 1).join(' ');
        }
      }
      
      // Extract each option with its Hindi text
      const tempOptions = [];
      
      // Try pattern that matches: A. text (optional Hindi) followed by B.
      const optionPatterns = [
        /A\.\s*(.+?)(?=\s+B\.|$)/i,
        /B\.\s*(.+?)(?=\s+C\.|$)/i,
        /C\.\s*(.+?)(?=\s+D\.|$)/i,
        /D\.\s*(.+?)(?=\s+Ans:|$)/i
      ];
      
      for (const pattern of optionPatterns) {
        const match = optionsSection.match(pattern);
        if (match) {
          const optionText = match[1].trim();
          const parsed = parseOption(optionText);
          tempOptions.push(parsed);
        }
      }
      
      // If we still don't have 4, try a different approach - split by option markers
      if (tempOptions.length !== 4) {
        tempOptions.length = 0;
        // Split by " A. " " B. " " C. " " D. "
        const parts = optionsSection.split(/\s+([A-D])\.\s+/);
        if (parts.length >= 9) {
          for (let i = 1; i < parts.length; i += 2) {
            if (parts[i] && parts[i + 1]) {
              const letter = parts[i].toUpperCase();
              let text = parts[i + 1].trim();
              // Remove next option marker if present
              text = text.replace(/\s+[A-D]\.\s+.*$/, '').trim();
              // Only add if it's A, B, C, or D in order
              if (letter === String.fromCharCode(65 + tempOptions.length)) {
                const parsed = parseOption(text);
                tempOptions.push(parsed);
              }
            }
          }
        }
      }
      
      // Last resort: try extracting from individual lines
      if (tempOptions.length !== 4) {
        tempOptions.length = 0;
        for (const line of lines) {
          const optionMatch = line.match(/^([A-D])\.\s*(.+)$/i);
          if (optionMatch) {
            const letter = optionMatch[1].toUpperCase();
            const text = optionMatch[2].trim();
            if (letter === String.fromCharCode(65 + tempOptions.length)) {
              const parsed = parseOption(text);
              tempOptions.push(parsed);
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
          correctAnswer: correctAnswer,
          marks: 1,
          explanation_en: `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${options_en[correctAnswer]}`,
          explanation_hi: `सही उत्तर ${String.fromCharCode(65 + correctAnswer)} है। ${options_hi[correctAnswer] || options_en[correctAnswer]}`
        });
      } else {
        failedQuestions.push({
          index: blockIndex + 1,
          block: fullText.substring(0, 150),
          reason: `Q: ${question_en ? 'OK' : 'MISSING'}, Options: ${options_en.length}, Answer: ${correctAnswer >= 0 ? 'OK' : 'MISSING'}`
        });
      }
    } catch (error) {
      failedQuestions.push({
        index: blockIndex + 1,
        block: fullText.substring(0, 150),
        reason: `Error: ${error.message}`
      });
    }
  }
  
  // Limit to 100 questions if more are provided
  const originalCount = questions.length;
  const finalQuestions = questions.slice(0, 100);
  const wasLimited = originalCount > 100;
  
  console.log(`Parsed ${originalCount} questions successfully, ${failedQuestions.length} failed`);
  if (wasLimited) {
    console.log(`Limited to first 100 questions (had ${originalCount} total)`);
  }
  if (failedQuestions.length > 0) {
    console.log('Failed questions:', failedQuestions.slice(0, 5));
  }
  
  return {
    questions: finalQuestions,
    originalCount: originalCount,
    wasLimited: wasLimited
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
    const { questionsText, examId } = body;

    if (!questionsText || !examId) {
      return NextResponse.json(
        { error: "Missing questionsText or examId" },
        { status: 400 }
      );
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Verify it's a CCC exam
    if (exam.key !== "CCC") {
      return NextResponse.json(
        { error: "This endpoint is only for CCC exams" },
        { status: 400 }
      );
    }

    // Get section and part for this exam
    const section = await Section.findOne({ examId: exam._id });
    if (!section) {
      return NextResponse.json(
        { error: "Section not found for this exam. Please create the exam structure first." },
        { status: 404 }
      );
    }

    const part = await Part.findOne({ examId: exam._id, sectionId: section._id });
    if (!part) {
      return NextResponse.json(
        { error: "Part not found for this exam. Please create the exam structure first." },
        { status: 404 }
      );
    }

    // Parse questions
    const parseResult = parseQuestions(questionsText);
    const parsedQuestions = parseResult.questions;
    const originalParsedCount = parseResult.originalCount;
    const wasLimited = parseResult.wasLimited;
    
    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions found. Please check the format." },
        { status: 400 }
      );
    }
    
    console.log(`Successfully parsed ${parsedQuestions.length} questions out of input (${originalParsedCount} originally parsed)`);

    // Delete existing questions for this exam
    await Question.deleteMany({
      $or: [
        { examId: String(exam._id) },
        { examId: exam._id }
      ]
    });

    // Prepare questions for insertion
    const questionsToInsert = parsedQuestions.map((q, index) => {
      const questionId = `ccc-exam-${exam.title.replace('CCC Exam ', '')}-q-${index + 1}`;
      
      return {
        id: questionId,
        examId: String(exam._id),
        sectionId: String(section._id),
        partId: String(part._id),
        questionNumber: index + 1,
        questionType: "MCQ",
        question_en: q.question_en,
        question_hi: q.question_hi,
        options_en: q.options_en,
        options_hi: q.options_hi,
        correctAnswer: q.correctAnswer,
        explanation_en: q.explanation_en || `The correct answer is ${String.fromCharCode(65 + q.correctAnswer)}. ${q.options_en[q.correctAnswer]}`,
        explanation_hi: q.explanation_hi || `सही उत्तर ${String.fromCharCode(65 + q.correctAnswer)} है। ${q.options_hi[q.correctAnswer] || q.options_en[q.correctAnswer]}`,
        marks: q.marks || 1,
        negativeMarks: 0
      };
    });

    // Insert questions
    await Question.insertMany(questionsToInsert);

    // Count total blocks to show parsing stats
    const totalBlocks = questionsText.split(/\n\s*\n/).filter(b => b.trim()).length;
    const failedCount = totalBlocks - originalParsedCount;
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${questionsToInsert.length} questions`,
      imported: questionsToInsert.length,
      examTitle: exam.title,
      parsingStats: {
        totalBlocks: totalBlocks,
        parsed: parsedQuestions.length,
        originalParsed: originalParsedCount,
        failed: failedCount,
        wasLimited: wasLimited
      },
      warning: wasLimited 
        ? `Only first 100 questions imported (out of ${originalParsedCount} successfully parsed from ${totalBlocks} total). Remaining questions were skipped.`
        : failedCount > 0 
          ? `${failedCount} questions could not be parsed. Please check the format.`
          : undefined
    });

  } catch (error) {
    console.error("Error importing bulk CCC questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import questions" },
      { status: 500 }
    );
  }
}

