"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function sortCategories(items) {
  return [...items].sort((a, b) => {
    const oa = Number(a.order ?? 0);
    const ob = Number(b.order ?? 0);
    if (oa !== ob) return oa - ob;
    return String(a.name).localeCompare(String(b.name));
  });
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [orderDrafts, setOrderDrafts] = useState({});
  const [savingOrderId, setSavingOrderId] = useState(null);

  const loadCategories = async () => {
    const c = await fetch("/api/categories", { credentials: "include" });
    const cj = await c.json();
    const sorted = sortCategories(cj.categories || []);
    setList(sorted);
    const drafts = {};
    sorted.forEach((cat, idx) => {
      drafts[cat._id] = String(cat.order ?? idx + 1);
    });
    setOrderDrafts(drafts);
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
      await loadCategories();
      setReady(true);
    })();
  }, [router]);

  const persistOrderList = async (orderedList) => {
    await Promise.all(
      orderedList.map((cat, idx) =>
        fetch(`/api/categories/${cat._id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: idx + 1 }),
        })
      )
    );
    await loadCategories();
  };

  const handleDelete = async (category) => {
    const msg =
      `Delete "${category.name}"?\n\n` +
      `This removes the category and any exam types (subcategories) under it.\n` +
      `Exams already created are not deleted.\n\nContinue?`;
    if (!confirm(msg)) return;

    setDeletingId(category._id);
    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed to delete category");
        return;
      }
      setList((prev) => prev.filter((item) => String(item._id) !== String(category._id)));
      await loadCategories();
    } finally {
      setDeletingId(null);
    }
  };

  const moveCategory = async (index, direction) => {
    const sorted = sortCategories(list);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const next = [...sorted];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    setReordering(true);
    try {
      await persistOrderList(next);
    } finally {
      setReordering(false);
    }
  };

  const saveOrder = async (category) => {
    const raw = orderDrafts[category._id];
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) {
      alert("Order must be a number 1 or greater (1 = shown first on Exam Mode page).");
      return;
    }

    setSavingOrderId(category._id);
    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: n }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed to save order");
        return;
      }
      await loadCategories();
    } finally {
      setSavingOrderId(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name, slug, description };
      if (order !== "") {
        const n = parseInt(order, 10);
        if (Number.isFinite(n)) body.order = n;
      } else {
        body.order = list.length + 1;
      }

      const res = await fetch("/api/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed");
        return;
      }
      setName("");
      setSlug("");
      setDescription("");
      setOrder("");
      await loadCategories();
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

  const sortedList = sortCategories(list);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#290c52]">Main categories</h1>
          <Link href="/admin" className="text-sm text-blue-700 underline">
            ← Admin home
          </Link>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold">Create category</h2>
          <p className="text-xs text-gray-500">
            Slug is used in the exam URL. Use hyphens, not spaces (e.g.{" "}
            <code className="bg-gray-100 px-1">enterance-exam</code>). Spaces are auto-converted.
          </p>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Name (e.g. Computer Exams)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Slug (e.g. computer-exams)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            type="number"
            min={1}
            placeholder={`Display order (1 = first). Leave empty for ${list.length + 1}`}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-[#290c52] text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create"}
          </button>
        </form>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-[#290c52]/5 text-sm text-gray-700">
            <strong>Display order</strong> controls the list on the public{" "}
            <Link href="/exam" className="text-blue-700 underline">
              Exam Mode
            </Link>{" "}
            page. Use <strong>1</strong> for first, <strong>2</strong> for second, etc. Or use ↑ ↓
            to reorder.
          </div>
          {sortedList.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No categories yet.</p>
          ) : (
            <div className="divide-y">
              {sortedList.map((c, index) => (
                <div key={c._id} className="p-4 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="bg-yellow-400 text-[#290c52] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-gray-500">/{c.slug}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveCategory(index, "up")}
                        disabled={reordering || index === 0}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategory(index, "down")}
                        disabled={reordering || index === sortedList.length - 1}
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-40"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      Order
                      <input
                        type="number"
                        min={1}
                        className="w-14 border rounded px-2 py-1 text-sm"
                        value={orderDrafts[c._id] ?? ""}
                        onChange={(e) =>
                          setOrderDrafts((prev) => ({ ...prev, [c._id]: e.target.value }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveOrder(c)}
                      disabled={savingOrderId === c._id}
                      className="text-xs px-2 py-1.5 rounded-lg font-medium bg-[#290c52] text-white disabled:opacity-50"
                    >
                      {savingOrderId === c._id ? "…" : "Save"}
                    </button>
                    <span
                      className={`text-xs px-2 py-1 rounded ${c.isActive ? "bg-green-100" : "bg-gray-200"}`}
                    >
                      {c.isActive ? "active" : "inactive"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c._id}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {deletingId === c._id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
