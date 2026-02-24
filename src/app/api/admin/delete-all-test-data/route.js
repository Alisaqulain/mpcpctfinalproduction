import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { jwtVerify } from "jose";

// Import all models
import SkillLesson from "@/lib/models/SkillLesson";
import SkillTestExercise from "@/lib/models/SkillTestExercise";
import SkillTestExam from "@/lib/models/SkillTestExam";
import Lesson from "@/lib/models/Lesson";
import Section from "@/lib/models/Section";
import CharacterLesson from "@/lib/models/CharacterLesson";
import Exam from "@/lib/models/Exam";
import Question from "@/lib/models/Question";
import Part from "@/lib/models/Part";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";

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
      skillLessons: 0,
      skillTestExercises: 0,
      skillTestExams: 0,
      learningLessons: 0,
      learningSections: 0,
      characterLessons: 0,
      exams: 0,
      questions: 0,
      parts: 0,
      examSections: 0,
      topicWiseMCQs: 0,
      topics: 0
    };

    // 1. Delete all Skill Test data
    console.log("🗑️ Deleting Skill Test data...");
    const skillLessonsResult = await SkillLesson.deleteMany({});
    deletedData.skillLessons = skillLessonsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.skillLessons} skill lessons`);

    const skillExercisesResult = await SkillTestExercise.deleteMany({});
    deletedData.skillTestExercises = skillExercisesResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.skillTestExercises} skill test exercises`);

    const skillExamsResult = await SkillTestExam.deleteMany({});
    deletedData.skillTestExams = skillExamsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.skillTestExams} skill test exams`);

    // 2. Delete all Learning data
    console.log("🗑️ Deleting Learning data...");
    const learningLessonsResult = await Lesson.deleteMany({});
    deletedData.learningLessons = learningLessonsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.learningLessons} learning lessons`);

    // Delete learning sections (sections without examId or with null examId)
    const learningSectionsResult = await Section.deleteMany({ 
      $or: [
        { examId: { $exists: false } },
        { examId: null }
      ]
    });
    deletedData.learningSections = learningSectionsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.learningSections} learning sections`);

    const characterLessonsResult = await CharacterLesson.deleteMany({});
    deletedData.characterLessons = characterLessonsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.characterLessons} character lessons`);

    // 3. Delete all Exam data
    console.log("🗑️ Deleting Exam data...");
    
    // First, get all exams to delete their related data
    const allExams = await Exam.find({});
    deletedData.exams = allExams.length;

    for (const exam of allExams) {
      const examId = String(exam._id);
      
      // Delete all sections for this exam
      const examSections = await Section.find({ examId: exam._id });
      deletedData.examSections += examSections.length;
      
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
    
    // Delete all exams
    await Exam.deleteMany({});
    console.log(`✅ Deleted ${deletedData.exams} exams, ${deletedData.examSections} sections, ${deletedData.parts} parts, ${deletedData.questions} questions`);

    // 4. Delete all Topic Wise data
    console.log("🗑️ Deleting Topic Wise data...");
    const topicWiseMCQsResult = await TopicWiseMCQ.deleteMany({});
    deletedData.topicWiseMCQs = topicWiseMCQsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.topicWiseMCQs} topic wise MCQs`);

    const topicsResult = await Topic.deleteMany({});
    deletedData.topics = topicsResult.deletedCount;
    console.log(`✅ Deleted ${deletedData.topics} topics`);

    const totalDeleted = 
      deletedData.skillLessons +
      deletedData.skillTestExercises +
      deletedData.skillTestExams +
      deletedData.learningLessons +
      deletedData.learningSections +
      deletedData.characterLessons +
      deletedData.exams +
      deletedData.questions +
      deletedData.parts +
      deletedData.examSections +
      deletedData.topicWiseMCQs +
      deletedData.topics;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all test data! Total: ${totalDeleted} items deleted.`,
      deleted: deletedData
    });

  } catch (error) {
    console.error("Delete all test data error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to delete test data" 
    }, { status: 500 });
  }
}

