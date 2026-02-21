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

    const deletedData = {
      exams: [],
      sections: 0,
      parts: 0,
      questions: 0
    };

    // Find ALL RSCIT exams (there might be multiple like RSCIT Exam 1, RSCIT Exam 2, etc.)
    const rscitExams = await Exam.find({ key: "RSCIT" });
    
    if (rscitExams.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No RSCIT exams found to delete",
        deleted: deletedData
      });
    }

    console.log(`🗑️ Found ${rscitExams.length} RSCIT exam(s) to delete`);

    // Delete each RSCIT exam and all related data
    for (const exam of rscitExams) {
      const examId = String(exam._id);
      console.log(`🗑️ Deleting RSCIT exam: ${exam.title} (ID: ${examId})`);
      
      // Find all sections for this exam
      const examSections = await Section.find({ examId: exam._id });
      deletedData.sections += examSections.length;
      console.log(`  - Found ${examSections.length} sections`);
      
      // Delete all parts for these sections
      for (const section of examSections) {
        const sectionParts = await Part.find({ sectionId: section._id });
        deletedData.parts += sectionParts.length;
        await Part.deleteMany({ sectionId: section._id });
        console.log(`  - Deleted ${sectionParts.length} parts for section: ${section.name}`);
      }
      
      // Delete all questions for this exam (try both string and ObjectId formats)
      const examQuestions = await Question.find({ 
        $or: [
          { examId: examId },
          { examId: exam._id }
        ]
      });
      deletedData.questions += examQuestions.length;
      await Question.deleteMany({ 
        $or: [
          { examId: examId },
          { examId: exam._id }
        ]
      });
      console.log(`  - Deleted ${examQuestions.length} questions`);
      
      // Delete all sections for this exam
      await Section.deleteMany({ examId: exam._id });
      
      // Delete the exam
      await Exam.findByIdAndDelete(exam._id);
      deletedData.exams.push(exam.title);
      console.log(`✅ Deleted RSCIT exam: ${exam.title}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedData.exams.length} RSCIT exam(s) and all related data`,
      deleted: {
        exams: deletedData.exams.length,
        examTitles: deletedData.exams,
        sections: deletedData.sections,
        parts: deletedData.parts,
        questions: deletedData.questions
      }
    });

  } catch (error) {
    console.error("Delete all RSCIT exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to delete RSCIT exams" 
    }, { status: 500 });
  }
}



















