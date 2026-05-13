"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminSubcategoriesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subs, setSubs] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [legacyExamTypeKey, setLegacyExamTypeKey] = useState("");
  const [isTopicWise, setIsTopicWise] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSubs = async (cid) => {
    if (!cid) {
      setSubs([]);
      return;
    }
    const r = await fetch(`/api/subcategories?categoryId=${cid}`, { credentials: "include" });
    const j = await r.json();
    setSubs(j.subcategories || []);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.user?.role !== "admin") {
        router.replace("/admin/login");
        return;
      }
      const c = await fetch("/api/categories", { credentials: "include" });
      const j = await c.json();
      const cats = j.categories || [];
      setCategories(cats);
      if (cats[0]) {
        setCategoryId(String(cats[0]._id));
        await loadSubs(String(cats[0]._id));
      }
      setReady(true);
    })();
  }, [router]);

  useEffect(() => {
    if (ready && categoryId) loadSubs(categoryId);
  }, [categoryId, ready]);

  const submit = async (e) => {
    e.preventDefault();
    if (!categoryId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/subcategories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          categoryId,
          legacyExamTypeKey: legacyExamTypeKey || null,
          isTopicWise,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed");
        return;
      }
      setName("");
      setSlug("");
      setLegacyExamTypeKey("");
      setIsTopicWise(false);
      await loadSubs(categoryId);
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#290c52]">Exam subcategories</h1>
          <Link href="/admin" className="text-sm text-blue-700 underline">
            ← Admin home
          </Link>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold">Create subcategory</h2>
          <label className="block text-sm font-medium">Parent category</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Name (e.g. CPCT)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Slug (e.g. cpct)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Legacy exam key (optional: CPCT, RSCIT, CCC, CUSTOM)"
            value={legacyExamTypeKey}
            onChange={(e) => setLegacyExamTypeKey(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isTopicWise}
              onChange={(e) => setIsTopicWise(e.target.checked)}
            />
            Topic-wise MCQ (loads user topics instead of Exam list)
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#290c52] text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create"}
          </button>
        </form>

        <div className="bg-white rounded-xl shadow divide-y">
          <div className="p-3 text-sm text-gray-600 font-medium">Under selected category</div>
          {subs.map((s) => (
            <div key={s._id} className="p-4 flex justify-between gap-4">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-500">
                  /{s.slug}
                  {s.legacyExamTypeKey ? ` · legacy key: ${s.legacyExamTypeKey}` : ""}
                  {s.isTopicWise ? " · topic-wise" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
