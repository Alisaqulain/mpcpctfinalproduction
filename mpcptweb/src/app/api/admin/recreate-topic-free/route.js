import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";
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
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();

    const topicName = "Computers and their evolution and types";
    const topicName_hi = "कंप्यूटर और उनका विकास और प्रकार";
    const topicId = "topic-computers-evolution-types";

    // Get the earliest createdAt from all topics BEFORE deleting to ensure this one is on top
    const allTopics = await Topic.find({}).sort({ createdAt: 1 }).limit(1);
    let earliestDate = new Date('2020-01-01'); // Default early date
    
    if (allTopics.length > 0 && allTopics[0].createdAt) {
      // Set createdAt to 1 day before the earliest topic
      earliestDate = new Date(allTopics[0].createdAt);
      earliestDate.setDate(earliestDate.getDate() - 1);
    }

    // Find and delete existing topic if it exists
    const existingTopic = await Topic.findOne({ 
      $or: [
        { topicId: topicId },
        { topicName: topicName },
        { topicName: { $regex: /computers and their evolution/i } }
      ]
    });

    if (existingTopic) {
      // Delete all questions for this topic
      const deletedQuestions = await TopicWiseMCQ.deleteMany({ 
        $or: [
          { topicId: topicId },
          { topicId: existingTopic.topicId }
        ]
      });
      console.log(`✅ Deleted ${deletedQuestions.deletedCount} questions for topic`);

      // Delete the topic
      await Topic.findOneAndDelete({ _id: existingTopic._id });
      console.log(`✅ Deleted existing topic: ${existingTopic.topicName}`);
    }

    // Create new topic with isFree: true
    const newTopic = await Topic.create({
      topicId: topicId,
      topicName: topicName,
      topicName_hi: topicName_hi,
      isFree: true
    });
    
    // Update createdAt directly in database to ensure it's on top (bypass Mongoose timestamps)
    await Topic.updateOne(
      { _id: newTopic._id },
      { $set: { createdAt: earliestDate } }
    );
    
    // Refresh the topic to get the updated createdAt
    const updatedTopic = await Topic.findById(newTopic._id);

    console.log(`✅ Created new topic as FREE: ${updatedTopic.topicName} (ID: ${updatedTopic.topicId}, isFree: ${updatedTopic.isFree})`);

    // Load questions from question bank if available
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'src', 'data', 'topicwise-questions-bank.json');
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const questionBank = JSON.parse(fileContent);
        
        if (questionBank.topics && questionBank.topics[topicId] && questionBank.topics[topicId].questions) {
          const questions = questionBank.topics[topicId].questions;
          
          const questionsToInsert = questions.map((q, index) => ({
            topicId: topicId,
            topicName: topicName,
            topicName_hi: topicName_hi,
            questionNumber: index + 1,
            question_en: q.question_en || '',
            question_hi: q.question_hi || '',
            options_en: q.options_en || [],
            options_hi: q.options_hi || [],
            correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
            explanation_en: q.explanation_en || '',
            explanation_hi: q.explanation_hi || ''
          }));

          if (questionsToInsert.length > 0) {
            await TopicWiseMCQ.insertMany(questionsToInsert);
            console.log(`✅ Inserted ${questionsToInsert.length} questions for topic`);
          }
        }
      }
    } catch (error) {
      console.log('Note: Could not load questions from question bank:', error.message);
      // This is okay, questions can be added manually later
    }

    return NextResponse.json({ 
      success: true, 
      message: "Topic deleted and recreated as FREE",
      topic: {
        topicId: updatedTopic.topicId,
        topicName: updatedTopic.topicName,
        topicName_hi: updatedTopic.topicName_hi,
        isFree: updatedTopic.isFree
      }
    });
  } catch (error) {
    console.error('Error recreating topic as free:', error);
    return NextResponse.json({ error: error.message || 'Failed to recreate topic' }, { status: 500 });
  }
}

