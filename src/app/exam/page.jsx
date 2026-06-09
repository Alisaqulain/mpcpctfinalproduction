"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExamCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        if (!cancelled) {
          setCategories(data.categories || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fff] flex flex-col">
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-1">Exam Mode</h1>
          <p className="text-center text-sm text-gray-600">Choose exam category</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 w-full">
          {loading && (
            <p className="text-center text-gray-600 py-12">Loading categories…</p>
          )}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="text-[#290c52] underline"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && categories.length === 0 && (
            <p className="text-center text-gray-600">No categories yet.</p>
          )}
          <div className="space-y-3">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/exam/${c.slug}`}
                className="flex items-center justify-between border border-gray-200 rounded-xl p-4 shadow-sm hover:bg-[#290c52] hover:text-white transition-colors"
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-sm opacity-80">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
