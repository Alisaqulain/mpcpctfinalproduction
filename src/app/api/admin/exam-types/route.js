import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamType from "@/lib/models/ExamType";
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

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  try {
    await dbConnect();
    const types = await ExamType.find().sort({ order: 1 });
    return NextResponse.json({ examTypes: types });
  } catch (error) {
    console.error("Error fetching exam types:", error);
    return NextResponse.json({ error: "Failed to fetch exam types" }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  try {
    await dbConnect();
    const body = await req.json();
    const { key, label, order, isTopicWise } = body;
    if (!key || !label) {
      return NextResponse.json({ error: "key and label are required" }, { status: 400 });
    }
    const keyUpper = String(key).trim().toUpperCase().replace(/\s+/g, "_");
    const existing = await ExamType.findOne({ key: keyUpper });
    if (existing) {
      return NextResponse.json({ error: "An exam type with this key already exists" }, { status: 400 });
    }
    const maxOrder = await ExamType.findOne().sort({ order: -1 }).select("order").lean();
    const newOrder = typeof order === "number" ? order : (maxOrder?.order ?? -1) + 1;
    const examType = await ExamType.create({
      key: keyUpper,
      label: label.trim(),
      order: newOrder,
      isTopicWise: !!isTopicWise,
    });
    return NextResponse.json({ examType });
  } catch (error) {
    console.error("Error creating exam type:", error);
    return NextResponse.json({ error: error.message || "Failed to create exam type" }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  try {
    await dbConnect();
    const body = await req.json();
    const { _id, label, order, isTopicWise } = body;
    if (!_id) return NextResponse.json({ error: "_id is required" }, { status: 400 });
    const update = {};
    if (label !== undefined) update.label = String(label).trim();
    if (order !== undefined) update.order = Number(order);
    if (isTopicWise !== undefined) update.isTopicWise = !!isTopicWise;
    const examType = await ExamType.findByIdAndUpdate(_id, update, { new: true });
    if (!examType) return NextResponse.json({ error: "Exam type not found" }, { status: 404 });
    return NextResponse.json({ examType });
  } catch (error) {
    console.error("Error updating exam type:", error);
    return NextResponse.json({ error: error.message || "Failed to update exam type" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("_id") || searchParams.get("id");
    if (!id) return NextResponse.json({ error: "_id or id is required" }, { status: 400 });
    const examType = await ExamType.findById(id);
    if (!examType) return NextResponse.json({ error: "Exam type not found" }, { status: 404 });
    const examsWithKey = await Exam.countDocuments({ key: examType.key });
    if (examsWithKey > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${examsWithKey} exam(s) use this type. Remove or reassign those exams first.` },
        { status: 400 }
      );
    }
    await ExamType.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Exam type deleted" });
  } catch (error) {
    console.error("Error deleting exam type:", error);
    return NextResponse.json({ error: error.message || "Failed to delete exam type" }, { status: 500 });
  }
}
