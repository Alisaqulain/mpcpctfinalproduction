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
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-center mb-2">Exam Mode</h1>
          <p className="text-center text-sm text-gray-600">
            Choose a category, then exam type and mock test
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
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
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <Link
                key={c._id}
                href={`/exam/${c.slug}`}
                className="block border border-gray-200 rounded-xl shadow-md p-6 hover:bg-[#290c52] hover:text-white hover:border-[#290c52] transition-colors duration-300"
              >
                <h2 className="text-lg font-semibold">{c.name}</h2>
                {c.description ? (
                  <p className="text-sm mt-2 opacity-80">{c.description}</p>
                ) : null}
                <span className="inline-block mt-4 text-sm font-medium text-pink-600 group-hover:text-yellow-300">
                  View exam types →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
