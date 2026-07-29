import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MainCategory from "@/lib/models/MainCategory";
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
    if (body.description !== undefined) update.description = String(body.description);
    if (body.isActive !== undefined) update.isActive = !!body.isActive;
    if (body.order !== undefined) {
      const n = parseInt(body.order, 10);
      update.order = Number.isFinite(n) ? n : 0;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const category = await MainCategory.findByIdAndUpdate(id, update, { new: true });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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
    const category = await MainCategory.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const subResult = await ExamSubCategory.deleteMany({ categoryId: id });
    await MainCategory.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Category deleted",
      subcategoriesRemoved: subResult.deletedCount || 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
