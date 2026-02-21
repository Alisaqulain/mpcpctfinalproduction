import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SkillTestExercise from "@/lib/models/SkillTestExercise";
import SkillTestExam from "@/lib/models/SkillTestExam";
import SkillTestSettings from "@/lib/models/SkillTestSettings";
import UserExercise from "@/lib/models/UserExercise";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(req) {
  try {
    await dbConnect();

    // Fetch exercises, exams, and settings from database
    let exercises = [];
    let userExercises = [];
    let exams = [];
    let settings = null;

    try {
      exercises = await SkillTestExercise.find({}).sort({ order: 1 }).lean();
    } catch (exerciseError) {
      console.error("[Skill Test API] Error fetching exercises:", exerciseError);
      exercises = [];
    }

    // Fetch user exercises if user is authenticated
    try {
      const token = req.cookies.get("token")?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
          const userId = payload?.userId;
          if (userId) {
            userExercises = await UserExercise.find({ userId }).sort({ createdAt: -1 }).lean();
          }
        } catch (tokenError) {
          // User not authenticated or invalid token - continue without user exercises
        }
      }
    } catch (userExerciseError) {
      console.error("[Skill Test API] Error fetching user exercises:", userExerciseError);
      userExercises = [];
    }

    try {
      exams = await SkillTestExam.find({}).sort({ order: 1 }).lean();
    } catch (examError) {
      console.error("[Skill Test API] Error fetching exams:", examError);
      exams = [];
    }

    try {
      settings = await SkillTestSettings.findOne({ id: "settings" }).lean();({ id: "settings" }).lean();
    } catch (settingsError) {
      console.error("[Skill Test API] Error fetching settings:", settingsError);
      settings = null;
    }

    console.log(`[Skill Test API] Fetched ${exercises.length} exercises, ${exams.length} exams from database`);
    if (exercises.length > 0) {
      console.log(`[Skill Test API] Exercise IDs:`, exercises.map(e => e.id));
      console.log(`[Skill Test API] Exercise names:`, exercises.map(e => e.name));
    }

    // Default settings if not found
    const defaultSettings = {
      mainLanguages: ["Hindi", "English"],
      subLanguages: ["Ramington Gail", "Inscript"],
      backspaceOptions: ["OFF", "ON"],
      durations: [2, 5, 10, 15, 20, 30],
      description: "Matter to type is given on upper half part of screen. Word to type is highlighted. Back space is allowed till current word. Wrong typed word makes bold. So user can identify such mistakes. One or more word afterwards the highlighted word can be skipped, if needed. Skipped word will not added as mistakes.",
      description_hindi: ""
    };

    // Combine admin exercises and user exercises, then sort by creation time (upload order)
    const allExercises = [
      ...(exercises || []).map(ex => ({
        id: ex.id || "",
        name: ex.name || "",
        lessonId: ex.lessonId || "",
        content: ex.content || { english: "", hindi_ramington: "", hindi_inscript: "" },
        difficulty: ex.difficulty || "beginner",
        isFree: ex.isFree || false,
        isUserExercise: false,
        _id: ex._id?.toString(),
        createdAt: ex.createdAt || new Date()
      })),
      ...(userExercises || []).map(ex => ({
        id: `user_${ex._id}`,
        name: ex.name || "",
        lessonId: "",
        content: ex.content || { english: "", hindi_ramington: "", hindi_inscript: "" },
        difficulty: ex.difficulty || "beginner",
        isFree: true,
        isUserExercise: true,
        _id: ex._id?.toString(),
        userId: ex.userId?.toString(),
        createdAt: ex.createdAt || new Date()
      }))
    ].sort((a, b) => {
      // Sort by creation time (upload order) - oldest first
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateA - dateB;
    });

    const skillTestData = {
      exercises: allExercises,
      exams: (exams || []).map(exam => ({
        id: exam.id || "",
        name: exam.name || "",
        description: exam.description || "",
        description_hindi: exam.description_hindi || "",
        isFree: exam.isFree || false
      })),
      settings: settings ? {
        mainLanguages: settings.mainLanguages || defaultSettings.mainLanguages,
        subLanguages: settings.subLanguages || defaultSettings.subLanguages,
        backspaceOptions: settings.backspaceOptions || defaultSettings.backspaceOptions,
        durations: settings.durations || defaultSettings.durations,
        description: settings.description || defaultSettings.description,
        description_hindi: settings.description_hindi || defaultSettings.description_hindi
      } : defaultSettings
    };

    console.log(`[Skill Test API] Returning ${skillTestData.exercises.length} exercises`);
    return NextResponse.json(skillTestData);
  } catch (error) {
    console.error("Error reading skill test data from database:", error);
    console.error("Error stack:", error.stack);
    // Return default structure if database fails
    return NextResponse.json({
      exercises: [],
      exams: [],
      settings: {
        mainLanguages: ["Hindi", "English"],
        subLanguages: ["Ramington Gail", "Inscript"],
        backspaceOptions: ["OFF", "ON"],
        durations: [2, 5, 10, 15, 20, 30],
        description: "Matter to type is given on upper half part of screen. Word to type is highlighted. Back space is allowed till current word. Wrong typed word makes bold. So user can identify such mistakes. One or more word afterwards the highlighted word can be skipped, if needed. Skipped word will not added as mistakes.",
        description_hindi: ""
      }
    }, { status: 200 }); // Return 200 even on error so frontend can handle it
  }
}

