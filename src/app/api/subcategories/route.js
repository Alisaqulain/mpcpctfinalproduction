import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExamSubCategory from "@/lib/models/ExamSubCategory";
import MainCategory from "@/lib/models/MainCategory";
import { requireAdmin, getAuth } from "@/lib/apiAuth";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    let categoryId = searchParams.get("categoryId");
    const categorySlug = searchParams.get("categorySlug");
    const subSlug = searchParams.get("subSlug");
    const { user } = await getAuth(req);
    const admin = user?.role === "admin";

    if (categorySlug && !categoryId) {
      const catQ = admin ? { slug: categorySlug } : { slug: categorySlug, isActive: true };
      const cat = await MainCategory.findOne(catQ).lean();
      if (cat) categoryId = String(cat._id);
    }

    const query = admin ? {} : { isActive: true };
    if (categoryId) query.categoryId = categoryId;
    let subs = await ExamSubCategory.find(query).sort({ order: 1, name: 1 }).lean();
    if (subSlug) {
      subs = subs.filter((s) => s.slug === subSlug);
    }
    return NextResponse.json({ success: true, subcategories: subs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Failed to load subcategories" }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  try {
    await dbConnect();
    const body = await req.json();
    const {
      name,
      slug,
      categoryId,
      order,
      isActive,
      legacyExamTypeKey,
      isTopicWise,
    } = body;
    if (!name || !slug || !categoryId) {
      return NextResponse.json(
        { error: "name, slug, and categoryId required" },
        { status: 400 }
      );
    }
    const parent = await MainCategory.findById(categoryId);
    if (!parent) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const sub = await ExamSubCategory.create({
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      categoryId,
      order: order ?? 0,
      isActive: isActive !== false,
      legacyExamTypeKey: legacyExamTypeKey || null,
      isTopicWise: !!isTopicWise,
    });
    return NextResponse.json({ success: true, subcategory: sub });
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists for this category" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create subcategory" }, { status: 500 });
  }
}
