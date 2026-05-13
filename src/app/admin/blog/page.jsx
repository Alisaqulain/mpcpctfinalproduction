"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    tags: "",
    published: true,
  });
  const [seedMsg, setSeedMsg] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/blog/posts");
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPosts(data.posts || []);
      setLoading(false);
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetch("/api/admin/blog/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        tags,
        published: form.published,
      }),
    });
    if (!res.ok) {
      alert("Save failed");
      return;
    }
    const data = await res.json();
    setPosts((p) => [data.post, ...p]);
    setForm({ title: "", excerpt: "", content: "", tags: "", published: true });
  };

  const seed = async () => {
    setSeedMsg("");
    const res = await fetch("/api/admin/blog/seed", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setSeedMsg(data.error || "Seed failed");
      return;
    }
    setSeedMsg(`Inserted ${data.inserted}, skipped ${data.skipped}`);
    router.refresh();
    const list = await fetch("/api/admin/blog/posts");
    const j = await list.json();
    setPosts(j.posts || []);
  };

  if (forbidden) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 font-semibold">Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10 text-center text-slate-600">Loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Blog admin</h1>
        <button
          type="button"
          onClick={seed}
          className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold"
        >
          Seed SEO articles
        </button>
      </div>
      {seedMsg && <p className="text-sm text-indigo-700">{seedMsg}</p>}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 p-6 bg-white">
        <h2 className="font-semibold text-lg">New post (Markdown)</h2>
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Excerpt"
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
          placeholder="Markdown content"
          rows={12}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Tags — comma separated"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Published
        </label>
        <button type="submit" className="rounded-lg bg-slate-900 text-white px-4 py-2 font-semibold">
          Save post
        </button>
      </form>

      <div>
        <h2 className="font-semibold text-lg mb-3">Existing posts</h2>
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
          {posts.map((p) => (
            <li key={p._id} className="p-4 flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500">{p.slug}</p>
              </div>
              <a className="text-indigo-600 text-sm" href={`/blog/${p.slug}`} target="_blank">
                View
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
