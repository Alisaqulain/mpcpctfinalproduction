"use client";
import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Learning word typing now uses the same UI as skill test (/typing page).
 * This page redirects to /typing with from=learning so the same layout,
 * desktop/portrait/landscape views, and completion flow are used.
 */
function WordTypingRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const lesson = searchParams.get("lesson");
    const section = searchParams.get("section");
    const language = searchParams.get("language") || "english";
    const subLanguage = searchParams.get("subLanguage") || "";

    const params = new URLSearchParams();
    if (lesson) params.set("lesson", lesson);
    if (section) params.set("section", section);
    params.set("language", language);
    if (subLanguage) params.set("subLanguage", subLanguage);
    params.set("from", "learning");

    window.location.replace(`/typing?${params.toString()}`);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to typing...</p>
      </div>
    </div>
  );
}

export default function WordTypingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52]"></div>
        </div>
      }
    >
      <WordTypingRedirect />
    </Suspense>
  );
}
