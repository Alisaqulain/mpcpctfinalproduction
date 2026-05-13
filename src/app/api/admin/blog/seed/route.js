import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BlogCategory from "@/lib/models/BlogCategory";
import BlogPost from "@/lib/models/BlogPost";
import { requireAdmin } from "@/lib/apiAuth";
import { seedCategories, postsWithCategoryIds } from "@/lib/seed/blogSeed";
import {
  buildMetaFromTitle,
  estimateReadingMinutesMarkdown,
} from "@/lib/blogUtils";

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    await dbConnect();

    const categoryMap = {};
    for (const cat of seedCategories) {
      let doc = await BlogCategory.findOne({ slug: cat.slug });
      if (!doc) {
        doc = await BlogCategory.create(cat);
      }
      categoryMap[cat.slug] = doc._id;
    }

    const payloads = postsWithCategoryIds(categoryMap);
    let inserted = 0;
    let skipped = 0;

    for (const raw of payloads) {
      const exists = await BlogPost.findOne({ slug: raw.slug });
      if (exists) {
        skipped++;
        continue;
      }
      const meta = buildMetaFromTitle(raw.title);
      await BlogPost.create({
        title: raw.title,
        slug: raw.slug,
        excerpt: raw.excerpt,
        content: raw.content,
        category: raw.category,
        tags: raw.tags || [],
        published: true,
        publishedAt: new Date(),
        metaTitle: meta.metaTitle,
        metaDescription: meta.metaDescription,
        readingMinutes: estimateReadingMinutesMarkdown(raw.content),
      });
      inserted++;
    }

    return NextResponse.json({ ok: true, inserted, skipped, categories: Object.keys(categoryMap).length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
