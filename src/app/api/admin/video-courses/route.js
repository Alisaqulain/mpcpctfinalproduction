import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import VideoCourse from "@/lib/models/VideoCourse";
import { requireAdmin, getAuth } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function GET(req) {
  const { user, error } = await getAuth(req);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const query = user.role === "admin" ? {} : { isActive: true };
    const courses = await VideoCourse.find(query).sort({ title: 1 }).lean();
    return NextResponse.json({ success: true, courses });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load courses" }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    await dbConnect();
    const body = await req.json();
    const { title, description, slug, subscriptionType } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const course = await VideoCourse.create({
      title: title.trim(),
      description: description || "",
      slug: slug?.trim() || title.trim().toLowerCase().replace(/\s+/g, "-"),
      subscriptionType: subscriptionType || "learning",
      isActive: true,
    });
    return NextResponse.json({ success: true, course });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
