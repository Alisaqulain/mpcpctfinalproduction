import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
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

    // Get all CPCT exams
    const exams = await Exam.find({ key: "CPCT" });
    
    const results = {
      examsProcessed: 0,
      sectionsUpdated: 0,
      partsUpdated: 0,
      errors: []
    };

    for (const exam of exams) {
      try {
        // Find all sections for this exam
        const sections = await Section.find({ examId: exam._id });
        
        for (const section of sections) {
          let updated = false;
          
          // Update section names
          if (section.name === "Section A" || section.name === "Section 1 (CPCT MCQ)") {
            section.name = "CPCT MCQ";
            await section.save();
            updated = true;
            results.sectionsUpdated++;
            
            // Also update "IT SKILLS" part to "IT Skills & Networking"
            const parts = await Part.find({ sectionId: section._id });
            for (const part of parts) {
              if (part.name === "IT SKILLS") {
                part.name = "IT Skills & Networking";
                await part.save();
                results.partsUpdated++;
              }
            }
          } else if (section.name === "Section B" || section.name === "Section 2 (English Typing)") {
            section.name = "English Typing";
            await section.save();
            updated = true;
            results.sectionsUpdated++;
          } else if (section.name === "Section C" || section.name === "Section 3 (Hindi Typing)") {
            section.name = "Hindi Typing";
            await section.save();
            updated = true;
            results.sectionsUpdated++;
          }
        }
        
        if (sections.length > 0) {
          results.examsProcessed++;
        }
      } catch (error) {
        results.errors.push({
          exam: exam.title || exam._id,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${results.sectionsUpdated} sections and ${results.partsUpdated} parts across ${results.examsProcessed} exams`,
      results
    });
  } catch (error) {
    console.error('Error updating CPCT section names:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

