import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
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
  // Sort by title to show Exam 1 first, then 2, 3, etc.
  const exams = await Exam.find().sort({ title: 1, createdAt: 1 });
  return NextResponse.json({ exams });
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  await dbConnect();
  const data = await req.json();
  const exam = await Exam.create(data);
  return NextResponse.json({ exam });
}

export async function PUT(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  await dbConnect();
  const data = await req.json();
  const { _id, ...updateData } = data;
  if (!_id) {
    return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
  }
  const exam = await Exam.findByIdAndUpdate(_id, updateData, { new: true });
  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }
  return NextResponse.json({ exam });
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("_id");
  if (!examId) {
    return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
  }
  const exam = await Exam.findByIdAndDelete(examId);
  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: "Exam deleted successfully" });
}


