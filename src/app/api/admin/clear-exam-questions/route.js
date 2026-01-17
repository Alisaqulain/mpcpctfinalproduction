import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Section from "@/lib/models/Section";
import Part from "@/lib/models/Part";
import Question from "@/lib/models/Question";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";

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

    const body = await req.json();
    const { examId } = body;

    if (!examId) {
      return NextResponse.json(
        { error: "Missing examId parameter" },
        { status: 400 }
      );
    }

    // Find the exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    const deletedData = {
      questions: 0,
      parts: 0,
      sections: 0,
      topicWiseMCQs: 0
    };

    // Handle Topic Wise exams differently
    if (exam.key === "CUSTOM" && exam.title && exam.title.startsWith("Topic Wise:")) {
      // For topic-wise exams, find the topic and delete its questions
      const topicName = exam.title.replace("Topic Wise: ", "").trim();
      const topic = await Topic.findOne({ topicName: topicName });
      
      if (topic) {
        const deletedMCQs = await TopicWiseMCQ.deleteMany({ topicId: topic.topicId });
        deletedData.topicWiseMCQs = deletedMCQs.deletedCount;
        console.log(`✅ Deleted ${deletedData.topicWiseMCQs} topic-wise MCQs for topic: ${topic.topicName}`);
      }
    } else {
      // For regular exams (CPCT, RSCIT, CCC), delete questions from Question collection
      const examIdStr = String(exam._id);
      
      // Find all sections for this exam
      const examSections = await Section.find({ examId: exam._id });
      deletedData.sections = examSections.length;
      
      // Delete all parts for these sections
      for (const section of examSections) {
        const sectionParts = await Part.find({ sectionId: section._id });
        deletedData.parts += sectionParts.length;
        await Part.deleteMany({ sectionId: section._id });
      }
      
      // Delete all questions for this exam (try both string and ObjectId formats)
      const examQuestions = await Question.find({ 
        $or: [
          { examId: examIdStr },
          { examId: exam._id }
        ]
      });
      deletedData.questions = examQuestions.length;
      await Question.deleteMany({ 
        $or: [
          { examId: examIdStr },
          { examId: exam._id }
        ]
      });
      
      console.log(`✅ Deleted ${deletedData.questions} questions, ${deletedData.parts} parts for exam: ${exam.title}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared all questions for exam: ${exam.title}`,
      deletedData,
      examTitle: exam.title,
      examKey: exam.key
    });

  } catch (error) {
    console.error("Error clearing exam questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear exam questions" },
      { status: 500 }
    );
  }
}









