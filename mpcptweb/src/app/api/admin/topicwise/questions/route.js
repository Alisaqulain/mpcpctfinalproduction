import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TopicWiseMCQ from "@/lib/models/TopicWiseMCQ";
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

export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    
    const filter = {};
    if (topicId) filter.topicId = topicId;
    
    const questions = await TopicWiseMCQ.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const body = await req.json();
    const { id, topicId, topicName, topicName_hi, question_en, question_hi, options_en, options_hi, correctAnswer, marks, negativeMarks, imageUrl, explanation_en, explanation_hi, difficulty, order, isFree, solutionVideoLink } = body;
    
    if (!id || !topicId || !topicName || !question_en || !options_en || correctAnswer === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if question ID already exists
    const existing = await TopicWiseMCQ.findOne({ id });
    if (existing) {
      return NextResponse.json({ error: `Question with ID "${id}" already exists` }, { status: 400 });
    }
    
    const question = await TopicWiseMCQ.create({
      id,
      topicId,
      topicName,
      topicName_hi: (topicName_hi !== undefined && topicName_hi !== null) ? String(topicName_hi) : '',
      question_en,
      question_hi: question_hi || '',
      options_en: Array.isArray(options_en) ? options_en : [],
      options_hi: Array.isArray(options_hi) ? options_hi : [],
      correctAnswer,
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
      imageUrl: imageUrl || '',
      explanation_en: explanation_en || '',
      explanation_hi: explanation_hi || '',
      difficulty: difficulty || 'medium',
      order: order || 0,
      isFree: isFree === true || isFree === 'true',
      solutionVideoLink: solutionVideoLink?.trim() || undefined
    });
    
    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error creating question:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message).join(', ');
      return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: `Question with this ID already exists` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create question' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const body = await req.json();
    const { _id, id, topicId, topicName, topicName_hi, question_en, question_hi, options_en, options_hi, correctAnswer, explanation_en, explanation_hi, difficulty, order, isFree, solutionVideoLink } = body;
    
    if (!_id) {
      return NextResponse.json({ error: "Missing _id field" }, { status: 400 });
    }
    
    const updateData = {};
    if (id) updateData.id = id;
    if (topicId) updateData.topicId = topicId;
    if (topicName) updateData.topicName = topicName;
    if (topicName_hi !== undefined) updateData.topicName_hi = (topicName_hi !== null) ? String(topicName_hi) : '';
    if (question_en) updateData.question_en = question_en;
    if (question_hi !== undefined) updateData.question_hi = question_hi;
    if (options_en) updateData.options_en = Array.isArray(options_en) ? options_en : [];
    if (options_hi !== undefined) updateData.options_hi = Array.isArray(options_hi) ? options_hi : [];
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
    if (explanation_en !== undefined) updateData.explanation_en = explanation_en;
    if (explanation_hi !== undefined) updateData.explanation_hi = explanation_hi;
    if (difficulty) updateData.difficulty = difficulty;
    if (order !== undefined) updateData.order = order;
    if (isFree !== undefined) updateData.isFree = isFree === true || isFree === 'true';
    if (solutionVideoLink !== undefined) updateData.solutionVideoLink = solutionVideoLink?.trim() || undefined;
    
    const updated = await TopicWiseMCQ.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    
    return NextResponse.json({ question: updated });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: error.message || 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const _id = searchParams.get('_id');
    
    if (!_id) {
      return NextResponse.json({ error: "Missing _id parameter" }, { status: 400 });
    }
    
    const deleted = await TopicWiseMCQ.findByIdAndDelete(_id);
    if (!deleted) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, question: deleted });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete question' }, { status: 500 });
  }
}

