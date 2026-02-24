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

    // Create or find CPCT exam
    let exam = await Exam.findOne({ key: "CPCT" });
    if (!exam) {
      exam = await Exam.create({
        key: "CPCT",
        title: "Computer Proficiency Certification Test",
        totalTime: 120,
        totalQuestions: 90 // Section 1: 30 (15+15) + Section 2: 30 (15+15) + Section 3: 30 (15+15) = 90
      });
    } else {
      // Update existing exam
      exam.totalTime = 120;
      exam.totalQuestions = 90;
      await exam.save();
    }

    let totalQuestionsCreated = 0;
    const createdSections = [];

    // Section 1: 2 parts with 15 questions each
    const section1Id = `cpct-section-1-30q`;
    let section1 = await Section.findOne({
      examId: exam._id,
      id: section1Id
    });

    if (!section1) {
      section1 = await Section.create({
        id: section1Id,
        name: "Section 1 - Computer Proficiency",
        examId: exam._id,
        lessonNumber: 1,
        order: 1
      });
    }
    createdSections.push(section1);

    // Create Part 1 with 15 questions
    const section1Part1Id = `cpct-section-1-part-1`;
    let section1Part1 = await Part.findOne({
      examId: exam._id,
      sectionId: section1._id,
      id: section1Part1Id
    });

    if (!section1Part1) {
      section1Part1 = await Part.create({
        id: section1Part1Id,
        name: "Part 1",
        examId: exam._id,
        sectionId: section1._id,
        order: 1
      });
    }

    // Create 15 questions for Section 1 Part 1
    for (let qIndex = 0; qIndex < 15; qIndex++) {
      totalQuestionsCreated++;
      const questionId = `cpct-s1-p1-q-${qIndex + 1}`;
      
      const questionExists = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(section1._id),
        partId: String(section1Part1._id),
        id: questionId
      });

      if (!questionExists) {
        await Question.create({
          id: questionId,
          examId: String(exam._id),
          sectionId: String(section1._id),
          partId: String(section1Part1._id),
          questionNumber: totalQuestionsCreated,
          questionType: "MCQ",
          question_en: `Section 1 - Part 1 - Question ${qIndex + 1}: What is the correct answer?`,
          question_hi: `अनुभाग 1 - भाग 1 - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
          options_en: [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          options_hi: [
            "विकल्प A",
            "विकल्प B",
            "विकल्प C",
            "विकल्प D"
          ],
          correctAnswer: 0,
          marks: 1,
          negativeMarks: 0
        });
      }
    }

    // Create Part 2 with 15 questions
    const section1Part2Id = `cpct-section-1-part-2`;
    let section1Part2 = await Part.findOne({
      examId: exam._id,
      sectionId: section1._id,
      id: section1Part2Id
    });

    if (!section1Part2) {
      section1Part2 = await Part.create({
        id: section1Part2Id,
        name: "Part 2",
        examId: exam._id,
        sectionId: section1._id,
        order: 2
      });
    }

    // Create 15 questions for Section 1 Part 2
    for (let qIndex = 0; qIndex < 15; qIndex++) {
      totalQuestionsCreated++;
      const questionId = `cpct-s1-p2-q-${qIndex + 1}`;
      
      const questionExists = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(section1._id),
        partId: String(section1Part2._id),
        id: questionId
      });

      if (!questionExists) {
        await Question.create({
          id: questionId,
          examId: String(exam._id),
          sectionId: String(section1._id),
          partId: String(section1Part2._id),
          questionNumber: totalQuestionsCreated,
          questionType: "MCQ",
          question_en: `Section 1 - Part 2 - Question ${qIndex + 1}: What is the correct answer?`,
          question_hi: `अनुभाग 1 - भाग 2 - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
          options_en: [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          options_hi: [
            "विकल्प A",
            "विकल्प B",
            "विकल्प C",
            "विकल्प D"
          ],
          correctAnswer: 0,
          marks: 1,
          negativeMarks: 0
        });
      }
    }

    // Section 2: 2 parts with 15 questions each
    const section2Id = `cpct-section-2-30q`;
    let section2 = await Section.findOne({
      examId: exam._id,
      id: section2Id
    });

    if (!section2) {
      section2 = await Section.create({
        id: section2Id,
        name: "Section 2 - Reading Comprehension",
        examId: exam._id,
        lessonNumber: 2,
        order: 2
      });
    }
    createdSections.push(section2);

    // Create Part 1 with 15 questions
    const part1Id = `cpct-section-2-part-1`;
    let part1 = await Part.findOne({
      examId: exam._id,
      sectionId: section2._id,
      id: part1Id
    });

    if (!part1) {
      part1 = await Part.create({
        id: part1Id,
        name: "Part 1",
        examId: exam._id,
        sectionId: section2._id,
        order: 1
      });
    }

    // Create 15 questions for Part 1
    for (let qIndex = 0; qIndex < 15; qIndex++) {
      totalQuestionsCreated++;
      const questionId = `cpct-s2-p1-q-${qIndex + 1}`;
      
      const questionExists = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(section2._id),
        partId: String(part1._id),
        id: questionId
      });

      if (!questionExists) {
        await Question.create({
          id: questionId,
          examId: String(exam._id),
          sectionId: String(section2._id),
          partId: String(part1._id),
          questionNumber: totalQuestionsCreated,
          questionType: "MCQ",
          question_en: `Section 2 - Part 1 - Question ${qIndex + 1}: What is the correct answer?`,
          question_hi: `अनुभाग 2 - भाग 1 - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
          options_en: [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          options_hi: [
            "विकल्प A",
            "विकल्प B",
            "विकल्प C",
            "विकल्प D"
          ],
          correctAnswer: 0,
          marks: 1,
          negativeMarks: 0
        });
      }
    }

    // Create Part 2 with 15 questions
    const part2Id = `cpct-section-2-part-2`;
    let part2 = await Part.findOne({
      examId: exam._id,
      sectionId: section2._id,
      id: part2Id
    });

    if (!part2) {
      part2 = await Part.create({
        id: part2Id,
        name: "Part 2",
        examId: exam._id,
        sectionId: section2._id,
        order: 2
      });
    }

    // Create 15 questions for Part 2
    for (let qIndex = 0; qIndex < 15; qIndex++) {
      totalQuestionsCreated++;
      const questionId = `cpct-s2-p2-q-${qIndex + 1}`;
      
      const questionExists = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(section2._id),
        partId: String(part2._id),
        id: questionId
      });

      if (!questionExists) {
        await Question.create({
          id: questionId,
          examId: String(exam._id),
          sectionId: String(section2._id),
          partId: String(part2._id),
          questionNumber: totalQuestionsCreated,
          questionType: "MCQ",
          question_en: `Section 2 - Part 2 - Question ${qIndex + 1}: What is the correct answer?`,
          question_hi: `अनुभाग 2 - भाग 2 - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
          options_en: [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          options_hi: [
            "विकल्प A",
            "विकल्प B",
            "विकल्प C",
            "विकल्प D"
          ],
          correctAnswer: 0,
          marks: 1,
          negativeMarks: 0
        });
      }
    }

    // Section 3: 2 parts with 15 questions each
    const section3Id = `cpct-section-3-30q`;
    let section3 = await Section.findOne({
      examId: exam._id,
      id: section3Id
    });

    if (!section3) {
      section3 = await Section.create({
        id: section3Id,
        name: "Section 3 - Quantitative Aptitude",
        examId: exam._id,
        lessonNumber: 3,
        order: 3
      });
    }
    createdSections.push(section3);

    // Create Part 1 with 15 questions
    const section3Part1Id = `cpct-section-3-part-1`;
    let section3Part1 = await Part.findOne({
      examId: exam._id,
      sectionId: section3._id,
      id: section3Part1Id
    });

    if (!section3Part1) {
      section3Part1 = await Part.create({
        id: section3Part1Id,
        name: "Part 1",
        examId: exam._id,
        sectionId: section3._id,
        order: 1
      });
    }

    // Create 15 questions for Section 3 Part 1
    for (let qIndex = 0; qIndex < 15; qIndex++) {
      totalQuestionsCreated++;
      const questionId = `cpct-s3-p1-q-${qIndex + 1}`;
      
      const questionExists = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(section3._id),
        partId: String(section3Part1._id),
        id: questionId
      });

      if (!questionExists) {
        await Question.create({
          id: questionId,
          examId: String(exam._id),
          sectionId: String(section3._id),
          partId: String(section3Part1._id),
          questionNumber: totalQuestionsCreated,
          questionType: "MCQ",
          question_en: `Section 3 - Part 1 - Question ${qIndex + 1}: What is the correct answer?`,
          question_hi: `अनुभाग 3 - भाग 1 - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
          options_en: [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          options_hi: [
            "विकल्प A",
            "विकल्प B",
            "विकल्प C",
            "विकल्प D"
          ],
          correctAnswer: 0,
          marks: 1,
          negativeMarks: 0
        });
      }
    }

    // Create Part 2 with 15 questions
    const section3Part2Id = `cpct-section-3-part-2`;
    let section3Part2 = await Part.findOne({
      examId: exam._id,
      sectionId: section3._id,
      id: section3Part2Id
    });

    if (!section3Part2) {
      section3Part2 = await Part.create({
        id: section3Part2Id,
        name: "Part 2",
        examId: exam._id,
        sectionId: section3._id,
        order: 2
      });
    }

    // Create 15 questions for Section 3 Part 2
    for (let qIndex = 0; qIndex < 15; qIndex++) {
      totalQuestionsCreated++;
      const questionId = `cpct-s3-p2-q-${qIndex + 1}`;
      
      const questionExists = await Question.findOne({
        examId: String(exam._id),
        sectionId: String(section3._id),
        partId: String(section3Part2._id),
        id: questionId
      });

      if (!questionExists) {
        await Question.create({
          id: questionId,
          examId: String(exam._id),
          sectionId: String(section3._id),
          partId: String(section3Part2._id),
          questionNumber: totalQuestionsCreated,
          questionType: "MCQ",
          question_en: `Section 3 - Part 2 - Question ${qIndex + 1}: What is the correct answer?`,
          question_hi: `अनुभाग 3 - भाग 2 - प्रश्न ${qIndex + 1}: सही उत्तर क्या है?`,
          options_en: [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
          ],
          options_hi: [
            "विकल्प A",
            "विकल्प B",
            "विकल्प C",
            "विकल्प D"
          ],
          correctAnswer: 0,
          marks: 1,
          negativeMarks: 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "CPCT exam created successfully with 3 sections, each with 2 parts (15 questions each) = 90 questions total",
      exam: {
        _id: exam._id,
        key: exam.key,
        title: exam.title,
        totalTime: exam.totalTime,
        totalQuestions: exam.totalQuestions
      },
      structure: {
        section1: {
          name: "Section 1 - Computer Proficiency",
          questions: 30,
          parts: 2,
          part1: { name: "Part 1", questions: 15 },
          part2: { name: "Part 2", questions: 15 }
        },
        section2: {
          name: "Section 2 - Reading Comprehension",
          questions: 30,
          parts: 2,
          part1: { name: "Part 1", questions: 15 },
          part2: { name: "Part 2", questions: 15 }
        },
        section3: {
          name: "Section 3 - Quantitative Aptitude",
          questions: 30,
          parts: 2,
          part1: { name: "Part 1", questions: 15 },
          part2: { name: "Part 2", questions: 15 }
        }
      },
      totalQuestions: totalQuestionsCreated,
      sectionsCreated: createdSections.length
    });

  } catch (error) {
    console.error("Create CPCT exam error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create CPCT exam" 
    }, { status: 500 });
  }
}

