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

    const { examId } = await req.json();
    const createdParts = [];
    const errors = [];

    // If examId is provided, only process that exam, otherwise process all CPCT exams
    let exams;
    if (examId) {
      const exam = await Exam.findById(examId);
      exams = exam ? [exam] : [];
    } else {
      exams = await Exam.find({ key: "CPCT" });
    }

    for (const exam of exams) {
      try {
        // Get all sections for this exam
        const sections = await Section.find({ examId: exam._id }).sort({ order: 1 });

        for (const section of sections) {
          // Check if section already has parts
          const existingParts = await Part.find({
            examId: exam._id,
            sectionId: section._id
          });

          // If no parts exist, create one
          if (existingParts.length === 0) {
            const partId = `${section.id}-part-1`;
            
            // Check if part with this ID already exists (in case of duplicates)
            const existingPart = await Part.findOne({
              examId: exam._id,
              sectionId: section._id,
              id: partId
            });

            if (!existingPart) {
              const part = await Part.create({
                id: partId,
                name: "Part 1",
                examId: exam._id,
                sectionId: section._id,
                order: 1
              });

              createdParts.push({
                examTitle: exam.title,
                sectionName: section.name,
                partId: part._id.toString()
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing exam ${exam.title}:`, error);
        errors.push({
          examId: exam._id.toString(),
          examTitle: exam.title,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added parts to ${exams.length} exam(s)`,
      createdParts: createdParts.length,
      parts: createdParts,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Add parts to exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to add parts to exams" 
    }, { status: 500 });
  }
}













