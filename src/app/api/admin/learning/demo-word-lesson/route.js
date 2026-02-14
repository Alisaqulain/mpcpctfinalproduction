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
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });

  await dbConnect();

  const sections = await Section.find({ examId: { $exists: false } }).sort({ lessonNumber: 1 }).lean();
  const homeSection = sections.find(s => s.lessonNumber === 1) || sections[0];
  if (!homeSection) {
    return NextResponse.json({ error: "No learning section found. Create a section (e.g. Home) first." }, { status: 400 });
  }

  const existingInSection = await Lesson.find({ sectionId: homeSection.id }).sort({ id: 1 }).lean();
  const nextNum = existingInSection.length + 1;
  const lessonId = `${homeSection.lessonNumber}.${nextNum}`;

  const existing = await Lesson.findOne({ id: lessonId });
  if (existing) {
    return NextResponse.json({ error: `Lesson ${lessonId} already exists.`, lesson: existing }, { status: 200 });
  }

  const demoLesson = {
    sectionId: homeSection.id,
    id: lessonId,
    title: "Demo Word Typing",
    title_hindi: "",
    description: "Practice typing words. Complete with net speed ≥ 10 to unlock the next word lesson.",
    description_hindi: "",
    difficulty: "beginner",
    estimatedTime: "5 minutes",
    lessonType: "word",
    content: {
      english: "the quick brown fox jumps over the lazy dog practice typing words to improve your speed and accuracy",
      hindi_ramington: "",
      hindi_inscript: ""
    },
    isFree: true
  };

  const created = await Lesson.create(demoLesson);
  return NextResponse.json({ success: true, lesson: created, message: `Demo word lesson "${lessonId}" added to ${homeSection.name}.` });
}
