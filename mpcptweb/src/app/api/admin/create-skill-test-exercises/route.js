import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SkillTestExercise from "@/lib/models/SkillTestExercise";
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

    const createdExercises = [];
    const errors = [];

    // Create 20 Exercise lessons
    for (let lessonNum = 1; lessonNum <= 20; lessonNum++) {
      try {
        const exerciseName = `Exercise Lesson ${lessonNum}`;
        const exerciseId = `exercise-lesson-${lessonNum}`;
        
        // Check if exercise already exists
        const existingExercise = await SkillTestExercise.findOne({ id: exerciseId });

        if (existingExercise) {
          // Update existing exercise
          existingExercise.name = exerciseName;
          existingExercise.order = lessonNum;
          existingExercise.isFree = lessonNum === 1;
          await existingExercise.save();
          
          createdExercises.push({
            id: existingExercise._id.toString(),
            name: existingExercise.name,
            isFree: existingExercise.isFree,
            order: existingExercise.order
          });
          
          console.log(`✅ Updated exercise ${lessonNum}/20: ${exerciseName} (${existingExercise.isFree ? 'FREE' : 'PAID'})`);
        } else {
          // Create new exercise
          const exercise = await SkillTestExercise.create({
            id: exerciseId,
            name: exerciseName,
            lessonId: "", // Can be linked later
            content: {
              english: `This is Exercise Lesson ${lessonNum}. Add your typing content here in English.`,
              hindi_ramington: `यह Exercise Lesson ${lessonNum} है। यहाँ अपना हिंदी रेमिंगटन गेल टाइपिंग कंटेंट जोड़ें।`,
              hindi_inscript: `यह Exercise Lesson ${lessonNum} है। यहाँ अपना हिंदी इनस्क्रिप्ट टाइपिंग कंटेंट जोड़ें।`
            },
            difficulty: "beginner",
            isFree: lessonNum === 1, // First exercise is free, others are paid
            order: lessonNum
          });

          createdExercises.push({
            id: exercise._id.toString(),
            name: exercise.name,
            isFree: exercise.isFree,
            order: exercise.order
          });

          console.log(`✅ Created exercise ${lessonNum}/20: ${exerciseName} (${exercise.isFree ? 'FREE' : 'PAID'})`);
        }

      } catch (error) {
        console.error(`❌ Error creating exercise ${lessonNum}:`, error);
        errors.push({
          lessonNum,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created/updated ${createdExercises.length} Exercise lessons`,
      exercises: createdExercises,
      summary: {
        total: createdExercises.length,
        free: createdExercises.filter(e => e.isFree).length,
        paid: createdExercises.filter(e => !e.isFree).length
      },
      errors: errors.length > 0 ? errors : undefined,
      note: "Each exercise has placeholder content that can be edited through the admin panel. First exercise is FREE, others are PAID."
    });

  } catch (error) {
    console.error("Create Skill Test Exercises error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create Exercise lessons" 
    }, { status: 500 });
  }
}

