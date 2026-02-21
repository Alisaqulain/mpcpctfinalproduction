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

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { partName } = body; // Optional: filter by part name

    // Get all questions from CPCT question bank
    let questionBankQuery = {
      examId: "CPCT_QUESTION_BANK"
    };
    
    // Filter by part name if provided (use exact match first, then try case-insensitive)
    if (partName && partName.trim()) {
      const trimmedPartName = partName.trim();
      questionBankQuery.partName = trimmedPartName;
    }
    
    const questionBank = await Question.find(questionBankQuery);
    
    // Debug: Log what we're looking for and what we found
    console.log(`Distributing CPCT questions - Looking for partName: "${partName}"`);
    console.log(`Query:`, JSON.stringify(questionBankQuery, null, 2));
    console.log(`Found ${questionBank.length} questions in bank`);
    
    // If no questions found with exact match, try case-insensitive search
    if (questionBank.length === 0 && partName && partName.trim()) {
      const trimmedPartName = partName.trim();
      // Try to find questions with any case variation
      const allBankQuestions = await Question.find({ examId: "CPCT_QUESTION_BANK" });
      const matchingQuestions = allBankQuestions.filter(q => {
        if (!q.partName) return false;
        return q.partName.trim().toUpperCase() === trimmedPartName.toUpperCase();
      });
      
      console.log(`Tried case-insensitive search - Found ${matchingQuestions.length} questions`);
      console.log(`Sample partNames in bank:`, [...new Set(allBankQuestions.map(q => q.partName).filter(Boolean))].slice(0, 5));
      
      if (matchingQuestions.length > 0) {
        // Use the matching questions
        questionBank.push(...matchingQuestions);
      }
    }

    if (questionBank.length === 0) {
      // Get all part names in bank for debugging
      const allPartNames = await Question.distinct("partName", {
        examId: "CPCT_QUESTION_BANK",
        partName: { $exists: true, $ne: null, $ne: "" }
      });
      
      return NextResponse.json(
        { 
          error: `CPCT question bank is empty${partName ? ` for part "${partName}"` : ""}. Please import questions first.`,
          debug: {
            requestedPartName: partName,
            availablePartNames: allPartNames,
            totalQuestionsInBank: await Question.countDocuments({ examId: "CPCT_QUESTION_BANK" })
          }
        },
        { status: 400 }
      );
    }

    // Get all CPCT exams
    const cpctExams = await Exam.find({ key: "CPCT" }).sort({ title: 1 });
    
    if (cpctExams.length === 0) {
      return NextResponse.json(
        { error: "No CPCT exams found. Please create CPCT exams first." },
        { status: 400 }
      );
    }
    
    // Determine questions needed per exam based on part name
    let questionsPerExam = 52; // Default
    if (partName && partName.trim()) {
      const partNameUpper = partName.trim().toUpperCase();
      if (partNameUpper.includes('QUANTITATIVE APTITUDE')) {
        questionsPerExam = 6;
      } else if (partNameUpper.includes('GENERAL MENTAL ABILITY') || partNameUpper.includes('REASONING')) {
        questionsPerExam = 6;
      } else if (partNameUpper.includes('GENERAL AWARENESS')) {
        questionsPerExam = 6;
      } else if (partNameUpper.includes('READING COMPREHENSION')) {
        questionsPerExam = 5;
      } else if (partNameUpper.includes('IT SKILLS')) {
        questionsPerExam = 52;
      }
    }
    
    // Check if we have enough questions for all exams
    const totalQuestionsNeeded = cpctExams.length * questionsPerExam;
    if (questionBank.length < totalQuestionsNeeded) {
      console.warn(`⚠️ Warning: Only ${questionBank.length} questions available, but ${totalQuestionsNeeded} needed for ${cpctExams.length} exams (${questionsPerExam} per exam)`);
      // Continue anyway - we'll use what we have, but some exams might get fewer questions
    }

    const results = [];
    const errors = [];

    // Process each exam
    for (const exam of cpctExams) {
      try {
        // Get Section A (MCQ section)
        const sectionA = await Section.findOne({ 
          examId: exam._id,
          name: { $in: ["Section A", "CPCT MCQ", "Section 1 (CPCT MCQ)"] }
        });
        
        if (!sectionA) {
          errors.push({ exam: exam.title, error: "Section A not found" });
          continue;
        }

        // Get all parts in Section A
        const parts = await Part.find({ sectionId: sectionA._id }).sort({ order: 1 });
        
        if (parts.length === 0) {
          errors.push({ exam: exam.title, error: "No parts found in Section A" });
          continue;
        }
        
        // Debug: Log available parts
        console.log(`Exam "${exam.title}" - Section A has ${parts.length} parts:`, parts.map(p => p.name));

        // Distribute questions to parts
        // If partName is specified, only distribute to that part
        // Otherwise, distribute evenly across all parts
        let targetParts = parts;
        
        if (partName && partName.trim()) {
          const trimmedPartName = partName.trim().toUpperCase();
          
          // Map of question bank part names to possible exam part name variations
          const partNameVariations = {
            "IT SKILLS": ["IT SKILLS", "IT SKILLS & NETWORKING", "IT SKILLS AND NETWORKING", "IT SKILLS & NETWORKING", "COMPUTER PROFICIENCY", "IT SKILLS AND NETWORKING"],
            "READING COMPREHENSION": ["READING COMPREHENSION"],
            "QUANTITATIVE APTITUDE": ["QUANTITATIVE APTITUDE"],
            "GENERAL MENTAL ABILITY AND REASONING": ["GENERAL MENTAL ABILITY AND REASONING", "GENERAL MENTAL ABILITY", "REASONING", "GENERAL MENTAL ABILITY & REASONING"],
            "GENERAL AWARENESS": ["GENERAL AWARENESS"]
          };
          
          // Get all possible variations for this part name
          const possibleVariations = partNameVariations[trimmedPartName] || [trimmedPartName];
          
          // Try to match any variation
          targetParts = parts.filter(p => {
            const pNameUpper = p.name.toUpperCase().trim();
            // Check if part name matches any variation
            return possibleVariations.some(variant => {
              const variantUpper = variant.toUpperCase().trim();
              // Exact match
              if (pNameUpper === variantUpper) return true;
              // Contains match (for "IT SKILLS" matching "IT SKILLS & NETWORKING")
              if (pNameUpper.includes(variantUpper) || variantUpper.includes(pNameUpper)) return true;
              return false;
            });
          });
          
          // If still no match, try fuzzy matching
          if (targetParts.length === 0) {
            targetParts = parts.filter(p => {
              const pNameUpper = p.name.toUpperCase().trim();
              // Remove common words and compare
              const cleanPartName = trimmedPartName.replace(/\s*(AND|&)\s*/gi, ' ').trim();
              const cleanPName = pNameUpper.replace(/\s*(AND|&)\s*/gi, ' ').trim();
              return cleanPName.includes(cleanPartName) || cleanPartName.includes(cleanPName);
            });
          }
          
          // Debug: Log what we found
          console.log(`Looking for part "${partName}" in exam "${exam.title}"`);
          console.log(`Available parts:`, parts.map(p => p.name));
          console.log(`Matched parts:`, targetParts.map(p => p.name));
        }

        if (targetParts.length === 0 && partName) {
          errors.push({ 
            exam: exam.title, 
            error: `Part "${partName}" not found. Available parts: ${parts.map(p => p.name).join(", ")}` 
          });
          continue;
        }

        // When partName is specified, ALL questions go to that ONE part
        // Each exam gets a shuffled set of questions (52 questions per exam for IT SKILLS)
        // If partName is NOT specified, distribute evenly across all parts
        
        let totalQuestionsAdded = 0;
        
        if (partName && partName.trim()) {
          // Get the target part (should be only one)
          const targetPart = targetParts[0];
          
          // Delete only questions for this specific part (keep other parts' questions)
          console.log(`🗑️ Deleting existing questions for part "${targetPart.name}" in exam "${exam.title}"`);
          const deleteResult = await Question.deleteMany({
            $or: [
              { examId: String(exam._id) },
              { examId: exam._id }
            ],
            partId: String(targetPart._id),
            questionType: { $ne: "TYPING" }
          });
          console.log(`✅ Deleted ${deleteResult.deletedCount} existing questions for part "${targetPart.name}"`);
          
          const partNameUpper = targetPart.name.toUpperCase();
          
          let questionsForPart = [];
          
          // Special handling for Reading Comprehension: Group by passage and assign one passage per exam
          if (partNameUpper.includes('READING COMPREHENSION')) {
            // Group questions by passage (same passage_en and passage_hi)
            const passageGroups = new Map();
            for (const q of questionBank) {
              if (q.passage_en && q.passage_hi) {
                const passageKey = `${q.passage_en.trim()}|${q.passage_hi.trim()}`;
                if (!passageGroups.has(passageKey)) {
                  passageGroups.set(passageKey, []);
                }
                passageGroups.get(passageKey).push(q);
              }
            }
            
            // Convert to array of passages (each passage should have 5 questions)
            const passages = Array.from(passageGroups.values()).filter(p => p.length === 5);
            
            // Shuffle passages for variety
            const shuffledPassages = shuffleArray(passages);
            
            // Get passage for this exam (use exam index to assign sequentially)
            const examIndex = cpctExams.findIndex(e => e._id.toString() === exam._id.toString());
            if (examIndex >= 0 && examIndex < shuffledPassages.length) {
              questionsForPart = shuffledPassages[examIndex];
              console.log(`Distributing passage ${examIndex + 1} (${questionsForPart.length} questions) to "${targetPart.name}" in "${exam.title}"`);
            } else {
              console.warn(`Not enough passages for exam ${examIndex + 1}. Available: ${shuffledPassages.length}, Needed: ${cpctExams.length}`);
              // Fallback: use first available passage or empty
              if (shuffledPassages.length > 0) {
                questionsForPart = shuffledPassages[0];
              }
            }
          } else {
            // For other parts: Shuffle questions for THIS exam and take required amount
            const shuffledBank = shuffleArray([...questionBank]);
            
            // Determine how many questions this part should have based on part name
            let questionsNeeded;
            
            if (partNameUpper.includes('QUANTITATIVE APTITUDE')) {
              // Quantitative Aptitude: exactly 6 questions per exam
              questionsNeeded = 6;
            } else if (partNameUpper.includes('GENERAL MENTAL ABILITY') || partNameUpper.includes('REASONING')) {
              // General Mental Ability and Reasoning: exactly 6 questions per exam
              questionsNeeded = 6;
            } else if (partNameUpper.includes('GENERAL AWARENESS')) {
              // General Awareness: exactly 6 questions per exam
              questionsNeeded = 6;
            } else if (partNameUpper.includes('IT SKILLS')) {
              // IT SKILLS: typically 52 questions
              questionsNeeded = 52;
            } else {
              // Default: use all available questions (or a reasonable default)
              questionsNeeded = Math.min(20, shuffledBank.length);
            }
            
            // Ensure we don't exceed available questions
            questionsNeeded = Math.min(questionsNeeded, shuffledBank.length);
            questionsForPart = shuffledBank.slice(0, questionsNeeded);
            
            console.log(`Distributing ${questionsForPart.length} questions to "${targetPart.name}" in "${exam.title}"`);
          }
          
          // Create questions for this part
          const questionsToInsert = questionsForPart.map((q, index) => {
            // Shuffle options for each question
            const options = [...q.options_en];
            const options_hi = [...q.options_hi];
            const correctAnswerIndex = q.correctAnswer;
            
            const indices = [0, 1, 2, 3];
            const shuffledIndices = shuffleArray(indices);
            
            const newCorrectAnswer = shuffledIndices.indexOf(correctAnswerIndex);
            const shuffledOptions = shuffledIndices.map(i => options[i]);
            const shuffledOptions_hi = shuffledIndices.map(i => options_hi[i]);

            const questionDoc = {
              id: `cpct-exam-${exam.title.replace('CPCT Exam ', '')}-part-${targetPart.name.replace(/\s+/g, '-')}-q-${index + 1}`,
              examId: String(exam._id),
              sectionId: String(sectionA._id),
              partId: String(targetPart._id),
              questionNumber: index + 1, // Question number within this part
              questionType: "MCQ",
              question_en: q.question_en,
              question_hi: q.question_hi,
              options_en: shuffledOptions,
              options_hi: shuffledOptions_hi,
              correctAnswer: newCorrectAnswer,
              marks: q.marks || 1,
              negativeMarks: q.negativeMarks || 0,
              isFree: exam.isFree || false
            };
            
            // Add passage if present (for reading comprehension)
            if (q.passage_en) {
              questionDoc.passage_en = q.passage_en;
            }
            if (q.passage_hi) {
              questionDoc.passage_hi = q.passage_hi;
            }
            
            return questionDoc;
          });

          if (questionsToInsert.length > 0) {
            const insertedQuestions = await Question.insertMany(questionsToInsert);
            totalQuestionsAdded = questionsToInsert.length;
            console.log(`✅ Inserted ${insertedQuestions.length} questions for "${targetPart.name}" in "${exam.title}" (examId: ${String(exam._id)})`);
            
            // Verify questions were inserted
            const verifyCount = await Question.countDocuments({ 
              examId: String(exam._id),
              partId: String(targetPart._id)
            });
            console.log(`✅ Verified: ${verifyCount} questions now exist for "${targetPart.name}" in "${exam.title}"`);
          } else {
            console.warn(`⚠️ No questions to insert for "${targetPart.name}" in "${exam.title}"`);
          }
        } else {
          // No specific part: delete ALL MCQ questions for this exam (keep typing questions)
          console.log(`🗑️ Deleting ALL existing MCQ questions for exam "${exam.title}"`);
          const deleteResult = await Question.deleteMany({
            $or: [
              { examId: String(exam._id) },
              { examId: exam._id }
            ],
            questionType: { $ne: "TYPING" }
          });
          console.log(`✅ Deleted ${deleteResult.deletedCount} existing questions for exam "${exam.title}"`);
          
          // No specific part: distribute evenly across all parts (original logic)
          const questionsPerPart = Math.floor(questionBank.length / targetParts.length);
          const shuffledBank = shuffleArray(questionBank);
          
          let questionIndex = 0;

          for (const part of targetParts) {
            const questionsForPart = shuffledBank.slice(
              questionIndex,
              questionIndex + questionsPerPart
            );
            
            questionIndex += questionsPerPart;

            // Create questions for this part
            const questionsToInsert = questionsForPart.map((q, index) => {
              // Shuffle options for each question
              const options = [...q.options_en];
              const options_hi = [...q.options_hi];
              const correctAnswerIndex = q.correctAnswer;
              
              const indices = [0, 1, 2, 3];
              const shuffledIndices = shuffleArray(indices);
              
              const newCorrectAnswer = shuffledIndices.indexOf(correctAnswerIndex);
              const shuffledOptions = shuffledIndices.map(i => options[i]);
              const shuffledOptions_hi = shuffledIndices.map(i => options_hi[i]);

              return {
                id: `cpct-exam-${exam.title.replace('CPCT Exam ', '')}-part-${part.name.replace(/\s+/g, '-')}-q-${index + 1}`,
                examId: String(exam._id),
                sectionId: String(sectionA._id),
                partId: String(part._id),
                questionNumber: totalQuestionsAdded + index + 1,
                questionType: "MCQ",
                question_en: q.question_en,
                question_hi: q.question_hi,
                options_en: shuffledOptions,
                options_hi: shuffledOptions_hi,
                correctAnswer: newCorrectAnswer,
                marks: q.marks || 1,
                negativeMarks: q.negativeMarks || 0,
                isFree: exam.isFree || false
              };
            });

            if (questionsToInsert.length > 0) {
              const insertedQuestions = await Question.insertMany(questionsToInsert);
              totalQuestionsAdded += questionsToInsert.length;
              console.log(`✅ Inserted ${insertedQuestions.length} questions for "${part.name}" in "${exam.title}" (examId: ${String(exam._id)})`);
            }
          }
        }

        // Final verification: count all questions for this exam
        const finalQuestionCount = await Question.countDocuments({ 
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ],
          questionType: { $ne: "TYPING" }
        });
        
        console.log(`📊 Final count for "${exam.title}": ${finalQuestionCount} MCQ questions (examId: ${String(exam._id)})`);
        
        results.push({
          examTitle: exam.title,
          questionsAdded: totalQuestionsAdded,
          partsAffected: targetParts.length,
          finalQuestionCount: finalQuestionCount
        });

      } catch (error) {
        errors.push({
          exam: exam.title,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Distributed questions to ${results.length} CPCT exams`,
      results: results,
      errors: errors.length > 0 ? errors : undefined,
      totalQuestionsInBank: questionBank.length,
      partName: partName || "All parts"
    });

  } catch (error) {
    console.error("Error distributing CPCT questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to distribute questions" },
      { status: 500 }
    );
  }
}

