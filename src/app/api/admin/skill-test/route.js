import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SkillTestExercise from "@/lib/models/SkillTestExercise";
import SkillTestExam from "@/lib/models/SkillTestExam";
import SkillTestSettings from "@/lib/models/SkillTestSettings";
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
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    await dbConnect();
    const exercises = await SkillTestExercise.find({}).sort({ order: 1 }).lean();
    const exams = await SkillTestExam.find({}).sort({ order: 1 }).lean();
    const settings = await SkillTestSettings.findOne({ id: "settings" }).lean();
    
    return NextResponse.json({ exercises, exams, settings });
  } catch (error) {
    console.error('GET /api/admin/skill-test error:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
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
    
    if (type === "exercise") {
      try {
        const { id, name, lessonId, content, difficulty, isFree, order } = body;
        
        // Validate required fields
        if (!id || !name) {
          return NextResponse.json({ error: "Missing required fields: id and name are required" }, { status: 400 });
        }
        
        // Check if exercise ID already exists
        const existingExercise = await SkillTestExercise.findOne({ id });
        if (existingExercise) {
          return NextResponse.json({ error: `Exercise with ID "${id}" already exists` }, { status: 400 });
        }
        
        // Ensure difficulty is valid
        const validDifficulties = ["beginner", "intermediate", "advanced", "easy", "medium", "hard"];
        const validDifficulty = validDifficulties.includes(difficulty) ? difficulty : "beginner";
        
        // Ensure content is an object with the right structure
        const contentData = typeof content === 'object' && content !== null
          ? {
              english: content.english || "",
              hindi_ramington: content.hindi_ramington || "",
              hindi_inscript: content.hindi_inscript || ""
            }
          : { english: "", hindi_ramington: "", hindi_inscript: "" };
        
        const exerciseData = {
          id: String(id),
          name: String(name),
          lessonId: String(lessonId || ""),
          content: contentData,
          difficulty: String(validDifficulty),
          isFree: Boolean(isFree),
          order: Number(order || 0)
        };
        
        console.log('[Admin API] Creating exercise with data:', JSON.stringify(exerciseData, null, 2));
        const created = await SkillTestExercise.create(exerciseData);
        console.log('[Admin API] Exercise created successfully:', created._id);
        return NextResponse.json({ exercise: created });
      } catch (error) {
        console.error('Error creating exercise:', error);
        if (error.code === 11000) {
          return NextResponse.json({ error: `Exercise with ID "${body.id}" already exists` }, { status: 400 });
        }
        if (error.name === 'ValidationError') {
          const errors = Object.values(error.errors).map(e => e.message).join(', ');
          return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to create exercise" }, { status: 500 });
      }
    }
    
    if (type === "exam") {
      try {
        const { id, name, description, description_hindi, isFree, order } = body;
        
        // Validate required fields
        if (!id || !name) {
          return NextResponse.json({ error: "Missing required fields: id and name are required" }, { status: 400 });
        }
        
        // Check if exam ID already exists
        const existingExam = await SkillTestExam.findOne({ id });
        if (existingExam) {
          return NextResponse.json({ error: `Exam with ID "${id}" already exists` }, { status: 400 });
        }
        
        const examData = {
          id: String(id),
          name: String(name),
          description: String(description || ""),
          description_hindi: String(description_hindi || ""),
          isFree: Boolean(isFree),
          order: Number(order || 0)
        };
        
        console.log('[Admin API] Creating exam with data:', JSON.stringify(examData, null, 2));
        const created = await SkillTestExam.create(examData);
        console.log('[Admin API] Exam created successfully:', created._id);
        return NextResponse.json({ exam: created });
      } catch (error) {
        console.error('Error creating exam:', error);
        if (error.code === 11000) {
          return NextResponse.json({ error: `Exam with ID "${body.id}" already exists` }, { status: 400 });
        }
        if (error.name === 'ValidationError') {
          const errors = Object.values(error.errors).map(e => e.message).join(', ');
          return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to create exam" }, { status: 500 });
      }
    }
    
    if (type === "settings") {
      try {
        const { mainLanguages, subLanguages, backspaceOptions, durations, description, description_hindi } = body;
        
        // Update or create settings
        const settingsData = {
          id: "settings",
          mainLanguages: Array.isArray(mainLanguages) ? mainLanguages : [],
          subLanguages: Array.isArray(subLanguages) ? subLanguages : [],
          backspaceOptions: Array.isArray(backspaceOptions) ? backspaceOptions : [],
          durations: Array.isArray(durations) ? durations.map(d => Number(d)) : [],
          description: String(description || ""),
          description_hindi: String(description_hindi || "")
        };
        
        const settings = await SkillTestSettings.findOneAndUpdate(
          { id: "settings" },
          settingsData,
          { upsert: true, new: true }
        );
        
        return NextResponse.json({ settings });
      } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error('POST /api/admin/skill-test error:', error);
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
    if (!type || !_id) {
      return NextResponse.json({ error: "Missing 'type' or '_id' field in request body" }, { status: 400 });
    }
    
    await dbConnect();
    
    if (type === "exercise") {
      try {
        const { id, name, lessonId, content, difficulty, isFree, order } = body;
        
        // Ensure content is an object with the right structure
        const contentData = typeof content === 'object' && content !== null
          ? {
              english: content.english || "",
              hindi_ramington: content.hindi_ramington || "",
              hindi_inscript: content.hindi_inscript || ""
            }
          : { english: "", hindi_ramington: "", hindi_inscript: "" };
        
        // Ensure difficulty is valid
        const validDifficulties = ["beginner", "intermediate", "advanced", "easy", "medium", "hard"];
        const validDifficulty = validDifficulties.includes(difficulty) ? difficulty : "beginner";
        
        const updateData = {
          name: String(name),
          lessonId: String(lessonId || ""),
          content: contentData,
          difficulty: String(validDifficulty),
          isFree: Boolean(isFree),
          order: Number(order || 0)
        };
        
        // If id is being changed, check for duplicates
        if (id) {
          const existing = await SkillTestExercise.findOne({ id, _id: { $ne: _id } });
          if (existing) {
            return NextResponse.json({ error: `Exercise with ID "${id}" already exists` }, { status: 400 });
          }
          updateData.id = String(id);
        }
        
        const updated = await SkillTestExercise.findByIdAndUpdate(_id, updateData, { new: true });
        if (!updated) {
          return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
        }
        return NextResponse.json({ exercise: updated });
      } catch (error) {
        console.error('Error updating exercise:', error);
        if (error.code === 11000) {
          return NextResponse.json({ error: `Exercise with ID "${body.id}" already exists` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to update exercise" }, { status: 500 });
      }
    }
    
    if (type === "exam") {
      try {
        const { id, name, description, description_hindi, isFree, order } = body;
        
        const updateData = {
          name: String(name),
          description: String(description || ""),
          description_hindi: String(description_hindi || ""),
          isFree: Boolean(isFree),
          order: Number(order || 0)
        };
        
        // If id is being changed, check for duplicates
        if (id) {
          const existing = await SkillTestExam.findOne({ id, _id: { $ne: _id } });
          if (existing) {
            return NextResponse.json({ error: `Exam with ID "${id}" already exists` }, { status: 400 });
          }
          updateData.id = String(id);
        }
        
        const updated = await SkillTestExam.findByIdAndUpdate(_id, updateData, { new: true });
        if (!updated) {
          return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }
        return NextResponse.json({ exam: updated });
      } catch (error) {
        console.error('Error updating exam:', error);
        if (error.code === 11000) {
          return NextResponse.json({ error: `Exam with ID "${body.id}" already exists` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Failed to update exam" }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/admin/skill-test error:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const _id = searchParams.get("_id");
    
    if (!type || !_id) {
      return NextResponse.json({ error: "Missing 'type' or '_id' parameter" }, { status: 400 });
    }
    
    await dbConnect();
    
    if (type === "exercise") {
      const deleted = await SkillTestExercise.findByIdAndDelete(_id);
      if (!deleted) {
        return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, exercise: deleted });
    }
    
    if (type === "exam") {
      const deleted = await SkillTestExam.findByIdAndDelete(_id);
      if (!deleted) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, exam: deleted });
    }
    
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error('DELETE /api/admin/skill-test error:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

