import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";
import Section from "@/lib/models/Section";
import Exam from "@/lib/models/Exam";
import Part from "@/lib/models/Part";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
import Topic from "@/lib/models/Topic";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const topicId = searchParams.get("topicId");
    
    // Handle topic-based exam
    if (topicId) {
      // Fetch topic details
      const topic = await Topic.findOne({ topicId });
      if (!topic) {
        return NextResponse.json(
          { success: false, error: "Topic not found" },
          { status: 404 }
        );
      }
      
      // Fetch all questions for this topic
      const questions = await TopicWiseMCQ.find({ topicId })
        .sort({ order: 1, createdAt: 1 })
        .lean();
      
      // Limit to 100 questions
      const limitedQuestions = questions.slice(0, 100);
      
      // Create a single section for the topic
      const section = {
        _id: `topic-section-${topicId}`,
        id: `topic-section-${topicId}`,
        name: topic.topicName || topic.topicName_hi || "Topic Questions",
        order: 0,
        typingTime: null,
        skillLessonId: null
      };
      
      // Convert TopicWiseMCQ questions to the same format as regular questions
      const formattedQuestions = limitedQuestions.map((q, index) => ({
        _id: q._id.toString(),
        question_en: q.question_en || '',
        question_hi: q.question_hi || '',
        options_en: q.options_en || [],
        options_hi: q.options_hi || [],
        correctAnswer: q.correctAnswer,
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        imageUrl: q.imageUrl || null,
        explanation_en: q.explanation_en || '',
        explanation_hi: q.explanation_hi || '',
        difficulty: q.difficulty || 'medium',
        sectionId: section.id,
        partId: null,
        examId: null,
        topicId: q.topicId
      }));
      
      return NextResponse.json({
        success: true,
        data: {
          exam: {
            _id: `topic-${topicId}`,
            title: topic.topicName || topic.topicName_hi || "Topic Wise MCQ",
            key: "TOPICWISE",
            totalTime: 90 * 60, // 90 minutes
            totalQuestions: formattedQuestions.length
          },
          sections: [section],
          parts: [],
          allQuestions: formattedQuestions
        }
      });
    }
    
    // Handle regular exam
    if (!examId) {
      return NextResponse.json(
        { success: false, error: "Exam ID or Topic ID is required" },
        { status: 400 }
      );
    }
    
    // Fetch exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }
    
    // Fetch sections for this exam (try both ObjectId and string)
    const sections = await Section.find({ 
      $or: [
        { examId: examId },
        { examId: String(examId) }
      ]
    }).sort({ order: 1, createdAt: 1 });
    
    // Fetch parts for this exam (try both ObjectId and string)
    const parts = await Part.find({ 
      $or: [
        { examId: examId },
        { examId: String(examId) }
      ]
    }).sort({ order: 1, createdAt: 1 });
    
    // Fetch all questions for this exam
    // Try multiple formats to ensure we get all questions
    // Convert examId to both ObjectId and String formats
    let examIdQuery;
    
    try {
      // Try to convert to ObjectId if it's a valid ObjectId string
      const objectIdExamId = mongoose.Types.ObjectId.isValid(examId) 
        ? new mongoose.Types.ObjectId(examId) 
        : null;
      
      examIdQuery = {
        $or: [
          { examId: String(examId) },
          { examId: examId }
        ]
      };
      
      if (objectIdExamId) {
        examIdQuery.$or.push({ examId: objectIdExamId });
      }
    } catch (e) {
      examIdQuery = {
        $or: [
          { examId: String(examId) },
          { examId: examId }
        ]
      };
    }
    
    const questions = await Question.find(examIdQuery).sort({ createdAt: 1 });
    
    console.log(`Found ${sections.length} sections, ${parts.length} parts, and ${questions.length} questions for exam ${examId}`);
    console.log(`Exam details: _id=${exam._id} (type: ${typeof exam._id}), title=${exam.title}, key=${exam.key}`);
    console.log(`Query used:`, JSON.stringify(examIdQuery, null, 2));
    
    // Log a sample of question examIds to debug
    if (questions.length > 0) {
      console.log(`Sample question examIds: ${questions.slice(0, 3).map(q => q.examId).join(', ')}`);
    } else {
      console.warn(`⚠️ WARNING: No questions found for exam ${examId}!`);
      // Try a broader search to see if questions exist with different examId format
      const allQuestions = await Question.find({}).limit(5);
      console.log(`Sample of all questions in DB (first 5):`, allQuestions.map(q => ({
        _id: q._id,
        examId: q.examId,
        examIdType: typeof q.examId,
        question_en: q.question_en?.substring(0, 30)
      })));
    }
    sections.forEach(s => {
      console.log(`Section: ${s.name} (id: ${s.id}, _id: ${s._id.toString()})`);
    });
    parts.forEach(p => {
      console.log(`Part: ${p.name} (id: ${p.id}, _id: ${p._id.toString()}, sectionId: ${p.sectionId})`);
    });
    questions.forEach(q => {
      const isImageQuestion = q.question_en === '[Image Question]';
      const hasImageUrl = q.imageUrl && q.imageUrl.trim() !== '';
      if (isImageQuestion && !hasImageUrl) {
        console.warn(`⚠️ WARNING: Image question without imageUrl - ID: ${q._id}, question_en: "${q.question_en}", imageUrl: ${q.imageUrl || 'undefined'}`);
      }
      console.log(`Question: ${q.question_en?.substring(0, 30)}... (sectionId: ${q.sectionId}, partId: ${q.partId || 'none'}, examId: ${q.examId}, imageUrl: ${q.imageUrl || 'none'})`);
    });
    
    return NextResponse.json({
      success: true,
      data: {
        exam: {
          _id: exam._id.toString(),
          title: exam.title,
          key: exam.key,
          totalTime: exam.totalTime,
          totalQuestions: exam.totalQuestions
        },
        sections: sections.map(s => ({
          _id: s._id.toString(),
          id: s.id,
          name: s.name,
          order: s.order,
          typingTime: s.typingTime || null,
          skillLessonId: s.skillLessonId || null
        })),
        parts: parts.map(p => ({
          _id: p._id.toString(),
          id: p.id,
          name: p.name,
          sectionId: String(p.sectionId),
          order: p.order
        })),
        allQuestions: questions.map(q => {
          const questionObj = q.toObject();
          // CRITICAL: Always include imageUrl, never return undefined
          // If imageUrl exists in DB, return it as string
          // If it doesn't exist, return null (not undefined) for JSON compatibility
          const imageUrlValue = questionObj.imageUrl;
          return {
            ...questionObj,
            _id: q._id.toString(),
            sectionId: String(q.sectionId),
            partId: q.partId ? String(q.partId) : null,
            examId: String(q.examId),
            imageUrl: imageUrlValue !== undefined && imageUrlValue !== null && imageUrlValue !== '' 
              ? String(imageUrlValue) 
              : null // Use null instead of undefined for JSON
          };
        })
      }
    });
  } catch (error) {
    console.error("Error fetching exam questions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam questions" },
      { status: 500 }
    );
  }
}
