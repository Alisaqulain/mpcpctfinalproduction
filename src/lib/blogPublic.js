import dbConnect from "@/lib/db";
import BlogPost from "@/lib/models/BlogPost";

export async function listPublishedPosts(limit = 24) {
  await dbConnect();
  return BlogPost.find({ published: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate("category", "name slug")
    .lean();
}

export async function getPublishedPostBySlug(slug) {
  await dbConnect();
  return BlogPost.findOne({ slug, published: true })
    .populate("category", "name slug")
    .lean();
}

export async function listRelatedPosts(categoryId, excludeSlug, limit = 3) {
  if (!categoryId) return [];
  await dbConnect();
  return BlogPost.find({
    published: true,
    slug: { $ne: excludeSlug },
    category: categoryId,
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate("category", "name slug")
    .lean();
}
