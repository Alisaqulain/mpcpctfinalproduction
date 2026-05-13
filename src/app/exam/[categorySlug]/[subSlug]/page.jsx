"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

function examLoginUrl(examId, typeKey) {
  return `/exam/exam-login?examId=${examId}&type=${encodeURIComponent(typeKey)}`;
}

export default function ExamListPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params?.categorySlug;
  const subSlug = params?.subSlug;

  const [sub, setSub] = useState(null);
  const [exams, setExams] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicsError, setTopicsError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug || !subSlug) return;
    let cancelled = false;

    (async () => {
      try {
        const subRes = await fetch(
          `/api/subcategories?categorySlug=${encodeURIComponent(categorySlug)}&subSlug=${encodeURIComponent(subSlug)}`
        );
        const subData = await subRes.json();
        const found = (subData.subcategories || [])[0];
        if (!found) {
          router.replace(`/exam/${categorySlug}`);
          return;
        }
        if (!cancelled) setSub(found);

        if (found.isTopicWise) {
          const tRes = await fetch("/api/topicwise/my-topics", { credentials: "include" });
          if (tRes.status === 401) {
            if (!cancelled) setTopicsError("Please login to view topics");
          } else if (tRes.status === 403) {
            if (!cancelled) setTopicsError("Active subscription required");
          } else if (tRes.ok) {
            const tData = await tRes.json();
            if (!cancelled) setTopics(tData.topics || []);
          } else {
            if (!cancelled) setTopicsError("Failed to load topics");
          }
          if (!cancelled) setExams([]);
        } else if (found.legacyExamTypeKey) {
          const key = found.legacyExamTypeKey;
          const exRes = await fetch(`/api/exams?key=${encodeURIComponent(key)}`);
          const exData = await exRes.json();
          const list = exData.exams || [];
          list.sort((a, b) => {
            const na = (a.title || "").match(/(\d+)$/)?.[1];
            const nb = (b.title || "").match(/(\d+)$/)?.[1];
            return (parseInt(na, 10) || 0) - (parseInt(nb, 10) || 0);
          });
          if (!cancelled) setExams(list);
        } else {
          const exRes = await fetch(`/api/exams?subCategoryId=${found._id}`);
          const exData = await exRes.json();
          if (!cancelled) setExams(exData.exams || []);
        }
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
  }, [categorySlug, subSlug, router]);

  const typeKeyForExam = (exam) => sub?.legacyExamTypeKey || exam.key || "CPCT";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(`/exam/${categorySlug}`)}
            className="text-sm text-[#290c52] font-medium"
          >
            ← {sub?.name || "Back"}
          </button>
          <h1 className="text-lg font-bold flex-1 text-center pr-20 truncate">
            {sub?.name}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-4">
        {loading && <p className="text-center text-gray-600">Loading…</p>}

        {!loading && sub?.isTopicWise && (
          <>
            {topicsError && (
              <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg text-center text-gray-800">
                {topicsError}
                {topicsError.includes("subscription") && (
                  <div className="mt-3">
                    <a
                      href="/payment-app"
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold"
                    >
                      Subscribe
                    </a>
                  </div>
                )}
              </div>
            )}
            {!topicsError && topics.length === 0 && (
              <p className="text-center text-gray-600">No topics assigned yet.</p>
            )}
            {topics.map((topic) => (
              <div
                key={topic._id}
                className="relative border border-gray-200 rounded-xl shadow-md p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 font-medium pl-2">
                  {topic.topicName || topic.topicName_hi}
                </div>
                <a
                  href={`/exam/exam-login?topicId=${topic.topicId}&type=CUSTOM`}
                  className="bg-pink-300 hover:bg-yellow-500 text-black px-6 py-3 text-sm font-semibold rounded-md text-center"
                >
                  Start Practice
                </a>
              </div>
            ))}
          </>
        )}

        {!loading && !sub?.isTopicWise && exams.length === 0 && (
          <p className="text-center text-gray-600 border rounded-xl p-8">
            No exams available. Add exams from the admin panel.
          </p>
        )}

        {!loading &&
          !sub?.isTopicWise &&
          exams.map((exam) => (
            <div
              key={exam._id}
              className="relative border border-gray-200 rounded-xl shadow-md p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#290c52] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2 pl-2 flex-1">
                <span className="font-medium">{exam.title}</span>
                {exam.isFree === false && (
                  <span className="bg-yellow-500 text-black text-xs font-semibold px-2 py-0.5 rounded">
                    Premium
                  </span>
                )}
                {exam.isFree === true && (
                  <span className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                    Free
                  </span>
                )}
              </div>
              <a
                href={examLoginUrl(exam._id, typeKeyForExam(exam))}
                className="bg-pink-300 hover:bg-yellow-500 text-black px-6 py-3 text-sm font-semibold rounded-md text-center"
              >
                Start Exam
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}
