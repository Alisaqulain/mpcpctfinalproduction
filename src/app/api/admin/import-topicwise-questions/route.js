import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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
    const { topicIds } = body; // Array of topic IDs to import questions for

    // Default to first 3 topics if not specified
    const topicsToImport = topicIds || [
      "topic-computers-evolution-types",
      "topic-generations-printers",
      "topic-memory-types"
    ];

    const results = [];
    const errors = [];

    // Load questions from question bank
    let questionBank = {};
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'src', 'data', 'topicwise-questions-bank.json');
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        questionBank = JSON.parse(fileContent);
      } else {
        return NextResponse.json({ 
          error: "Question bank file not found. Please create topicwise-questions-bank.json first." 
        }, { status: 404 });
      }
    } catch (error) {
      console.error('Error loading question bank:', error);
      return NextResponse.json({ 
        error: "Failed to load question bank: " + error.message 
      }, { status: 500 });
    }

    // Import questions for each topic
    for (const topicId of topicsToImport) {
      try {
        // Find the topic
        const topic = await Topic.findOne({ topicId });
        if (!topic) {
          errors.push({ topicId, error: "Topic not found" });
          continue;
        }

        // Get questions for this topic from question bank
        const topicData = questionBank.topics?.[topicId];
        if (!topicData || !topicData.questions || topicData.questions.length === 0) {
          errors.push({ topicId, error: "No questions found in question bank" });
          continue;
        }

        // Validate and ensure exactly 100 unique questions
        let questions = topicData.questions;
        
        // Remove duplicates based on question text
        const seenQuestions = new Set();
        const uniqueQuestions = [];
        for (const q of questions) {
          const questionKey = (q.question_en || '').toLowerCase().trim();
          if (questionKey && !seenQuestions.has(questionKey)) {
            seenQuestions.add(questionKey);
            uniqueQuestions.push(q);
          }
        }

        // Ensure we have at least 100 questions
        if (uniqueQuestions.length < 100) {
          errors.push({ 
            topicId, 
            error: `Only ${uniqueQuestions.length} unique questions found. Need exactly 100 unique questions. Please add more questions to the question bank file.` 
          });
          continue;
        }

        // Take exactly 100 questions
        const finalQuestions = uniqueQuestions.slice(0, 100);

        // Delete existing questions for this topic
        await TopicWiseMCQ.deleteMany({ topicId });
        console.log(`Deleted existing questions for ${topicId}`);

        // Insert new questions (exactly 100)
        const questionsToInsert = finalQuestions.map((q, index) => ({
          id: `${topicId}-q-${index + 1}`,
          topicId: topicId,
          topicName: topic.topicName,
          topicName_hi: topic.topicName_hi || '',
          question_en: q.question_en || '',
          question_hi: q.question_hi || '',
          options_en: q.options_en || [],
          options_hi: q.options_hi || [],
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0,
          explanation_en: q.explanation_en || '',
          explanation_hi: q.explanation_hi || '',
          difficulty: q.difficulty || 'medium',
          order: index + 1,
          isFree: topic.isFree || false
        }));

        if (questionsToInsert.length === 100) {
          await TopicWiseMCQ.insertMany(questionsToInsert);
          results.push({
            topicId: topicId,
            topicName: topic.topicName,
            questionsImported: questionsToInsert.length
          });
          console.log(`✅ Imported exactly ${questionsToInsert.length} unique questions for ${topic.topicName}`);
        } else {
          errors.push({ 
            topicId, 
            error: `Failed to import: Expected 100 questions, got ${questionsToInsert.length}` 
          });
        }

      } catch (error) {
        console.error(`Error importing questions for ${topicId}:`, error);
        errors.push({ topicId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported questions for ${results.length} topic(s)`,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error importing topic-wise questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import topic-wise questions" },
      { status: 500 }
    );
  }
}

