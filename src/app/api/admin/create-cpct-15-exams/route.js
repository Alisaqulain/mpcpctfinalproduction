import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import SkillLesson from "@/lib/models/SkillLesson";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
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

    const createdExams = [];
    const errors = [];
    let totalSkillLessonsLinked = 0;

    // Section definitions for CPCT pattern - NEW STRUCTURE
    // Section A: Contains all MCQ sections as PARTS
    // Section B: English Typing (15 min separate timer)
    // Section C: Hindi Typing (15 min separate timer)
    const sectionA_Parts = [
      {
        name: "IT SKILLS",
        order: 1,
        questionRange: { start: 1, end: 52 }, // 52 questions
        questionCount: 52
      },
      {
        name: "READING COMPREHENSION",
        order: 2,
        questionRange: { start: 53, end: 57 }, // 5 questions
        questionCount: 5
      },
      {
        name: "QUANTITATIVE APTITUDE",
        order: 3,
        questionRange: { start: 58, end: 63 }, // 6 questions
        questionCount: 6
      },
      {
        name: "GENERAL MENTAL ABILITY AND REASONING",
        order: 4,
        questionRange: { start: 64, end: 69 }, // 6 questions
        questionCount: 6
      },
      {
        name: "GENERAL AWARENESS",
        order: 5,
        questionRange: { start: 70, end: 75 }, // 6 questions
        questionCount: 6
      }
    ];

    // Main sections (A, B, C)
    const sections = [
      {
        name: "Section A",
        order: 1,
        questionCount: 75, // Total MCQ questions
        parts: sectionA_Parts
      },
      {
        name: "Section B",
        order: 2,
        questionCount: 0,
        typingTime: 15, // 15 minutes
        questionType: "TYPING"
      },
      {
        name: "Section C",
        order: 3,
        questionCount: 0,
        typingTime: 15, // 15 minutes
        questionType: "TYPING"
      }
    ];

    // Create 20 exams
    for (let examNum = 1; examNum <= 20; examNum++) {
      try {
        const examTitle = `CPCT Exam ${examNum}`;
        const examId = `cpct-exam-${examNum}`;
        
        // Check if exam already exists
        let exam = await Exam.findOne({ 
          key: "CPCT",
          title: examTitle
        });

        if (!exam) {
          // Create new exam
          exam = await Exam.create({
            key: "CPCT",
            title: examTitle,
            totalTime: 75, // Main exam timer for Section A (75 minutes)
            totalQuestions: 75, // Only MCQ questions count
            isFree: examNum === 1 // First exam is free, others are paid
          });
        } else {
          // Update existing exam
          exam.totalTime = 75; // Main exam timer for Section A
          exam.totalQuestions = 75;
          exam.isFree = examNum === 1;
          await exam.save();
        }

        // Create sections and parts for this exam
        const createdSections = [];
        let totalParts = 0;
        
        for (const sectionData of sections) {
          const sectionId = `${examId}-section-${sectionData.order}`;
          
          // Check if section already exists
          let section = await Section.findOne({
            examId: exam._id,
            id: sectionId
          });

          // For typing sections (Section B and C), link to skill lessons
          let skillLessonId = null;
          if (sectionData.name === "Section B" || sectionData.name === "Section C") {
            // Paper 1 -> Lesson 1, Paper 2 -> Lesson 2, etc.
            const lessonOrder = examNum;
            const language = sectionData.name === "Section B" ? "English" : "Hindi";
            
            // Find the skill lesson with matching order and language
            // Try multiple query patterns to find the lesson
            let skillLesson = await SkillLesson.findOne({
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
            
            if (skillLesson) {
              skillLessonId = skillLesson.id || skillLesson._id?.toString();
              totalSkillLessonsLinked++;
              console.log(`  ✅ Linked ${sectionData.name} to ${language} Skill Lesson ${lessonOrder} (ID: ${skillLessonId})`);
            } else {
              // Log available skill lessons for debugging
              const availableLessons = await SkillLesson.find({ language: language }).sort({ order: 1 }).limit(5);
              console.log(`  ⚠️ Warning: ${language} Skill Lesson with order ${lessonOrder} not found for ${sectionData.name}`);
              console.log(`  📋 Available ${language} lessons (first 5):`, availableLessons.map(l => ({ order: l.order, id: l.id, title: l.title })));
            }
          }

          if (!section) {
            section = await Section.create({
              id: sectionId,
              name: sectionData.name,
              examId: exam._id,
              lessonNumber: sectionData.order,
              order: sectionData.order,
              typingTime: sectionData.typingTime || null,
              skillLessonId: skillLessonId
            });
          } else {
            // Update existing section
            section.name = sectionData.name;
            section.order = sectionData.order;
            section.typingTime = sectionData.typingTime || null;
            section.skillLessonId = skillLessonId;
            await section.save();
          }

          // For Section A, create multiple parts (one for each MCQ section)
          // For Section B and C (typing sections), no parts needed
          if (sectionData.parts && sectionData.parts.length > 0) {
            // Section A: Create parts for each MCQ section
            for (const partData of sectionData.parts) {
              const partId = `${sectionId}-part-${partData.order}`;
              let part = await Part.findOne({
                examId: exam._id,
                sectionId: section._id,
                id: partId
              });

              if (!part) {
                part = await Part.create({
                  id: partId,
                  name: partData.name,
                  examId: exam._id,
                  sectionId: section._id,
                  order: partData.order
                });
                totalParts++;
              } else {
                // Update existing part
                part.name = partData.name;
                part.order = partData.order;
                await part.save();
              }
            }
          } else {
            // Section B or C (typing sections): Create one part
            const partId = `${sectionId}-part-1`;
            let part = await Part.findOne({
              examId: exam._id,
              sectionId: section._id,
              id: partId
            });

            if (!part) {
              part = await Part.create({
                id: partId,
                name: sectionData.name === "Section B" ? "English Typing" : "Hindi Typing",
                examId: exam._id,
                sectionId: section._id,
                order: 1
              });
              totalParts++;
            } else {
              // Update existing part
              part.name = sectionData.name === "Section B" ? "English Typing" : "Hindi Typing";
              part.order = 1;
              await part.save();
            }
          }

          createdSections.push({
            id: section._id.toString(),
            name: section.name,
            order: section.order,
            questionCount: sectionData.questionCount,
            typingTime: sectionData.typingTime,
            partsCount: sectionData.parts ? sectionData.parts.length : 1
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

        console.log(`✅ Created exam ${examNum}/20: ${examTitle} (${exam.isFree ? 'FREE' : 'PAID'})`);

      } catch (error) {
        console.error(`❌ Error creating exam ${examNum}:`, error);
        errors.push({
          examNum,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdExams.length} CPCT exams (20 total)`,
      exams: createdExams,
      summary: {
        total: createdExams.length,
        free: createdExams.filter(e => e.isFree).length,
        paid: createdExams.filter(e => !e.isFree).length,
        skillLessonsLinked: totalSkillLessonsLinked
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "Exams are created with 3 sections: Section A (with 5 parts for MCQ sections), Section B (English Typing - 15 min), Section C (Hindi Typing - 15 min). Main exam timer is 75 minutes for Section A. Typing sections have separate 15-minute timers."
    });

  } catch (error) {
    console.error("Create CPCT exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create CPCT exams" 
    }, { status: 500 });
  }
}

