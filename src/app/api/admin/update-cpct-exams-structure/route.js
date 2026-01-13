import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import Question from "@/lib/models/Question";
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

    const updatedExams = [];
    const errors = [];

    // Section definitions for CPCT pattern - NEW STRUCTURE
    const sectionA_Parts = [
      {
        name: "IT SKILLS",
        order: 1,
        questionRange: { start: 1, end: 52 },
        questionCount: 52
      },
      {
        name: "READING COMPREHENSION",
        order: 2,
        questionRange: { start: 53, end: 57 },
        questionCount: 5
      },
      {
        name: "QUANTITATIVE APTITUDE",
        order: 3,
        questionRange: { start: 58, end: 63 },
        questionCount: 6
      },
      {
        name: "GENERAL MENTAL ABILITY AND REASONING",
        order: 4,
        questionRange: { start: 64, end: 69 },
        questionCount: 6
      },
      {
        name: "GENERAL AWARENESS",
        order: 5,
        questionRange: { start: 70, end: 75 },
        questionCount: 6
      }
    ];

    // Main sections (A, B, C)
    const sections = [
      {
        name: "Section A",
        order: 1,
        questionCount: 75,
        parts: sectionA_Parts
      },
      {
        name: "Section B",
        order: 2,
        questionCount: 0,
        typingTime: 15,
        questionType: "TYPING"
      },
      {
        name: "Section C",
        order: 3,
        questionCount: 0,
        typingTime: 15,
        questionType: "TYPING"
      }
    ];

    // Get all CPCT exams
    const exams = await Exam.find({ key: "CPCT" }).sort({ title: 1 });

    for (const exam of exams) {
      try {
        const examId = `cpct-exam-${exam.title.match(/\d+$/)?.[0] || '1'}`;

        // Update exam timing
        exam.totalTime = 75; // Main exam timer for Section A
        exam.totalQuestions = 75;
        await exam.save();

        // Get all existing sections and questions for migration
        const existingSections = await Section.find({ examId: exam._id });
        const existingQuestions = await Question.find({
          $or: [
            { examId: String(exam._id) },
            { examId: exam._id }
          ]
        });

        // Create a mapping of old section IDs to section names for question migration
        const oldSectionIdToName = {};
        for (const oldSection of existingSections) {
          oldSectionIdToName[String(oldSection._id)] = oldSection.name;
          oldSectionIdToName[oldSection._id.toString()] = oldSection.name;
        }

        // Delete all existing sections and parts (questions will be preserved temporarily)
        for (const oldSection of existingSections) {
          await Part.deleteMany({ sectionId: oldSection._id });
        }
        await Section.deleteMany({ examId: exam._id });

        // Create new sections and parts
        const createdSections = [];
        let totalParts = 0;

        for (const sectionData of sections) {
          const sectionId = `${examId}-section-${sectionData.order}`;

          // Create new section
          const section = await Section.create({
            id: sectionId,
            name: sectionData.name,
            examId: exam._id,
            lessonNumber: sectionData.order,
            order: sectionData.order,
            typingTime: sectionData.typingTime || null
          });

          // For Section A, create multiple parts (one for each MCQ section)
          // For Section B and C (typing sections), create one part
          if (sectionData.parts && sectionData.parts.length > 0) {
            // Section A: Create parts for each MCQ section
            for (const partData of sectionData.parts) {
              const partId = `${sectionId}-part-${partData.order}`;
              const part = await Part.create({
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
            const part = await Part.create({
              id: partId,
              name: sectionData.name === "Section B" ? "English Typing" : "Hindi Typing",
              examId: exam._id,
              sectionId: section._id,
              order: 1
            });
            totalParts++;
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

        // Migrate questions to new structure
        let migratedQuestions = 0;
        for (const question of existingQuestions) {
          // Get old section name from sectionId
          const oldSectionId = String(question.sectionId);
          const oldSectionName = oldSectionIdToName[oldSectionId] || "";
          
          // Find matching new section and part
          let targetSection = null;
          let targetPart = null;

          if (oldSectionName === "IT SKILLS" || oldSectionName === "READING COMPREHENSION" || 
              oldSectionName === "QUANTITATIVE APTITUDE" || oldSectionName === "GENERAL MENTAL ABILITY AND REASONING" ||
              oldSectionName === "GENERAL AWARENESS") {
            // These go to Section A
            const sectionA = await Section.findOne({ examId: exam._id, name: "Section A" });
            if (sectionA) {
              const matchingPart = sectionA_Parts.find(p => p.name === oldSectionName);
              if (matchingPart) {
                targetPart = await Part.findOne({
                  examId: exam._id,
                  sectionId: sectionA._id,
                  order: matchingPart.order
                });
                targetSection = sectionA;
              }
            }
          } else if (oldSectionName === "English Typing") {
            // Goes to Section B
            const sectionB = await Section.findOne({ examId: exam._id, name: "Section B" });
            if (sectionB) {
              targetPart = await Part.findOne({
                examId: exam._id,
                sectionId: sectionB._id,
                order: 1
              });
              targetSection = sectionB;
            }
          } else if (oldSectionName === "Hindi Typing") {
            // Goes to Section C
            const sectionC = await Section.findOne({ examId: exam._id, name: "Section C" });
            if (sectionC) {
              targetPart = await Part.findOne({
                examId: exam._id,
                sectionId: sectionC._id,
                order: 1
              });
              targetSection = sectionC;
            }
          }

          if (targetSection && targetPart) {
            // Update question with new section and part IDs
            question.examId = String(exam._id);
            question.sectionId = String(targetSection._id);
            question.partId = String(targetPart._id);
            await question.save();
            migratedQuestions++;
          } else {
            // If we can't match, delete the question
            await Question.deleteOne({ _id: question._id });
          }
        }

        updatedExams.push({
          examId: exam._id.toString(),
          title: exam.title,
          isFree: exam.isFree,
          sections: createdSections.length,
          parts: totalParts,
          migratedQuestions: migratedQuestions,
          totalTime: exam.totalTime,
          totalQuestions: exam.totalQuestions
        });

        console.log(`✅ Updated exam: ${exam.title} (${migratedQuestions} questions migrated)`);

      } catch (error) {
        console.error(`❌ Error updating exam ${exam.title}:`, error);
        errors.push({
          examTitle: exam.title,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedExams.length} CPCT exams to new structure`,
      exams: updatedExams,
      summary: {
        total: updatedExams.length,
        free: updatedExams.filter(e => e.isFree).length,
        paid: updatedExams.filter(e => !e.isFree).length,
        totalMigratedQuestions: updatedExams.reduce((sum, e) => sum + (e.migratedQuestions || 0), 0)
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "All exams now have 3 sections: Section A (with 5 parts for MCQ sections), Section B (English Typing - 15 min), Section C (Hindi Typing - 15 min). Questions have been migrated to the new structure where possible."
    });

  } catch (error) {
    console.error("Update CPCT exams structure error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to update CPCT exams structure" 
    }, { status: 500 });
  }
}

