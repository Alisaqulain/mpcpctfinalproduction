"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

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
      setList(j.categories || []);
      setReady(true);
    })();
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed");
        return;
      }
      setName("");
      setSlug("");
      setDescription("");
      const c = await fetch("/api/categories", { credentials: "include" });
      const cj = await c.json();
      setList(cj.categories || []);
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
          <h1 className="text-2xl font-bold text-[#290c52]">Main categories</h1>
          <Link href="/admin" className="text-sm text-blue-700 underline">
            ← Admin home
          </Link>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold">Create category</h2>
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

        <div className="bg-white rounded-xl shadow divide-y">
          {list.map((c) => (
            <div key={c._id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500">/{c.slug}</div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${c.isActive ? "bg-green-100" : "bg-gray-200"}`}
              >
                {c.isActive ? "active" : "inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
