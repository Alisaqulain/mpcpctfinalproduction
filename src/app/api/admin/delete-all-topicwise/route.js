import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";
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

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    }

    await dbConnect();

    const deletedData = {
      topicWiseMCQs: 0,
      topics: 0,
      exams: 0,
      sections: 0,
      parts: 0,
      questions: 0
    };

    // 1. Delete all Topic Wise MCQ questions
    console.log("🗑️ Deleting all Topic Wise MCQ questions...");
    const topicWiseMCQsResult = await TopicWiseMCQ.deleteMany({});
    deletedData.topicWiseMCQs = topicWiseMCQsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.topicWiseMCQs} topic wise MCQs`);

    // 2. Delete all Topics
    console.log("🗑️ Deleting all Topics...");
    const topicsResult = await Topic.deleteMany({});
    deletedData.topics = topicsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.topics} topics`);

    // 3. Find and delete all topic-wise exams (key="CUSTOM" with title starting with "Topic Wise:")
    console.log("🗑️ Deleting all Topic Wise Exams...");
    const topicWiseExams = await Exam.find({
      key: "CUSTOM",
      title: { $regex: /^Topic Wise:/i }
    });

    deletedData.exams = topicWiseExams.length;

    for (const exam of topicWiseExams) {
      const examId = String(exam._id);
      
      // Find all sections for this exam
      const examSections = await Section.find({ examId: exam._id });
      deletedData.sections += examSections.length;
      
      // Delete all parts for these sections
      for (const section of examSections) {
        const sectionParts = await Part.find({ sectionId: section._id });
        deletedData.parts += sectionParts.length;
        await Part.deleteMany({ sectionId: section._id });
      }
      
      // Delete all questions for this exam
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
      
      // Delete all sections for this exam
      await Section.deleteMany({ examId: exam._id });
    }
    
    // Delete all topic-wise exams
    await Exam.deleteMany({
      key: "CUSTOM",
      title: { $regex: /^Topic Wise:/i }
    });
    console.log(`✅ Deleted ${deletedData.exams} topic-wise exams, ${deletedData.sections} sections, ${deletedData.parts} parts, ${deletedData.questions} questions`);

    return NextResponse.json({
      success: true,
      message: "All topic-wise questions and papers deleted successfully",
      deletedData
    });

  } catch (error) {
    console.error("Error deleting all topic-wise data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete topic-wise data" },
      { status: 500 }
    );
  }
}



