"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="bg-[#290c52] text-white p-3 md:p-4 shadow-md mb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => typeof window !== "undefined" && window.history.back()}
            aria-label="Go back"
            className="group flex items-center gap-2 shrink-0 transition-transform duration-200 active:scale-95"
          >
            <span className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-yellow-400/60 bg-white/10 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-colors duration-200 group-hover:bg-white/15">
              <ArrowLeft
                className="w-5 h-5 text-yellow-400"
                strokeWidth={2.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              />
            </span>
            <span className="hidden md:inline text-sm font-semibold text-white">Back</span>
          </button>
          <h1 className="text-lg md:text-2xl font-bold text-center flex-1 text-yellow-400">
            Exam Mode
          </h1>
          <div
            className="flex items-center gap-2 shrink-0 invisible pointer-events-none"
            aria-hidden="true"
          >
            <span className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-transparent" />
            <span className="hidden md:inline text-sm font-semibold">Back</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        <div className="max-w-4xl mx-auto bg-white border border-[#290c52] rounded-lg shadow-md overflow-hidden">
          <div className="bg-[#290c52] text-white p-3 md:p-4 border-b border-[#ffffff40]">
            <h2 className="text-base md:text-xl font-bold text-white">
              Choose Exam Category
            </h2>
            <p className="text-xs md:text-sm text-white/80 mt-1">
              Select a category to view available exams
            </p>
          </div>

          <div className="p-4 md:p-6 bg-[#290c52]/5">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#290c52] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading categories…</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="text-[#290c52] underline font-medium"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && categories.length === 0 && (
              <p className="text-center text-gray-600 py-8">No categories yet.</p>
            )}

            <div className="space-y-2">
              {categories.map((c, index) => (
                <Link
                  key={c._id}
                  href={`/exam/${c.slug}`}
                  className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-lg transition-all bg-white hover:bg-[#290c52] hover:text-white border border-gray-200 hover:border-[#290c52] shadow-sm group"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <span className="bg-yellow-400 text-[#290c52] rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs md:text-sm font-bold shrink-0 group-hover:bg-yellow-300">
                      {index + 1}
                    </span>
                    <span className="text-sm md:text-base font-medium truncate">{c.name}</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold bg-[#290c52] text-white group-hover:bg-yellow-400 group-hover:text-[#290c52] px-3 py-1.5 rounded-md shrink-0 transition-colors">
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
