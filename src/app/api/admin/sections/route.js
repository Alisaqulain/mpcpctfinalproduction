import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Section from "@/lib/models/Section";
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

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('examId');
  const filter = examId ? { examId } : {};
  // Sort by order first (ascending), then by createdAt (ascending) for consistent ordering
  // This ensures new sections appear at the bottom if they have higher order values
  const sections = await Section.find(filter).sort({ order: 1, createdAt: 1 });
  return NextResponse.json({ sections });
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    
    await dbConnect();
    
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    try {
      const section = await Section.create(body);
      return NextResponse.json({ section });
    } catch (error) {
      console.error('Error creating section:', error);
      return NextResponse.json({ error: error.message || "Failed to create section" }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/sections:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


