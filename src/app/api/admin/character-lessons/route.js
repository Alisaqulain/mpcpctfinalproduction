import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CharacterLesson from "@/lib/models/CharacterLesson";
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

export async function GET() {
  await dbConnect();
  const lessons = await CharacterLesson.find().sort({ order: 1, createdAt: 1 });
  return NextResponse.json({ lessons });
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const data = await req.json();
  const lesson = await CharacterLesson.create(data);
  return NextResponse.json({ lesson });
}

export async function PUT(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const data = await req.json();
  const { _id, ...updateData } = data;
  if (!_id) {
    return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
  }
  const lesson = await CharacterLesson.findByIdAndUpdate(_id, updateData, { new: true });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  return NextResponse.json({ lesson });
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("_id");
  if (!lessonId) {
    return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
  }
  const lesson = await CharacterLesson.findByIdAndDelete(lessonId);
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: "Lesson deleted successfully" });
}






