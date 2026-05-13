import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Exam from "@/lib/models/Exam";
import { requireAdmin } from "@/lib/apiAuth";

export async function GET(_req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, exam });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Failed to fetch exam" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const exam = await Exam.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, exam });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    await dbConnect();
    const { id } = await params;
    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Exam deleted" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
