import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 50);
    const posts = await BlogPost.find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("category", "name slug")
      .lean();

    return NextResponse.json({ posts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
