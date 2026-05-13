import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BlogPost from "@/lib/models/BlogPost";
import { requireAdmin } from "@/lib/apiAuth";
import {
  buildMetaFromTitle,
  estimateReadingMinutesMarkdown,
  headingsFromMarkdown,
  slugify,
} from "@/lib/blogUtils";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }
  await dbConnect();
  const posts = await BlogPost.find()
    .sort({ updatedAt: -1 })
    .populate("category", "name slug")
    .lean();
  return NextResponse.json({ posts });
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    let slug = slugify(body.slug || title);
    const exists = await BlogPost.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const content = String(body.content || "");
    const readingMinutes = estimateReadingMinutesMarkdown(content);
    const meta =
      body.metaTitle && body.metaDescription
        ? {
            metaTitle: body.metaTitle,
            metaDescription: body.metaDescription,
          }
        : buildMetaFromTitle(title);

    const doc = await BlogPost.create({
      title,
      slug,
      excerpt: String(body.excerpt || "").slice(0, 400),
      content,
      contentFormat: body.contentFormat === "html" ? "html" : "markdown",
      featuredImage: String(body.featuredImage || ""),
      category: body.category || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      published: Boolean(body.published),
      publishedAt: body.published ? new Date() : null,
      metaTitle: meta.metaTitle,
      metaDescription: meta.metaDescription,
      readingMinutes,
      author: body.author || "MPC PCT Editorial",
    });

    return NextResponse.json({ post: doc });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
