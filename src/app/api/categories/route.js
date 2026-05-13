import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MainCategory from "@/lib/models/MainCategory";
import { requireAdmin, getAuth } from "@/lib/apiAuth";
import { ensureDefaultExamHierarchy } from "@/lib/seedExamHierarchy";

export async function GET(req) {
  try {
    await dbConnect();
    await ensureDefaultExamHierarchy();
    const { user } = await getAuth(req);
    const admin = user?.role === "admin";
    const q = admin ? {} : { isActive: true };
    const categories = await MainCategory.find(q).sort({ order: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, categories });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Failed to load categories" }, { status: 500 });
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
    const { name, slug, description, order, isActive } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }
    const cat = await MainCategory.create({
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      description: description || "",
      order: order ?? 0,
      isActive: isActive !== false,
    });
    return NextResponse.json({ success: true, category: cat });
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
