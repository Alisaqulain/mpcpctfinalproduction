"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminBulkQuestionsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [jsonText, setJsonText] = useState(
    '[\n  {\n    "examId": "YOUR_EXAM_ID",\n    "sectionId": "SECTION_ID",\n    "question_en": "Sample?",\n    "options_en": ["A","B","C","D"],\n    "correctAnswer": 0,\n    "questionType": "MCQ"\n  }\n]'
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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
      setReady(true);
    })();
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr)) throw new Error("Root must be an array");
      const res = await fetch("/api/questions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: arr }),
      });
      const j = await res.json();
      if (!res.ok) {
        setStatus(j.error || "Failed");
        return;
      }
      setStatus(`Inserted ${j.count} questions.`);
    } catch (err) {
      setStatus(err.message || "Invalid JSON");
    } finally {
      setLoading(false);
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#290c52]">Bulk question upload</h1>
          <Link href="/admin" className="text-sm text-blue-700 underline">
            ← Admin home
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          POST JSON array of question objects matching your{" "}
          <code className="bg-gray-200 px-1 rounded">Question</code> schema (examId, sectionId,
          id optional, MCQ/TYPING fields).
        </p>
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
          <textarea
            className="w-full border rounded p-3 font-mono text-sm min-h-[280px]"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          {status && (
            <p className={`text-sm ${status.includes("Inserted") ? "text-green-700" : "text-red-600"}`}>
              {status}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#290c52] text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}
