"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

function resolveTabFromQuery(subList, tabParam) {
  if (!tabParam || subList.length === 0) return null;
  const normalized = String(tabParam).toLowerCase();
  const match = subList.find(
    (s) =>
      (s.isTopicWise && normalized === "topicwise") ||
      String(s.legacyExamTypeKey || "").toLowerCase() === normalized ||
      String(s.slug || "").toLowerCase() === normalized
  );
  if (!match) return null;
  return match.isTopicWise ? "topicwise" : match.legacyExamTypeKey || match.slug;
}

export default function ExamCategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <ExamCategoryContent />
    </Suspense>
  );
}

function ExamCategoryContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = params?.categorySlug;

  const [category, setCategory] = useState(null);
  const [subs, setSubs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [exams, setExams] = useState({});
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = subs.map((s) => ({
    id: s.isTopicWise ? "topicwise" : s.legacyExamTypeKey || s.slug,
    label: s.name,
    key: s.legacyExamTypeKey || s.slug,
    isTopicWise: s.isTopicWise,
  }));

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
        const subList = subData.subcategories || [];
        if (!cancelled) {
          setSubs(subList);
          if (subList.length > 0) {
            const tabFromUrl = resolveTabFromQuery(subList, searchParams.get("tab"));
            const first = subList[0];
            setActiveTab(
              tabFromUrl ||
                (first.isTopicWise ? "topicwise" : first.legacyExamTypeKey || first.slug)
            );
          }
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
  }, [categorySlug, router, searchParams]);

  useEffect(() => {
    if (subs.length === 0) return;
    let cancelled = false;

    (async () => {
      const examData = {};
      const keysToFetch = subs.filter((s) => !s.isTopicWise && s.legacyExamTypeKey).map((s) => s.legacyExamTypeKey);
      for (const key of keysToFetch) {
        try {
          const res = await fetch(`/api/exams?key=${encodeURIComponent(key)}`);
          if (res.ok) {
            const data = await res.json();
            examData[key] = data.exams || [];
          } else {
            examData[key] = [];
          }
        } catch (error) {
          console.error(`Error fetching exams for ${key}:`, error);
          examData[key] = [];
        }
      }
      if (!cancelled) setExams(examData);
    })();

    return () => {
      cancelled = true;
    };
  }, [subs]);

  useEffect(() => {
    if (activeTab !== "topicwise") return;
    let cancelled = false;

    (async () => {
      setTopicsLoading(true);
      setTopicsError(null);
      try {
        const res = await fetch("/api/topicwise/my-topics", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setTopics(data.topics || []);
        } else if (res.status === 401) {
          if (!cancelled) setTopicsError("Please login to view topics");
        } else if (res.status === 403) {
          if (!cancelled) setTopicsError("Active subscription required");
        } else {
          if (!cancelled) setTopicsError("Failed to load topics");
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
        if (!cancelled) setTopicsError("Failed to load topics");
      } finally {
        if (!cancelled) setTopicsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const getExamRoute = (key, examId) => {
    if (examId) {
      return `/exam/exam-login?examId=${examId}&type=${encodeURIComponent(key)}`;
    }
    return "/exam/exam-login";
  };

  const getCurrentExamKey = () => {
    const currentTab = tabs.find((tab) => tab.id === activeTab);
    return currentTab?.key || "CPCT";
  };

  const getCurrentExams = () => {
    const key = getCurrentExamKey();
    const examList = exams[key] || [];
    return examList.sort((a, b) => {
      const getExamNumber = (title) => {
        const match = (title || "").match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getExamNumber(a.title) - getExamNumber(b.title);
    });
  };

  return (
    <div className="min-h-screen bg-[#fff] flex flex-col">
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => router.push("/exam")}
              className="text-sm text-[#290c52] font-medium shrink-0"
          >
            ← Categories
          </button>
            <h1 className="text-xl font-bold flex-1 text-center pr-16 truncate">
              {category?.name || "Exam Mode"}
          </h1>
          </div>

          {tabs.length > 0 && (
            <div className="flex border border-gray-300 rounded-full overflow-hidden shadow-sm flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 py-4 text-[10px] md:text-[16px] font-bold transition-colors duration-300 border-l border-gray-300 first:border-l-0 ${
                    activeTab === tab.id
                      ? "bg-[#290c52] text-white"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          )}

        {!loading && subs.length === 0 && (
            <div className="text-center py-8 border border-gray-200 rounded-xl">
              <p className="text-gray-600">No exam types in this category yet.</p>
            </div>
          )}

          {!loading && subs.length > 0 && (
            <div className="space-y-4">
              {activeTab === "topicwise" ? (
                <>
                  {topicsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading topics...</p>
                    </div>
                  ) : topicsError ? (
                    <div className="text-center py-8 border border-gray-200 rounded-xl">
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                        <p className="text-gray-700">
                          {topicsError === "Active subscription required"
                            ? "Topic Wise MCQ is available for paid students only. Please subscribe to access this feature."
                            : topicsError}
                        </p>
                        {topicsError === "Active subscription required" && (
                          <div className="mt-4 flex gap-4 justify-center">
                            <a
                              href="/payment-app"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold"
                            >
                              Subscribe Now
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : topics.length === 0 ? (
                    <div className="text-center py-8 border border-gray-200 rounded-xl">
                      <p className="text-gray-600 mb-4">
                        No topics assigned yet. Contact your administrator to get topics assigned to your account.
                      </p>
                      <p className="text-sm text-gray-500">
                        Note: Topic Wise MCQ is available for paid students only.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topics.map((topic) => (
                        <div
                          key={topic._id}
                          className="relative border border-gray-200 rounded-xl shadow-md p-4 flex flex-col gap-3 hover:bg-[#290c52] hover:text-white transition-colors duration-300"
                        >
                          <div className="absolute top-0 left-0 z-10 pointer-events-none">
                            <img src="/newr.png" alt="" className="w-[4.5rem] h-14 object-contain" />
                          </div>
                          <div className="flex items-center justify-between gap-2 pl-10 min-w-0">
                            <div className="text-md font-medium break-words flex-1">
                              {topic.topicName || topic.topicName_hi}
                            </div>
                            {topic.isFree === false && (
                              <span className="bg-yellow-500 text-black text-xs font-semibold px-2 py-1 rounded flex-shrink-0">
                                Premium
                              </span>
                            )}
                            {topic.isFree === true && (
                              <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded flex-shrink-0">
                                Free
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/exam/exam-login?topicId=${topic.topicId}&type=TOPICWISE`
                              )
                            }
                            className="relative overflow-visible w-full bg-pink-300 hover:bg-yellow-500 text-black py-2.5 text-sm font-semibold rounded-md shadow-md cursor-pointer text-center"
                          >
                            Start Practice
                            <img
                              src="/new1.png"
                              alt=""
                              className="absolute -top-2.5 -right-2 z-10 w-12 h-20 object-contain object-top pointer-events-none"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {getCurrentExams().length > 0 ? (
                    getCurrentExams().map((exam) => (
                      <div
                        key={exam._id}
                        className="relative border border-gray-200 rounded-xl shadow-md p-4 flex flex-col gap-3 hover:bg-[#290c52] hover:text-white transition-colors duration-300"
                      >
                        <div className="absolute top-0 left-0 z-10 pointer-events-none">
                          <img src="/newr.png" alt="" className="w-[4.5rem] h-14 object-contain" />
                        </div>
                        <div className="flex items-center justify-between gap-2 pl-10 min-w-0">
                          <div className="text-md font-medium break-words flex-1">
                            {exam.title}
                          </div>
                          {exam.isFree === false && (
                            <span className="bg-yellow-500 text-black text-xs font-semibold px-2 py-1 rounded flex-shrink-0">
                              Premium
                            </span>
                          )}
                          {exam.isFree === true && (
                            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded flex-shrink-0">
                              Free
                            </span>
                          )}
                        </div>
                        <a
                          href={getExamRoute(getCurrentExamKey(), exam._id)}
                          className="relative overflow-visible block w-full bg-pink-300 hover:bg-yellow-500 text-black py-2.5 text-sm font-semibold rounded-md shadow-md text-center"
                        >
                          Start Exam
                          <img
                            src="/new1.png"
                            alt=""
                            className="absolute -top-3 -right-3 z-10 w-12 h-30 object-contain object-top pointer-events-none"
                          />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border border-gray-200 rounded-xl">
                      <p className="text-gray-600">
                        No exams available for this mode. Please add exams from the admin panel.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
