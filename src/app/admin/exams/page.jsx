"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminHierarchyExamsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subs, setSubs] = useState([]);
  const [exams, setExams] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [keyVal, setKeyVal] = useState("CPCT");
  const [totalTime, setTotalTime] = useState(75);
  const [totalQuestions, setTotalQuestions] = useState(75);
  const [isFree, setIsFree] = useState(false);
  const [passingMarks, setPassingMarks] = useState("");
  const [passingRulesJson, setPassingRulesJson] = useState("");
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

  const loadExams = async (sid) => {
    if (!sid) {
      setExams([]);
      return;
    }
    const r = await fetch(`/api/exams?subCategoryId=${sid}`, { credentials: "include" });
    const j = await r.json();
    setExams(j.exams || []);
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
        const id = String(cats[0]._id);
        setCategoryId(id);
        await loadSubs(id);
      }
      setReady(true);
    })();
  }, [router]);

  useEffect(() => {
    if (!ready || !categoryId) return;
    loadSubs(categoryId);
  }, [categoryId, ready]);

  useEffect(() => {
    if (subCategoryId) loadExams(subCategoryId);
    else setExams([]);
  }, [subCategoryId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!subCategoryId) {
      alert("Select a subcategory");
      return;
    }
    let passingRules = undefined;
    if (passingRulesJson.trim()) {
      try {
        passingRules = JSON.parse(passingRulesJson);
      } catch {
        alert("Passing rules must be valid JSON");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          key: keyVal,
          totalTime: Number(totalTime) || 75,
          totalQuestions: Number(totalQuestions) || 75,
          isFree,
          subCategoryId,
          passingMarks: passingMarks === "" ? undefined : Number(passingMarks),
          passingRules,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || "Failed");
        return;
      }
      setTitle("");
      setPassingRulesJson("");
      await loadExams(subCategoryId);
    } finally {
      setSaving(false);
    }
  };

  const removeExam = async (id) => {
    if (!confirm("Delete this exam?")) return;
    const res = await fetch(`/api/exams/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) await loadExams(subCategoryId);
    else alert("Delete failed");
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
          <h1 className="text-2xl font-bold text-[#290c52]">Exams (hierarchy)</h1>
          <Link href="/admin" className="text-sm text-blue-700 underline">
            ← Admin home
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          Create exams under a subcategory. Sections and questions are still managed from the main
          Admin → Exams tab.
        </p>

        <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-3">
          <h2 className="font-semibold">Create exam</h2>
          <select
            className="w-full border rounded px-3 py-2"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubCategoryId("");
            }}
          >
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="w-full border rounded px-3 py-2"
            value={subCategoryId}
            onChange={(e) => setSubCategoryId(e.target.value)}
            required
          >
            <option value="">Select subcategory</option>
            {subs.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Key (CPCT, RSCIT, CCC…)"
            value={keyVal}
            onChange={(e) => setKeyVal(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              className="w-1/2 border rounded px-3 py-2"
              placeholder="Total time (min)"
              value={totalTime}
              onChange={(e) => setTotalTime(e.target.value)}
            />
            <input
              type="number"
              className="w-1/2 border rounded px-3 py-2"
              placeholder="Total questions"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
            />
          </div>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            placeholder="Passing marks (optional)"
            value={passingMarks}
            onChange={(e) => setPassingMarks(e.target.value)}
          />
          <textarea
            className="w-full border rounded px-3 py-2 font-mono text-sm"
            placeholder='Passing rules JSON (optional), e.g. {"mcqMin":38,"englishNwpm":30}'
            value={passingRulesJson}
            onChange={(e) => setPassingRulesJson(e.target.value)}
            rows={3}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
            Free exam
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#290c52] text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create exam"}
          </button>
        </form>

        <div className="bg-white rounded-xl shadow divide-y">
          <div className="p-3 text-sm font-medium text-gray-600">Exams in selected subcategory</div>
          {exams.length === 0 && <div className="p-4 text-gray-500 text-sm">None</div>}
          {exams.map((ex) => (
            <div key={ex._id} className="p-4 flex justify-between items-center gap-2">
              <div>
                <div className="font-medium">{ex.title}</div>
                <div className="text-xs text-gray-500">
                  {ex.key} · {ex.totalTime} min · {ex.totalQuestions} Q
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeExam(ex._id)}
                className="text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
