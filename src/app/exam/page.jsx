"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExamSection() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("exam");
  const [exams, setExams] = useState({
    CPCT: [],
    RSCIT: [],
    CCC: [],
    CUSTOM: []
  });
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: "notes", label: "CPCT", key: "CPCT" },
    { id: "paperset", label: "RSCIT", key: "RSCIT" },
    { id: "test", label: "CCC", key: "CCC" },
    { id: "exam", label: "Topic Wise MCQ", key: "CUSTOM", isTopicWise: true },
  ];

  // Fetch exams for all modes on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const examKeys = ["CPCT", "RSCIT", "CCC", "CUSTOM"];
        const examData = {};

        // Fetch exams for each key
        for (const key of examKeys) {
          try {
            const res = await fetch(`/api/exams?key=${key}`);
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

        setExams(examData);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Fetch topics when Topic Wise MCQ tab is active
  useEffect(() => {
    const fetchTopics = async () => {
      if (activeTab === "exam") {
        setTopicsLoading(true);
        setTopicsError(null);
        try {
          const res = await fetch("/api/topicwise/my-topics", {
            credentials: "include",
          });

          if (res.ok) {
            const data = await res.json();
            setTopics(data.topics || []);
          } else if (res.status === 401) {
            setTopicsError("Please login to view topics");
          } else if (res.status === 403) {
            setTopicsError("Active subscription required");
          } else {
            setTopicsError("Failed to load topics");
          }
        } catch (error) {
          console.error("Error fetching topics:", error);
          setTopicsError("Failed to load topics");
        } finally {
          setTopicsLoading(false);
        }
      }
    };

    fetchTopics();
  }, [activeTab]);

  // Get route based on exam key
  const getExamRoute = (key, examId) => {
    // All exams should go to exam-login page with exam ID and type
    if (examId) {
      return `/exam/exam-login?examId=${examId}&type=${key}`;
    }
    return "/exam/exam-login";
  };

  // Get current tab's exam key
  const getCurrentExamKey = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab?.key || "CUSTOM";
  };

  // Get exams for current tab - sorted by exam number (1, 2, 3...)
  const getCurrentExams = () => {
    const key = getCurrentExamKey();
    const examList = exams[key] || [];
    
    // Sort by extracting number from title (e.g., "CPCT Exam 1" -> 1, "CPCT Exam 15" -> 15)
    return examList.sort((a, b) => {
      const getExamNumber = (title) => {
        const match = title.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      const numA = getExamNumber(a.title || '');
      const numB = getExamNumber(b.title || '');
      return numA - numB; // Ascending order: 1, 2, 3... 15
    });
  };

  return (
    <div className="min-h-screen bg-[#fff] flex flex-col">
      {/* Fixed Header Section - Title and Tabs */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-4">Exam Mode</h1>

          {/* Tab Navigation */}
          <div className="flex border border-gray-300 rounded-full overflow-hidden shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-1/4 py-4 text-[10px] md:text-[16px] font-medium transition-colors duration-300 border-l border-gray-300 ${
                  activeTab === tab.id
                    ? "bg-[#290c52] text-white"
                    : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading exams...</p>
            </div>
          )}

          {/* Content based on active tab */}
          {!loading && (
            <div className="space-y-4">
            {activeTab === "exam" ? (
              // Topic Wise MCQ Section
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
                        className="relative border border-gray-200 rounded-xl shadow-md p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#290c52] hover:text-white transition-colors duration-300"
                      >
                        {/* Red corner ribbon */}
                        <div className="absolute top-[-7] left-[-9]">
                          <img src="/newr.png" alt="" className="w-18 h-14" />
                        </div>

                        {/* Title with Free/Premium badge - Left side */}
                        <div className="flex items-center gap-2 pl-4 flex-1 min-w-0">
                          <div className="text-md font-medium break-words flex-1">{topic.topicName || topic.topicName_hi}</div>
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

                        {/* Start Practice Button - Right side */}
                        <button 
                          onClick={() => router.push(`/topicwise?topicId=${topic.topicId}`)}
                          className="relative bg-pink-300 hover:bg-yellow-500 text-black px-4 md:px-6 py-3 text-sm font-semibold rounded-md shadow-md cursor-pointer flex-shrink-0"
                        >
                          Start Practice
                          <img src="/new1.png" alt="" className="w-12 h-14 top-[-16] right-[-12] absolute" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Regular Exam Cards
              <>
                {getCurrentExams().length > 0 ? (
                  getCurrentExams().map((exam) => (
                    <div
                      key={exam._id}
                      className="relative border border-gray-200 rounded-xl shadow-md p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#290c52] hover:text-white transition-colors duration-300"
                    >
                      {/* Red corner ribbon */}
                      <div className="absolute top-[-7] left-[-9]">
                        <img src="/newr.png" alt="" className="w-18 h-14" />
                      </div>

                      {/* Title with Free/Premium badge - Left side */}
                      <div className="flex items-center gap-2 pl-4 flex-1 min-w-0">
                        <div className="text-md font-medium break-words flex-1">{exam.title}</div>
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

                      {/* Start Exam Button - Right side */}
                      <button className="relative bg-pink-300 hover:bg-yellow-500 text-black px-4 md:px-6 py-3 text-sm font-semibold rounded-md shadow-md flex-shrink-0">
                        <a href={getExamRoute(getCurrentExamKey(), exam._id)}> Start Exam</a>
                        <img src="/new1.png" alt="" className="w-12 h-14 top-[-16] right-[-12] absolute" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-gray-200 rounded-xl">
                    <p className="text-gray-600">No exams available for this mode. Please add exams from the admin panel.</p>
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
