"use client";
import React, { useState, useEffect } from "react";
import LessonCard from "@/components/typing/LessonCard";
import VirtualKeyboard from "@/components/typing/VirtualKeyboard";
import TypingArea from "@/components/typing/TypingArea";
import UpgradePopup from "@/components/typing/UpgradePopup";

export default function CharacterTypingPage() {
  const [lessons, setLessons] = useState([]);
  const [selectedRow, setSelectedRow] = useState("home");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [language, setLanguage] = useState("English");
  const [scriptType, setScriptType] = useState("Inscript");
  const [userIsPremium, setUserIsPremium] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [blockedLesson, setBlockedLesson] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [loading, setLoading] = useState(true);

  const rows = [
    { id: "home", label: "Home Row", characters: ["a", "s", "d", "f", "j", "k", "l", ";"] },
    { id: "upper", label: "Upper Row", characters: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"] },
    { id: "lower", label: "Lower Row", characters: ["z", "x", "c", "v", "b", "n", "m"] }
  ];

  useEffect(() => {
    checkUserPremium();
    fetchLessons();
  }, [selectedRow, language]);

  const checkUserPremium = async () => {
    try {
      const res = await fetch("/api/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "learning", isFree: false })
      });
      const data = await res.json();
      // Grant access if hasAccess is true (covers subscription, admin, etc.)
      setUserIsPremium(data.hasAccess === true);
    } catch (error) {
      console.error("Failed to check premium status:", error);
    }
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        language,
        rowType: selectedRow
      });
      if (language === "Hindi") {
        params.append("scriptType", scriptType);
      }
      
      const res = await fetch(`/api/character-lessons?${params}`);
      const data = await res.json();
      if (data.success) {
        setLessons(data.lessons || []);
        // Set first lesson as free if none exist
        if (data.lessons.length > 0 && !data.lessons.some(l => l.isFree)) {
          // Auto-set first lesson as free (admin should do this, but fallback)
        }
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
  };

  const handleKeyPress = (key) => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 200);
  };

  const handleTypingComplete = (result) => {
    console.log("Typing completed:", result);
    // Could save progress here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#290c52] mb-6 text-center">
          Character Typing - Learning
        </h1>

        {/* Language Selection */}
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
          </div>
        </div>

        {/* Row Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 border-b">
            {rows.map((row) => (
              <button
                key={row.id}
                onClick={() => {
                  setSelectedRow(row.id);
                  setSelectedLesson(null);
                }}
                className={`px-6 py-3 font-semibold transition-colors ${
                  selectedRow === row.id
                    ? "bg-[#290c52] text-white border-b-2 border-[#290c52]"
                    : "text-gray-600 hover:text-[#290c52]"
                }`}
              >
                {row.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lessons Grid */}
        {!selectedLesson && (
          <div className="mb-6">
            {loading ? (
              <div className="text-center py-8">Loading lessons...</div>
            ) : lessons.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No lessons available for this row.</p>
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

        {/* Typing Practice Area */}
        {selectedLesson && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[#290c52]">
                {selectedLesson.title}
              </h2>
              <button
                onClick={() => setSelectedLesson(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Lessons
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Virtual Keyboard */}
              <div>
                <h3 className="font-semibold mb-3">Virtual Keyboard</h3>
                <VirtualKeyboard
                  language={language}
                  scriptType={language === "Hindi" ? scriptType : null}
                  activeKey={activeKey}
                  rowType={selectedRow}
                  highlightRow={true}
                />
              </div>

              {/* Typing Area */}
              <div>
                <h3 className="font-semibold mb-3">Practice Area</h3>
                <TypingArea
                  content={selectedLesson.characters.join(" ")}
                  onComplete={handleTypingComplete}
                  allowBackspace={false}
                  language={language}
                  scriptType={language === "Hindi" ? scriptType : null}
                  mode="character"
                />
              </div>
            </div>
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






