import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";
import Section from "@/lib/models/Section";
import Exam from "@/lib/models/Exam";
import Part from "@/lib/models/Part";

export async function GET(req) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    
    if (!examId) {
      return NextResponse.json(
        { success: false, error: "Exam ID is required" },
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
    const questions = await Question.find({ 
      $or: [
        { examId: String(examId) },
        { examId: examId }
      ]
    }).sort({ createdAt: 1 });
    
    console.log(`Found ${sections.length} sections, ${parts.length} parts, and ${questions.length} questions for exam ${examId}`);
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
          order: s.order
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
