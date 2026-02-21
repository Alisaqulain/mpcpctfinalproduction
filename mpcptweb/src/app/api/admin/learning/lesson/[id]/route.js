import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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

export async function PATCH(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const body = await req.json();
  const lesson = await Lesson.findByIdAndUpdate(params.id, body, { new: true });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  return NextResponse.json({ lesson });
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const lesson = await Lesson.findByIdAndDelete(params.id);
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  return NextResponse.json({ message: "Lesson deleted" });
}

