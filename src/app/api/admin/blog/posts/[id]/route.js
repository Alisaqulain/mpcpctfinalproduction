import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import BlogPost from "@/lib/models/BlogPost";
import { requireAdmin } from "@/lib/apiAuth";
import {
  estimateReadingMinutesMarkdown,
  slugify,
} from "@/lib/blogUtils";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const updates = {};

    if (body.title != null) updates.title = String(body.title).trim();
    if (body.slug != null) updates.slug = slugify(body.slug);
    if (body.excerpt != null) updates.excerpt = String(body.excerpt).slice(0, 400);
    if (body.content != null) {
      updates.content = String(body.content);
      updates.readingMinutes = estimateReadingMinutesMarkdown(updates.content);
    }
    if (body.featuredImage != null) updates.featuredImage = String(body.featuredImage);
    if (body.category !== undefined) updates.category = body.category || null;
    if (body.tags != null) updates.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.metaTitle != null) updates.metaTitle = String(body.metaTitle);
    if (body.metaDescription != null) updates.metaDescription = String(body.metaDescription);
    if (body.author != null) updates.author = String(body.author);
    if (body.contentFormat != null) {
      updates.contentFormat = body.contentFormat === "html" ? "html" : "markdown";
    }

    if (body.published != null) {
      updates.published = Boolean(body.published);
      if (updates.published) {
        const existing = await BlogPost.findById(id).lean();
        if (existing && !existing.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
    }

    const post = await BlogPost.findByIdAndUpdate(id, updates, { new: true }).populate(
      "category",
      "name slug"
    );

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await BlogPost.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
