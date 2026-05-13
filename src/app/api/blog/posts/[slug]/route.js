import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BlogPost from "@/lib/models/BlogPost";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const post = await BlogPost.findOne({ slug, published: true })
      .populate("category", "name slug")
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}
