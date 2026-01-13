import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
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

    // Section definitions for CPCT pattern
    const sections = [
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
      },
      {
        name: "English Typing",
        order: 6,
        questionRange: null, // Typing section
        questionCount: 0,
        typingTime: 15, // 15 minutes
        questionType: "TYPING"
      },
      {
        name: "Hindi Typing",
        order: 7,
        questionRange: null, // Typing section
        questionCount: 0,
        typingTime: 15, // 15 minutes
        questionType: "TYPING"
      }
    ];

    // Create 15 exams
    for (let examNum = 1; examNum <= 15; examNum++) {
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
            totalTime: 105, // 75 min main + 15 min English + 15 min Hindi
            totalQuestions: 75, // Only MCQ questions count
            isFree: examNum === 1 // First exam is free, others are paid
          });
        } else {
          // Update existing exam
          exam.totalTime = 105;
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

          if (!section) {
            section = await Section.create({
              id: sectionId,
              name: sectionData.name,
              examId: exam._id,
              lessonNumber: sectionData.order,
              order: sectionData.order,
              typingTime: sectionData.typingTime || null
            });
          } else {
            // Update existing section
            section.name = sectionData.name;
            section.order = sectionData.order;
            section.typingTime = sectionData.typingTime || null;
            await section.save();
          }

          // Create one part for each section
          const partId = `${sectionId}-part-1`;
          let part = await Part.findOne({
            examId: exam._id,
            sectionId: section._id,
            id: partId
          });

          if (!part) {
            part = await Part.create({
              id: partId,
              name: "Part 1",
              examId: exam._id,
              sectionId: section._id,
              order: 1
            });
            totalParts++;
          } else {
            // Update existing part
            part.name = "Part 1";
            part.order = 1;
            await part.save();
          }

          createdSections.push({
            id: section._id.toString(),
            name: section.name,
            order: section.order,
            questionCount: sectionData.questionCount,
            typingTime: sectionData.typingTime,
            partId: part._id.toString()
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

        console.log(`✅ Created exam ${examNum}/15: ${examTitle} (${exam.isFree ? 'FREE' : 'PAID'})`);

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
      message: `Successfully created ${createdExams.length} CPCT exams`,
      exams: createdExams,
      summary: {
        total: createdExams.length,
        free: createdExams.filter(e => e.isFree).length,
        paid: createdExams.filter(e => !e.isFree).length
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "Exams are created with sections and parts (one part per section). You can now add questions to each part through the admin panel."
    });

  } catch (error) {
    console.error("Create CPCT exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create CPCT exams" 
    }, { status: 500 });
  }
}

