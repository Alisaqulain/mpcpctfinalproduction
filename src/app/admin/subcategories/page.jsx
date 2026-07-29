"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const emptyForm = {
  name: "",
  slug: "",
  legacyExamTypeKey: "",
  isTopicWise: false,
};

export default function AdminSubcategoriesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subs, setSubs] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState(null);

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
          name: form.name,
          slug: form.slug,
          categoryId,
          legacyExamTypeKey: form.legacyExamTypeKey || null,
          isTopicWise: form.isTopicWise,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed");
        return;
      }
      setForm(emptyForm);
      await loadSubs(categoryId);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (sub) => {
    setEditingId(sub._id);
    setEditForm({
      name: sub.name || "",
      slug: sub.slug || "",
      legacyExamTypeKey: sub.legacyExamTypeKey || "",
      isTopicWise: !!sub.isTopicWise,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/subcategories/${editingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          slug: editForm.slug,
          legacyExamTypeKey: editForm.legacyExamTypeKey || null,
          isTopicWise: editForm.isTopicWise,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed to update");
        return;
      }
      cancelEdit();
      await loadSubs(categoryId);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sub) => {
    if (!confirm(`Delete subcategory "${sub.name}"?\n\nExams in the database are not deleted.`)) return;
    setDeletingId(sub._id);
    try {
      const res = await fetch(`/api/subcategories/${sub._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed to delete");
        return;
      }
      if (editingId === sub._id) cancelEdit();
      await loadSubs(categoryId);
    } finally {
      setDeletingId(null);
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
          <p className="text-xs text-gray-500">
            Slugs are auto-formatted for URLs (spaces become hyphens), e.g.{" "}
            <code className="bg-gray-100 px-1">neet-prep</code>
          </p>
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
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Slug (e.g. cpct)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Legacy exam key (optional: CPCT, RSCIT, CCC, CUSTOM)"
            value={form.legacyExamTypeKey}
            onChange={(e) => setForm({ ...form, legacyExamTypeKey: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isTopicWise}
              onChange={(e) => setForm({ ...form, isTopicWise: e.target.checked })}
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

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-3 text-sm text-gray-600 font-medium border-b">
            Under selected category
          </div>
          {subs.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No subcategories yet.</p>
          ) : (
            <div className="divide-y">
              {subs.map((s) => (
                <div key={s._id} className="p-4">
                  {editingId === s._id ? (
                    <div className="space-y-3">
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Name"
                      />
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        placeholder="Slug"
                      />
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={editForm.legacyExamTypeKey}
                        onChange={(e) =>
                          setEditForm({ ...editForm, legacyExamTypeKey: e.target.value })
                        }
                        placeholder="Legacy exam key"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.isTopicWise}
                          onChange={(e) =>
                            setEditForm({ ...editForm, isTopicWise: e.target.checked })
                          }
                        />
                        Topic-wise MCQ
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={saving}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#290c52] text-white disabled:opacity-50"
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">
                          /{s.slug}
                          {s.legacyExamTypeKey ? ` · legacy key: ${s.legacyExamTypeKey}` : ""}
                          {s.isTopicWise ? " · topic-wise" : ""}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          disabled={deletingId === s._id}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                        >
                          {deletingId === s._id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
