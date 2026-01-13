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

    const deletedData = {
      exams: [],
      sections: 0,
      parts: 0,
      questions: 0
    };

    // Delete CPCT exam and all related data
    const cpctExam = await Exam.findOne({ key: "CPCT" });
    if (cpctExam) {
      const examId = String(cpctExam._id);
      
      // Find all sections for this exam
      const cpctSections = await Section.find({ examId: cpctExam._id });
      deletedData.sections += cpctSections.length;
      
      // Delete all parts for these sections
      for (const section of cpctSections) {
        const sectionParts = await Part.find({ sectionId: section._id });
        deletedData.parts += sectionParts.length;
        await Part.deleteMany({ sectionId: section._id });
      }
      
      // Delete all questions for this exam (try both string and ObjectId formats)
      const cpctQuestions = await Question.find({ 
        $or: [
          { examId: examId },
          { examId: cpctExam._id }
        ]
      });
      deletedData.questions += cpctQuestions.length;
      await Question.deleteMany({ 
        $or: [
          { examId: examId },
          { examId: cpctExam._id }
        ]
      });
      
      // Delete all sections
      await Section.deleteMany({ examId: cpctExam._id });
      
      // Delete the exam
      await Exam.findByIdAndDelete(cpctExam._id);
      deletedData.exams.push("CPCT");
      console.log('✅ Deleted CPCT exam and all related data');
    }

    // Delete RSCIT exam and all related data
    const rscitExam = await Exam.findOne({ key: "RSCIT" });
    if (rscitExam) {
      const examId = String(rscitExam._id);
      
      // Find all sections for this exam
      const rscitSections = await Section.find({ examId: rscitExam._id });
      deletedData.sections += rscitSections.length;
      
      // Delete all parts for these sections
      for (const section of rscitSections) {
        const sectionParts = await Part.find({ sectionId: section._id });
        deletedData.parts += sectionParts.length;
        await Part.deleteMany({ sectionId: section._id });
      }
      
      // Delete all questions for this exam (try both string and ObjectId formats)
      const rscitQuestions = await Question.find({ 
        $or: [
          { examId: examId },
          { examId: rscitExam._id }
        ]
      });
      deletedData.questions += rscitQuestions.length;
      await Question.deleteMany({ 
        $or: [
          { examId: examId },
          { examId: rscitExam._id }
        ]
      });
      
      // Delete all sections
      await Section.deleteMany({ examId: rscitExam._id });
      
      // Delete the exam
      await Exam.findByIdAndDelete(rscitExam._id);
      deletedData.exams.push("RSCIT");
      console.log('✅ Deleted RSCIT exam and all related data');
    }

    if (deletedData.exams.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No CPCT or RSCIT exams found to delete",
        deleted: deletedData
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedData.exams.join(" and ")} exam(s) and all related data`,
      deleted: deletedData
    });

  } catch (error) {
    console.error("Delete exams error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to delete exams" 
    }, { status: 500 });
  }
}

