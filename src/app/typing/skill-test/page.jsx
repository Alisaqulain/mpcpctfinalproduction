"use client";
import React, { useState, useEffect } from "react";
import LessonCard from "@/components/typing/LessonCard";
import TypingArea from "@/components/typing/TypingArea";
import UpgradePopup from "@/components/typing/UpgradePopup";

export default function SkillTestPage() {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [language, setLanguage] = useState("English");
  const [scriptType, setScriptType] = useState("Inscript");
  const [contentType, setContentType] = useState("word"); // "word" or "paragraph"
  const [userIsPremium, setUserIsPremium] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [blockedLesson, setBlockedLesson] = useState(null);
  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 100,
    mistakes: 0,
    backspaceCount: 0,
    timeLeft: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserPremium();
    fetchLessons();
  }, [language, contentType]);

  const checkUserPremium = async () => {
    try {
      const res = await fetch("/api/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "skill", isFree: false })
      });
      const data = await res.json();
      setUserIsPremium(data.hasAccess && data.reason === "subscription");
    } catch (error) {
      console.error("Failed to check premium status:", error);
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        language,
        contentType
      });
      if (language === "Hindi") {
        params.append("scriptType", scriptType);
      }
      
      const res = await fetch(`/api/skill-lessons?${params}`);
      const data = await res.json();
      if (data.success) {
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    if (!lesson.isFree && !userIsPremium) {
      setBlockedLesson(lesson);
      setShowUpgradePopup(true);
      return;
    }
    setSelectedLesson(lesson);
    setStats({
      wpm: 0,
      accuracy: 100,
      mistakes: 0,
      backspaceCount: 0,
      timeLeft: lesson.duration * 60
    });
  };

  const handleTypingComplete = (result) => {
    console.log("Typing completed:", result);
    // Show completion message or redirect
    alert(`Test Complete!\nMistakes: ${result.mistakes}\nBackspace: ${result.backspaceCount}`);
  };

  const handleProgress = (progressStats) => {
    setStats(progressStats);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#290c52] mb-6 text-center">
          Word / Paragraph Typing - Skill Test
        </h1>

        {/* Language & Content Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">Language:</label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setSelectedLesson(null);
              }}
              className="border rounded px-4 py-2"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>

            {language === "Hindi" && (
              <>
                <label className="font-semibold">Script Type:</label>
                <select
                  value={scriptType}
                  onChange={(e) => {
                    setScriptType(e.target.value);
                    setSelectedLesson(null);
                  }}
                  className="border rounded px-4 py-2"
                >
                  <option value="Remington Gail">Remington Gail</option>
                  <option value="Inscript">Inscript</option>
                </select>
              </>
            )}

            <label className="font-semibold">Content Type:</label>
            <select
              value={contentType}
              onChange={(e) => {
                setContentType(e.target.value);
                setSelectedLesson(null);
              }}
              className="border rounded px-4 py-2"
            >
              <option value="word">Word</option>
              <option value="paragraph">Paragraph</option>
            </select>
          </div>
        </div>

        {/* Lessons Grid */}
        {!selectedLesson && (
          <div className="mb-6">
            {loading ? (
              <div className="text-center py-8">Loading lessons...</div>
            ) : lessons.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No lessons available.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Contact admin to add lessons.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => (
                  <LessonCard
                    key={lesson._id}
                    lesson={lesson}
                    isFree={lesson.isFree}
                    userIsPremium={userIsPremium}
                    onClick={() => handleLessonClick(lesson)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Typing Test Area */}
        {selectedLesson && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#290c52]">
                {selectedLesson.title}
              </h2>
              <button
                onClick={() => {
                  setSelectedLesson(null);
                  setStats({
                    wpm: 0,
                    accuracy: 100,
                    mistakes: 0,
                    backspaceCount: 0,
                    timeLeft: null
                  });
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Lessons
              </button>
            </div>

            {/* Stats Display */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.wpm}</div>
                <div className="text-sm text-gray-600">WPM</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{stats.mistakes}</div>
                <div className="text-sm text-gray-600">Mistakes</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.backspaceCount}</div>
                <div className="text-sm text-gray-600">Backspace</div>
              </div>
              {stats.timeLeft !== null && (
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.floor(stats.timeLeft / 60)}:{(stats.timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-gray-600">Time Left</div>
                </div>
              )}
            </div>

            {/* Typing Area */}
            <TypingArea
              content={selectedLesson.textContent}
              onComplete={handleTypingComplete}
              onProgress={handleProgress}
              showTimer={true}
              duration={selectedLesson.duration}
              allowBackspace={true}
              language={language}
              scriptType={language === "Hindi" ? scriptType : null}
              mode="word"
            />
          </div>
        )}

        {/* Upgrade Popup */}
        {showUpgradePopup && blockedLesson && (
          <UpgradePopup
            onClose={() => {
              setShowUpgradePopup(false);
              setBlockedLesson(null);
            }}
            lessonTitle={blockedLesson.title}
          />
        )}
      </div>
    </div>
  );
}






