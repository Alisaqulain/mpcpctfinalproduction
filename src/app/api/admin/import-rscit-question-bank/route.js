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
  } else {
    return {
      en: optionText.trim(),
      hi: optionText.trim()
    };
  }
}

function parseQuestions(questionsText) {
  const questions = [];
  const failedQuestions = [];
  
  let normalized = questionsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let questionBlocks = normalized.split(/\n\s*\n/).map(block => block.trim()).filter(block => block);
  
  if (questionBlocks.length < 50) {
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l);
    questionBlocks = [];
    let currentBlock = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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
      
      const firstLine = lines[0] || '';
      const questionPattern = /^(.+?)\s*\(([^)]+)\)\s*(?=[A-D]\.|$)/;
      const questionMatch = firstLine.match(questionPattern);
      
      if (questionMatch) {
        question_en = questionMatch[1].trim().replace(/\?+\s*$/, '');
        question_hi = questionMatch[2].trim().replace(/\?+\s*$/, '');
      } else {
        const simpleQuestionMatch = firstLine.match(/^(.+?)\?(?=\s+[A-D]\.|$)/);
        if (simpleQuestionMatch) {
          question_en = simpleQuestionMatch[1].trim();
          question_hi = question_en;
        } else {
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
      
      let answerLine = '';
      for (const line of lines) {
        if (/Ans:/i.test(line)) {
          answerLine = line;
          break;
        }
      }
      
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
      
      const ansIndex = fullText.search(/Ans:/i);
      let optionsSection = '';
      
      if (ansIndex > 0) {
        optionsSection = fullText.substring(0, ansIndex);
      } else {
        const questionLineIndex = lines.findIndex(l => l.includes('?'));
        const answerLineIndex = lines.findIndex(l => /Ans:/i.test(l));
        
        if (questionLineIndex >= 0 && answerLineIndex > questionLineIndex) {
          optionsSection = lines.slice(questionLineIndex + 1, answerLineIndex).join(' ');
        } else if (questionLineIndex >= 0) {
          optionsSection = lines.slice(questionLineIndex + 1).join(' ');
        }
      }
      
      const tempOptions = [];
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
      
      if (tempOptions.length !== 4) {
        tempOptions.length = 0;
        const parts = optionsSection.split(/\s+([A-D])\.\s+/);
        if (parts.length >= 9) {
          for (let i = 1; i < parts.length; i += 2) {
            if (parts[i] && parts[i + 1]) {
              const letter = parts[i].toUpperCase();
              let text = parts[i + 1].trim();
              text = text.replace(/\s+[A-D]\.\s+.*$/, '').trim();
              if (letter === String.fromCharCode(65 + tempOptions.length)) {
                const parsed = parseOption(text);
                tempOptions.push(parsed);
              }
            }
          }
        }
      }
      
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
      
      if (question_en && options_en.length === 4 && correctAnswer >= 0 && correctAnswer < 4) {
        questions.push({
          question_en: question_en,
          question_hi: question_hi || question_en,
          options_en: options_en,
          options_hi: options_hi,
          correctAnswer: correctAnswer,
          marks: 2, // RSCIT questions are 2 marks each
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
  
  return {
    questions: questions,
    failed: failedQuestions.length
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
    const { questionsText, section } = body; // section: "A" or "B"

    if (!questionsText || !section) {
      return NextResponse.json(
        { error: "Missing questionsText or section (must be 'A' or 'B')" },
        { status: 400 }
      );
    }

    if (section !== "A" && section !== "B") {
      return NextResponse.json(
        { error: "Section must be 'A' or 'B'" },
        { status: 400 }
      );
    }

    // Parse questions
    const parseResult = parseQuestions(questionsText);
    const parsedQuestions = parseResult.questions;
    
    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions found. Please check the format." },
        { status: 400 }
      );
    }

    // Get current question count for this section to append new questions
    const existingCount = await Question.countDocuments({
      examId: `RSCIT_QUESTION_BANK_${section}`
    });

    // Insert questions into question bank for this section
    const questionsToInsert = parsedQuestions.map((q, index) => {
      return {
        id: `rscit-bank-${section.toLowerCase()}-q-${existingCount + index + 1}`,
        examId: `RSCIT_QUESTION_BANK_${section}`, // Separate banks for Section A and B
        sectionId: `RSCIT_QUESTION_BANK_SECTION_${section}`,
        partId: `RSCIT_QUESTION_BANK_PART_${section}`,
        questionNumber: existingCount + index + 1,
        questionType: "MCQ",
        question_en: q.question_en,
        question_hi: q.question_hi,
        options_en: q.options_en,
        options_hi: q.options_hi,
        correctAnswer: q.correctAnswer,
        explanation_en: q.explanation_en,
        explanation_hi: q.explanation_hi,
        marks: 2, // RSCIT questions are 2 marks each
        negativeMarks: 0
      };
    });

    await Question.insertMany(questionsToInsert);

    // Get final count
    const finalCount = await Question.countDocuments({
      examId: `RSCIT_QUESTION_BANK_${section}`
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${questionsToInsert.length} questions into RSCIT Section ${section} question bank`,
      imported: questionsToInsert.length,
      failed: parseResult.failed,
      totalInBank: finalCount,
      section: section,
      wasAppended: existingCount > 0
    });

  } catch (error) {
    console.error("Error importing RSCIT question bank:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import question bank" },
      { status: 500 }
    );
  }
}



