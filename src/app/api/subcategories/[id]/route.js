import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamSubCategory from "@/lib/models/ExamSubCategory";
import { requireAdmin } from "@/lib/apiAuth";
import { normalizeSlug } from "@/lib/slug";

export async function PATCH(req, { params }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const update = {};

    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.slug !== undefined) {
      const s = normalizeSlug(body.slug);
      if (!s) {
        return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
      }
      update.slug = s;
    }
    if (body.order !== undefined) {
      const n = parseInt(body.order, 10);
      update.order = Number.isFinite(n) ? n : 0;
    }
    if (body.isActive !== undefined) update.isActive = !!body.isActive;
    if (body.legacyExamTypeKey !== undefined) {
      update.legacyExamTypeKey = body.legacyExamTypeKey
        ? String(body.legacyExamTypeKey).trim()
        : null;
    }
    if (body.isTopicWise !== undefined) update.isTopicWise = !!body.isTopicWise;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const sub = await ExamSubCategory.findByIdAndUpdate(id, update, { new: true });
    if (!sub) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, subcategory: sub });
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists for this category" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 });
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
    const sub = await ExamSubCategory.findByIdAndDelete(id);
    if (!sub) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Subcategory deleted" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 });
  }
}
