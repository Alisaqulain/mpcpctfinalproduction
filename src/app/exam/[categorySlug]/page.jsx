"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ExamSubcategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params?.categorySlug;
  const [category, setCategory] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug) return;
    let cancelled = false;
    (async () => {
      try {
        const catRes = await fetch("/api/categories");
        const catData = await catRes.json();
        const c = (catData.categories || []).find((x) => x.slug === categorySlug);
        if (!c) {
          if (!cancelled) router.replace("/exam");
          return;
        }
        if (!cancelled) setCategory(c);

        const subRes = await fetch(
          `/api/subcategories?categorySlug=${encodeURIComponent(categorySlug)}`
        );
        const subData = await subRes.json();
        if (!cancelled) setSubs(subData.subcategories || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) router.replace("/exam");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/exam")}
            className="text-sm text-[#290c52] font-medium"
          >
            ← Categories
          </button>
          <h1 className="text-xl font-bold flex-1 text-center pr-16">
            {category?.name || "…"}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 w-full">
        {loading && <p className="text-center text-gray-600">Loading…</p>}
        {!loading && subs.length === 0 && (
          <p className="text-center text-gray-600">No exam types in this category.</p>
        )}
        <div className="space-y-3">
          {subs.map((s) => (
            <Link
              key={s._id}
              href={`/exam/${categorySlug}/${s.slug}`}
              className="flex items-center justify-between border border-gray-200 rounded-xl p-4 shadow-sm hover:bg-[#290c52] hover:text-white transition-colors"
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-sm opacity-80">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
