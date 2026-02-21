import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Question from "@/lib/models/Question";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, error: "Unauthorized" };
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload.role !== "admin") return { ok: false, error: "Forbidden" };
    return { ok: true };
  } catch (e) {
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

    // Step 1: Create or find CPCT exam
    let exam = await Exam.findOne({ key: "CPCT" });
    if (!exam) {
      exam = await Exam.create({
        key: "CPCT",
        title: "Computer Proficiency Certification Test - 21st Nov 2025 Shift 2 QP1",
        totalTime: 120,
        totalQuestions: 75
      });
    } else {
      // Update if exists
      exam.title = "Computer Proficiency Certification Test - 21st Nov 2025 Shift 2 QP1";
      exam.totalTime = 120;
      exam.totalQuestions = 75;
      await exam.save();
    }

    // Step 2: Create sections
    const sections = [
      {
        name: "COMPUTER PROFICIENCY AND PROFICIENCY IN GENERAL IT SKILLS AND NETWORKING",
        sectionNumber: 1,
        order: 1
      },
      {
        name: "READING COMPREHENSION",
        sectionNumber: 2,
        order: 2
      },
      {
        name: "QUANTITATIVE APTITUDE",
        sectionNumber: 3,
        order: 3
      },
      {
        name: "GENERAL MENTAL ABILITY AND REASONING",
        sectionNumber: 4,
        order: 4
      },
      {
        name: "GENERAL AWARENESS",
        sectionNumber: 5,
        order: 5
      },
      {
        name: "English Mock Typing",
        sectionNumber: 2,
        order: 6
      },
      {
        name: "English Actual Typing",
        sectionNumber: 3,
        order: 7
      },
      {
        name: "Hindi Mock Typing",
        sectionNumber: 4,
        order: 8
      },
      {
        name: "Hindi Actual Typing",
        sectionNumber: 5,
        order: 9
      }
    ];

    const createdSections = [];
    for (const sectionData of sections) {
      const sectionId = `cpct-section-${sectionData.sectionNumber}-${sectionData.order}`;
      let section = await Section.findOne({ 
        examId: exam._id,
        id: sectionId
      });

      if (!section) {
        section = await Section.create({
          id: sectionId,
          name: sectionData.name,
          examId: exam._id,
          lessonNumber: sectionData.sectionNumber,
          order: sectionData.order
        });
      }
      createdSections.push(section);
    }

    return NextResponse.json({
      success: true,
      message: "CPCT exam and sections created successfully",
      exam: {
        _id: exam._id,
        key: exam.key,
        title: exam.title
      },
      sections: createdSections.map(s => ({
        _id: s._id,
        name: s.name,
        id: s.id
      })),
      note: "Now you can add questions to each section through the admin panel"
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to import CPCT exam data" 
    }, { status: 500 });
  }
}






