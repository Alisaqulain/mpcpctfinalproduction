import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Section from "@/lib/models/Section";
import Lesson from "@/lib/models/Lesson";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, error: "Unauthorized" };
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload.role !== "admin") return { ok: false, error: "Forbidden" };
    return { ok: true, userId: payload.userId };
  } catch (e) {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  await dbConnect();
  // Only get learning sections (sections without examId - exam sections should not appear in learning)
  const sections = await Section.find({ examId: { $exists: false } }).sort({ lessonNumber: 1 }).lean();
  const rawLessons = await Lesson.find({}).lean();
  const lessons = rawLessons.map((l) => ({ ...l, lessonType: l.lessonType === "word" ? "word" : "alpha" }));
  console.log('[API GET Learning] sample lessonTypes:', rawLessons.slice(0, 5).map((l) => ({ id: l.id, title: l.title, lessonType: l.lessonType })));
  return NextResponse.json({ sections, lessons });
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    const { type } = body;
    if (!type) {
      return NextResponse.json({ error: "Missing 'type' field in request body" }, { status: 400 });
    }
    
    await dbConnect();
    if (type === "section") {
      try {
        const { id, name, description, lessonNumber } = body;
        const created = await Section.create({ id, name, description, lessonNumber });
        return NextResponse.json({ section: created });
      } catch (error) {
        console.error('Error creating section:', error);
        return NextResponse.json({ error: error.message || "Failed to create section" }, { status: 500 });
      }
    }
    if (type === "lesson") {
      try {
        const { sectionId, id, title, title_hindi, description, description_hindi, difficulty, estimatedTime, content, isFree, lessonType } = body;
        
        // Validate required fields
        if (!sectionId || !id || !title) {
          return NextResponse.json({ error: "Missing required fields: sectionId, id, and title are required" }, { status: 400 });
        }
        
        // Check if section exists and is a learning section (not an exam section)
        const section = await Section.findOne({ id: sectionId });
        if (!section) {
          return NextResponse.json({ error: `Section with ID "${sectionId}" not found` }, { status: 404 });
        }
        if (section.examId) {
          return NextResponse.json({ error: `Cannot add lessons to exam sections. Section "${sectionId}" is an exam section.` }, { status: 400 });
        }
        
        // Check if lesson ID already exists
        const existingLesson = await Lesson.findOne({ id });
        if (existingLesson) {
          return NextResponse.json({ error: `Lesson with ID "${id}" already exists` }, { status: 400 });
        }
        
        // Ensure difficulty is valid
        const validDifficulties = ["beginner", "intermediate", "advanced", "easy", "medium", "hard"];
        const validDifficulty = validDifficulties.includes(difficulty) ? difficulty : "beginner";
        const validLessonType = lessonType === "word" ? "word" : "alpha";
        
        // Ensure content is an object with the right structure
        const contentData = typeof content === 'object' && content !== null 
          ? {
              english: content.english || "",
              hindi_ramington: content.hindi_ramington || "",
              hindi_inscript: content.hindi_inscript || ""
            }
          : { english: "", hindi_ramington: "", hindi_inscript: "" };
        
        const lessonData = {
          sectionId: String(sectionId),
          id: String(id),
          title: String(title),
          title_hindi: String(title_hindi || ""),
          description: String(description || ""),
          description_hindi: String(description_hindi || ""),
          difficulty: String(validDifficulty),
          estimatedTime: String(estimatedTime || "5 minutes"),
          content: contentData,
          isFree: Boolean(isFree),
          lessonType: validLessonType
        };
        
        console.log('[Admin API] Creating lesson with data:', JSON.stringify(lessonData, null, 2));
        const created = await Lesson.create(lessonData);
        console.log('[Admin API] Lesson created successfully:', created._id);
        return NextResponse.json({ lesson: created });
      } catch (error) {
        console.error('Error creating lesson:', error);
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
          return NextResponse.json({ error: `Lesson with ID "${body.id}" already exists` }, { status: 400 });
        }
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
          const errors = Object.values(error.errors).map(e => e.message).join(', ');
          return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to create lesson" }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin/learning error:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    const { type, _id } = body;
    if (!type) {
      return NextResponse.json({ error: "Missing 'type' field in request body" }, { status: 400 });
    }
    
    await dbConnect();
    if (type === "section") {
      try {
        const { id, name, description, lessonNumber } = body;
        const updateData = { name, description, lessonNumber };
        if (id) updateData.id = id;
        const query = _id ? { _id } : { id: body.id };
        const updated = await Section.findOneAndUpdate(query, updateData, { new: true });
        if (!updated) return NextResponse.json({ error: "Section not found" }, { status: 404 });
        return NextResponse.json({ section: updated });
      } catch (error) {
        console.error('Error updating section:', error);
        return NextResponse.json({ error: error.message || "Failed to update section" }, { status: 500 });
      }
    }
    if (type === "lesson") {
      try {
        const { sectionId, id, title, title_hindi, description, description_hindi, difficulty, estimatedTime, content, isFree, lessonType } = body;
        console.log('[API PUT Lesson] body.lessonType:', lessonType, 'typeof:', typeof lessonType);
        // Ensure difficulty is valid
        const validDifficulties = ["beginner", "intermediate", "advanced", "easy", "medium", "hard"];
        const validDifficulty = validDifficulties.includes(difficulty) ? difficulty : "beginner";
        const validLessonType = lessonType === "word" ? "word" : "alpha";
        console.log('[API PUT Lesson] validLessonType:', validLessonType);
        
        // Ensure content is an object with the right structure
        const contentData = typeof content === 'object' && content !== null 
          ? {
              english: content.english || "",
              hindi_ramington: content.hindi_ramington || "",
              hindi_inscript: content.hindi_inscript || ""
            }
          : { english: "", hindi_ramington: "", hindi_inscript: "" };
        
        const updateData = {
          title: String(title),
          title_hindi: String(title_hindi || ""),
          description: String(description || ""),
          description_hindi: String(description_hindi || ""),
          difficulty: String(validDifficulty),
          estimatedTime: String(estimatedTime || "5 minutes"),
          content: contentData,
          isFree: Boolean(isFree),
          lessonType: validLessonType
        };
        if (sectionId) updateData.sectionId = sectionId;
        if (id) updateData.id = id;
        const query = _id ? { _id } : { id: body.id };
        const setPayload = { ...updateData, lessonType: validLessonType };
        console.log('[API PUT Lesson] query:', query, 'setPayload.lessonType:', setPayload.lessonType);
        const updated = await Lesson.findOneAndUpdate(query, { $set: setPayload }, { new: true });
        if (!updated) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        // Force-write lessonType via native MongoDB (bypasses Mongoose schema cache if lessonType was added later)
        await Lesson.collection.updateOne({ _id: updated._id }, { $set: { lessonType: validLessonType } });
        const final = await Lesson.findById(updated._id).lean();
        console.log('[API PUT Lesson] after raw update - final.lessonType:', final?.lessonType);
        return NextResponse.json({ lesson: { ...final, lessonType: validLessonType } });
      } catch (error) {
        console.error('Error updating lesson:', error);
        return NextResponse.json({ error: error.message || "Failed to update lesson" }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/admin/learning error:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const deleteAll = searchParams.get("deleteAll") === "true";
  
  // Handle delete all learning sections
  if (deleteAll && type === "section") {
    // Only delete learning sections (sections without examId)
    const learningSections = await Section.find({ examId: { $exists: false } }).lean();
    const sectionIds = learningSections.map(s => s.id);
    
    // Delete all lessons belonging to these sections
    await Lesson.deleteMany({ sectionId: { $in: sectionIds } });
    
    // Delete all learning sections
    const result = await Section.deleteMany({ examId: { $exists: false } });
    
    return NextResponse.json({ 
      ok: true, 
      deletedSections: result.deletedCount,
      deletedLessons: sectionIds.length 
    });
  }
  
  if (!type || !id) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  if (type === "section") {
    // Only allow deleting learning sections (not exam sections)
    const section = await Section.findOne({ id });
    if (section && section.examId) {
      return NextResponse.json({ error: "Cannot delete exam sections from learning management" }, { status: 400 });
    }
    await Section.deleteOne({ id });
    await Lesson.deleteMany({ sectionId: id });
    return NextResponse.json({ ok: true });
  }
  if (type === "lesson") {
    await Lesson.deleteOne({ id });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}


