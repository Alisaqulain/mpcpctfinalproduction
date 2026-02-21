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

export async function PATCH(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const body = await req.json();
  const section = await Section.findByIdAndUpdate(params.id, body, { new: true });
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  return NextResponse.json({ section });
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const section = await Section.findByIdAndDelete(params.id);
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  return NextResponse.json({ message: "Section deleted" });
}

