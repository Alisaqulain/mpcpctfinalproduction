import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedPostBySlug,
  listRelatedPosts,
} from "@/lib/blogPublic";
import { headingsFromMarkdown } from "@/lib/blogUtils";
import { generatePageMetadata } from "@/lib/metadata";
import BlogPostBody from "@/app/components/blog/BlogPostBody";
import BlogShareBar from "@/app/components/blog/BlogShareBar";
import BlogToc from "@/app/components/blog/BlogToc";
import { BlogPostingSchema, BreadcrumbSchema } from "@/app/components/SEO/StructuredData";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mpcpct.com";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description =
    post.metaDescription || post.excerpt || "MPC PCT blog article on CCC, CPCT & typing exams.";
  return generatePageMetadata({
    title,
    description,
    keywords: (post.tags || []).join(", "),
    path: `/blog/${post.slug}`,
    image: post.featuredImage || undefined,
  });
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const toc =
    post.contentFormat === "markdown" ? headingsFromMarkdown(post.content) : [];
  const related = await listRelatedPosts(post.category?._id, post.slug, 4);

  const url = `${siteUrl}/blog/${post.slug}`;
  const schemaPost = {
    title: post.title,
    metaDescription: post.metaDescription || post.excerpt,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    slug: post.slug,
    tags: post.tags,
    author: post.author,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
  };

  return (
    <>
      <BlogPostingSchema siteUrl={siteUrl} post={schemaPost} />
      <BreadcrumbSchema
        siteUrl={siteUrl}
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />

      <article className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          <nav className="text-sm text-slate-500 mb-8">
            <Link href="/" className="hover:text-indigo-600">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-indigo-600">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">{post.category?.name || "Article"}</span>
          </nav>

          <header className="mb-8">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              {post.category?.name || "MPC PCT"} ·{" "}
              {post.readingMinutes ? `${post.readingMinutes} min read` : "Blog"}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 leading-tight">
              {post.title}
            </h1>
            <p className="text-lg text-slate-600 mt-4">{post.excerpt}</p>
          </header>

          <BlogToc items={toc} />

          {post.contentFormat === "html" ? (
            <div
              className="prose prose-slate lg:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <BlogPostBody markdown={post.content} />
          )}

          <BlogShareBar title={post.title} url={url} />

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Related posts</h2>
              <ul className="space-y-3">
                {related.map((r) => (
                  <li key={String(r._id)}>
                    <Link href={`/blog/${r.slug}`} className="text-indigo-600 font-medium hover:underline">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-12 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-6 text-center">
            <p className="font-semibold text-lg">Practice what you read — on MPC PCT</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/exam" className="rounded-xl bg-white text-indigo-800 px-5 py-2 font-semibold">
                Exam hub
              </Link>
              <Link
                href="/typing-test"
                className="rounded-xl border border-white/40 px-5 py-2 font-semibold hover:bg-white/10"
              >
                Typing tests
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
