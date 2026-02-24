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

export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    // Get part names from actual exam structure (Section A parts)
    const cpctExams = await Exam.find({ key: "CPCT" }).limit(1); // Just need one exam to get part structure
    
    let examPartNames = [];
    if (cpctExams.length > 0) {
      const exam = cpctExams[0];
      // Get Section A (MCQ section)
      const sectionA = await Section.findOne({ 
        examId: exam._id,
        name: { $in: ["Section A", "CPCT MCQ", "Section 1 (CPCT MCQ)"] }
      });
      
      if (sectionA) {
        const parts = await Part.find({ sectionId: sectionA._id }).sort({ order: 1 });
        examPartNames = parts.map(p => p.name);
      }
    }

    // Get all unique part names from CPCT question bank
    const bankPartNames = await Question.distinct("partName", {
      examId: "CPCT_QUESTION_BANK",
      partName: { $exists: true, $ne: null, $ne: "" }
    });

    // Combine exam parts and bank parts, remove duplicates
    const allPartNames = [...new Set([...examPartNames, ...bankPartNames])];

    // Get count of questions per part from question bank using direct count
    // This is more reliable than aggregation
    const questionCounts = [];
    
    // Get all unique part names that have questions
    const distinctPartNames = await Question.distinct("partName", {
      examId: "CPCT_QUESTION_BANK",
      partName: { $exists: true, $ne: null, $ne: "" }
    });
    
    // Count questions for each part name
    for (const partName of distinctPartNames) {
      const count = await Question.countDocuments({
        examId: "CPCT_QUESTION_BANK",
        partName: partName
      });
      questionCounts.push({
        _id: partName,
        count: count
      });
    }
    
    // Debug: Log the counts
    console.log("Question counts by partName:", JSON.stringify(questionCounts, null, 2));
    console.log("Distinct part names found:", distinctPartNames);

    // Create part names with counts, prioritizing exam parts order
    // Normalize part names for matching (trim and case-insensitive)
    const normalizedCounts = questionCounts.map(c => ({
      original: c._id,
      normalized: (c._id || '').trim().toUpperCase(),
      count: c.count
    }));
    
    const partNamesWithCounts = allPartNames.map(name => {
      const normalizedName = (name || '').trim().toUpperCase();
      const countData = normalizedCounts.find(c => c.normalized === normalizedName);
      const isFromExam = examPartNames.includes(name);
      return {
        name: name,
        count: countData ? countData.count : 0,
        isFromExam: isFromExam
      };
    });

    // Sort: exam parts first, then bank parts
    partNamesWithCounts.sort((a, b) => {
      if (a.isFromExam && !b.isFromExam) return -1;
      if (!a.isFromExam && b.isFromExam) return 1;
      return a.name.localeCompare(b.name);
    });

    // Get total questions in bank
    const totalQuestions = await Question.countDocuments({
      examId: "CPCT_QUESTION_BANK"
    });
    
    // Debug: Get a sample of questions to verify partName is saved
    const sampleQuestions = await Question.find({
      examId: "CPCT_QUESTION_BANK"
    }).limit(5).select("partName question_en");
    
    console.log("Sample questions from bank:", JSON.stringify(sampleQuestions.map(q => ({
      partName: q.partName,
      hasQuestion: !!q.question_en
    })), null, 2));
    
    // Also do a direct count for "IT SKILLS" to verify
    const itSkillsCount = await Question.countDocuments({
      examId: "CPCT_QUESTION_BANK",
      partName: "IT SKILLS"
    });
    console.log(`Direct count for "IT SKILLS": ${itSkillsCount}`);

    return NextResponse.json({
      success: true,
      partNames: partNamesWithCounts,
      totalQuestions: totalQuestions,
      examPartNames: examPartNames
    });

  } catch (error) {
    console.error("Error getting CPCT part names:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get part names" },
      { status: 500 }
    );
  }
}

