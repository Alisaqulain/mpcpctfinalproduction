import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import Question from "@/lib/models/Question";
import SkillLesson from "@/lib/models/SkillLesson";

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

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const deletedExams = [];
    const createdExams = [];
    const errors = [];
    let totalSkillLessonsLinked = 0;

    // Section A parts definition
    const sectionA_Parts = [
      {
        name: "IT SKILLS",
        order: 1
      },
      {
        name: "READING COMPREHENSION",
        order: 2
      },
      {
        name: "QUANTITATIVE APTITUDE",
        order: 3
      },
      {
        name: "GENERAL MENTAL ABILITY AND REASONING",
        order: 4
      },
      {
        name: "GENERAL AWARENESS",
        order: 5
      }
    ];

    // Main sections (A, B, C)
    const sections = [
      {
        name: "Section A",
        order: 1,
        questionCount: 75, // Total MCQ questions (to be added manually)
        parts: sectionA_Parts,
        timing: 75 // 75 minutes for Section A
      },
      {
        name: "Section B",
        order: 2,
        questionCount: 0,
        typingTime: 15, // 15 minutes separate timer for English Typing
        questionType: "TYPING"
      },
      {
        name: "Section C",
        order: 3,
        questionCount: 0,
        typingTime: 15, // 15 minutes separate timer for Hindi Typing
        questionType: "TYPING"
      }
    ];

    // Delete and recreate Exam 1 and Exam 2
    for (let examNum of [1, 2]) {
      try {
        const examTitle = `CPCT Exam ${examNum}`;
        const examId = `cpct-exam-${examNum}`;
        
        // Find and delete existing exam
        const existingExam = await Exam.findOne({ 
          key: "CPCT",
          title: examTitle
        });

        if (existingExam) {
          const examIdStr = String(existingExam._id);
          
          // Find all sections for this exam
          const existingSections = await Section.find({ examId: existingExam._id });
          
          // Delete all parts for these sections
          for (const oldSection of existingSections) {
            await Part.deleteMany({ sectionId: oldSection._id });
          }
          
          // Delete all questions for this exam
          await Question.deleteMany({ 
            $or: [
              { examId: examIdStr },
              { examId: existingExam._id }
            ]
          });
          
          // Delete all sections
          await Section.deleteMany({ examId: existingExam._id });
          
          // Delete the exam
          await Exam.findByIdAndDelete(existingExam._id);
          
          deletedExams.push({
            title: examTitle,
            sections: existingSections.length
          });
          
          console.log(`✅ Deleted ${examTitle} and all related data`);
        }

        // Create new exam
        const exam = await Exam.create({
          key: "CPCT",
          title: examTitle,
          totalTime: 75, // Main exam timer for Section A (75 minutes)
          totalQuestions: 75, // Total MCQ questions
          isFree: examNum === 1 // Exam 1 is free, Exam 2 is paid
        });

        // Create sections and parts for this exam
        const createdSections = [];
        let totalParts = 0;
        
        for (const sectionData of sections) {
          const sectionId = `${examId}-section-${sectionData.order}`;
          
          // For typing sections (Section B and C), link to skill lessons
          let skillLessonId = null;
          let skillLesson = null;
          if (sectionData.name === "Section B" || sectionData.name === "Section C") {
            // Paper 1 -> Lesson 1, Paper 2 -> Lesson 2, etc.
            const lessonOrder = examNum;
            const language = sectionData.name === "Section B" ? "English" : "Hindi";
            
            // Find the skill lesson with matching order and language
            skillLesson = await SkillLesson.findOne({
              language: language,
              order: lessonOrder
            });
            
            // If not found by exact order, try to find by order number (flexible matching)
            if (!skillLesson) {
              skillLesson = await SkillLesson.findOne({
                language: language,
                $or: [
                  { order: lessonOrder },
                  { order: parseInt(lessonOrder) },
                  { order: String(lessonOrder) }
                ]
              }).sort({ order: 1, createdAt: 1 });
            }
            
            // If still not found, try to find any lesson with that order (case-insensitive language)
            if (!skillLesson) {
              skillLesson = await SkillLesson.findOne({
                $or: [
                  { language: language },
                  { language: language.toLowerCase() },
                  { language: language.toUpperCase() }
                ],
                order: lessonOrder
              }).sort({ order: 1, createdAt: 1 });
            }
            
            // If still not found, try to find ANY lesson of that language (use first available)
            if (!skillLesson) {
              skillLesson = await SkillLesson.findOne({
                language: language
              }).sort({ order: 1, createdAt: 1 });
            }
            
            // If still not found, try case-insensitive language match
            if (!skillLesson) {
              skillLesson = await SkillLesson.findOne({
                $or: [
                  { language: language },
                  { language: language.toLowerCase() },
                  { language: language.toUpperCase() }
                ]
              }).sort({ order: 1, createdAt: 1 });
            }
            
            if (skillLesson) {
              skillLessonId = skillLesson.id || skillLesson._id?.toString();
              totalSkillLessonsLinked++;
              console.log(`  ✅ Linked ${sectionData.name} to ${language} Skill Lesson (ID: ${skillLessonId}, order: ${skillLesson.order || 'N/A'})`);
            } else {
              // Log available skill lessons for debugging
              const availableLessons = await SkillLesson.find({ language: language }).sort({ order: 1 }).limit(5);
              console.log(`  ⚠️ Warning: ${language} Skill Lesson not found for ${sectionData.name}. Will create typing question with default content.`);
              console.log(`  📋 Available ${language} lessons (first 5):`, availableLessons.map(l => ({ order: l.order, id: l.id, title: l.title })));
            }
          }

          // Create section
          const section = await Section.create({
            id: sectionId,
            name: sectionData.name,
            examId: exam._id,
            lessonNumber: sectionData.order,
            order: sectionData.order,
            typingTime: sectionData.typingTime || null,
            skillLessonId: skillLessonId
          });

          // For Section A, create multiple parts (one for each MCQ section)
          // For Section B and C (typing sections), create one part
          if (sectionData.parts && sectionData.parts.length > 0) {
            // Section A: Create parts for each MCQ section
            for (const partData of sectionData.parts) {
              const partId = `${sectionId}-part-${partData.order}`;
              await Part.create({
                id: partId,
                name: partData.name,
                examId: exam._id,
                sectionId: section._id,
                order: partData.order
              });
              totalParts++;
            }
          } else {
            // Section B or C (typing sections): Create one part
            const partId = `${sectionId}-part-1`;
            const typingPart = await Part.create({
              id: partId,
              name: sectionData.name === "Section B" ? "English Typing" : "Hindi Typing",
              examId: exam._id,
              sectionId: section._id,
              order: 1
            });
            totalParts++;
            
            // Always create typing question - use skill lesson if available, otherwise use default content
            try {
              const questionId = `${sectionId}-typing-question-1`;
              const typingLanguage = sectionData.name === "Section B" ? "English" : "Hindi";
              
              // Default content if no skill lesson found
              const defaultEnglishContent = "The quick brown fox jumps over the lazy dog. Practice typing to improve your speed and accuracy. This is a sample English typing test for CPCT exam preparation. Type carefully and focus on accuracy. Speed will come with practice. Keep your fingers on the home row and maintain proper posture while typing.";
              const defaultHindiContent = "किताब ज्ञान का भंडार होती है। इनमें हर तरह का ज्ञान भरा होता है। ये मानव की सबसे बेहतरीन मित्र होती है। पढ़ने से मनुष्य का ज्ञान बढ़ता है और उसकी सोचने की क्षमता विकसित होती है।";
              
              let typingScriptType = null;
              let typingDuration = 15;
              let typingContent_english = "";
              let typingContent_hindi_ramington = "";
              let typingContent_hindi_inscript = "";
              
              if (skillLesson) {
                // Use skill lesson content
                typingScriptType = typingLanguage === "Hindi" ? (skillLesson.scriptType || "Ramington Gail") : null;
                typingDuration = skillLesson.duration || 15;
                if (typingLanguage === "English") {
                  typingContent_english = skillLesson.textContent || defaultEnglishContent;
                } else {
                  if (typingScriptType === "Ramington Gail") {
                    typingContent_hindi_ramington = skillLesson.textContent || defaultHindiContent;
                  } else if (typingScriptType === "Inscript") {
                    typingContent_hindi_inscript = skillLesson.textContent || defaultHindiContent;
                  } else {
                    typingContent_hindi_ramington = skillLesson.textContent || defaultHindiContent;
                  }
                }
                console.log(`  ✅ Created typing question from skill lesson for ${sectionData.name}`);
              } else {
                // Use default content
                typingScriptType = typingLanguage === "Hindi" ? "Ramington Gail" : null;
                typingDuration = 15;
                if (typingLanguage === "English") {
                  typingContent_english = defaultEnglishContent;
                } else {
                  typingContent_hindi_ramington = defaultHindiContent;
                }
                console.log(`  ⚠️ Created typing question with default content for ${sectionData.name} (no skill lesson found)`);
              }
              
              // Create typing question
              await Question.create({
                id: questionId,
                questionType: "TYPING",
                question_en: `Typing Test - ${sectionData.name}`,
                question_hi: `टाइपिंग टेस्ट - ${sectionData.name}`,
                examId: exam._id,
                sectionId: section._id,
                partId: typingPart._id,
                typingLanguage: typingLanguage,
                typingScriptType: typingScriptType,
                typingDuration: typingDuration,
                typingBackspaceEnabled: true,
                typingContent_english: typingContent_english,
                typingContent_hindi_ramington: typingContent_hindi_ramington,
                typingContent_hindi_inscript: typingContent_hindi_inscript,
                marks: 0 // Typing sections don't have marks, they're evaluated separately
              });
            } catch (questionError) {
              console.error(`  ❌ Error creating typing question for ${sectionData.name}:`, questionError);
            }
          }

          createdSections.push({
            id: section._id.toString(),
            name: section.name,
            order: section.order,
            questionCount: sectionData.questionCount,
            typingTime: sectionData.typingTime,
            partsCount: sectionData.parts ? sectionData.parts.length : 1,
            skillLessonId: skillLessonId
          });
        }

        createdExams.push({
          examId: exam._id.toString(),
          title: exam.title,
          isFree: exam.isFree,
          sections: createdSections.length,
          parts: totalParts,
          totalTime: exam.totalTime,
          totalQuestions: exam.totalQuestions
        });

        console.log(`✅ Created exam ${examNum}: ${examTitle} (${exam.isFree ? 'FREE' : 'PAID'})`);

      } catch (error) {
        console.error(`❌ Error recreating exam ${examNum}:`, error);
        errors.push({
          examNum,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recreated CPCT Exam 1 and Exam 2 with structure`,
      deleted: deletedExams,
      created: createdExams,
      summary: {
        total: createdExams.length,
        free: createdExams.filter(e => e.isFree).length,
        paid: createdExams.filter(e => !e.isFree).length,
        skillLessonsLinked: totalSkillLessonsLinked
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "Exams recreated with 3 sections: Section A (75 min, 5 parts - NO QUESTIONS), Section B (English Typing - 15 min, linked to skill lessons), Section C (Hindi Typing - 15 min, linked to skill lessons). Exam 1 is FREE, Exam 2 is PAID."
    });

  } catch (error) {
    console.error("Recreate CPCT exams 1-2 error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to recreate CPCT exams 1-2" 
    }, { status: 500 });
  }
}









