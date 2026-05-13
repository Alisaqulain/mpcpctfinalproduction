import Link from "next/link";
import { listPublishedPosts } from "@/lib/blogPublic";
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "MPC PCT Blog — CCC, CPCT & Typing Exam Guides",
  description:
    "SEO-friendly articles on CCC preparation, CPCT strategy, Hindi and English typing, and government computer exams for Indore & Madhya Pradesh.",
  keywords:
    "CCC blog, CPCT tips, Hindi typing, English typing, MPC PCT articles, government exam India",
  path: "/blog",
});

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts(48);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-14 md:py-20">
        <header className="mb-12 text-center space-y-3">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">
            MPC PCT Insights
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            CCC, CPCT &amp; Typing Strategy Blog
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Long-form guides for Madhya Pradesh aspirants — structured study plans, typing psychology,
            and exam pattern breakdowns with internal links back to live practice on MPC PCT.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-6 text-center">
            <p className="font-medium">Blog posts are not seeded yet.</p>
            <p className="text-sm mt-2">
              Admin: POST <code className="bg-white/80 px-1 rounded">/api/admin/blog/seed</code> while
              signed in as admin to publish starter SEO articles.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={String(post._id)}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                  {post.category?.name || "Guide"}
                  {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ""}
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">
                  <Link href={`/blog/${post.slug}`} className="hover:text-indigo-700">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-slate-600 flex-1 leading-relaxed">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex text-indigo-600 font-semibold hover:underline"
                >
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
