import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Part from "@/lib/models/Part";
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
  const part = await Part.findByIdAndUpdate(params.id, body, { new: true });
  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });
  return NextResponse.json({ part });
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  
  await dbConnect();
  const part = await Part.findByIdAndDelete(params.id);
  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });
  return NextResponse.json({ message: "Part deleted" });
}








