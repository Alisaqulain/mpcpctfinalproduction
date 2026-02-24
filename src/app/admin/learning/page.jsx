"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LearningAdmin() {
  const router = useRouter();
  const [learningData, setLearningData] = useState(null);
  const [selectedSection, setSelectedSection] = useState("home");
  const [editingLesson, setEditingLesson] = useState(null);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/learning");
        if (!res.ok) {
          throw new Error("Failed to load learning data");
        }
        const json = await res.json();
        const sections = json.sections;
        const lessonsBySection = sections.map(section => ({
          ...section,
          lessons: json.lessons
            .filter(l => l.sectionId === section.id)
            .map(l => ({
              _id: l._id,
              id: l.id,
              title: l.title,
              description: l.description,
              difficulty: l.difficulty,
              estimatedTime: l.estimatedTime,
              lessonType: l.lessonType === "word" ? "word" : "alpha",
            }))
        }));
        setLearningData({ sections: lessonsBySection });
        if (sections.length > 0) setSelectedSection(sections[0].id);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (!learningData || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const currentSection = learningData.sections.find(section => section.id === selectedSection);
  const lessons = currentSection ? currentSection.lessons : [];

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
  };

  const handleSaveLesson = async (updatedLesson) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/learning", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lesson", _id: editingLesson._id, ...updatedLesson, sectionId: selectedSection })
      });
      if (!res.ok) throw new Error("Failed to update lesson");
      const refreshed = await fetch("/api/admin/learning");
      const json = await refreshed.json();
      const sections = json.sections;
      const lessonsBySection = sections.map(section => ({
        ...section,
        lessons: json.lessons
          .filter(l => l.sectionId === section.id)
          .map(l => ({
            _id: l._id,
            id: l.id,
            title: l.title,
            description: l.description,
            difficulty: l.difficulty,
            estimatedTime: l.estimatedTime,
            lessonType: l.lessonType === "word" ? "word" : "alpha",
          }))
      }));
      setLearningData({ sections: lessonsBySection });
      setEditingLesson(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (newLesson) => {
    setLoading(true);
    setError("");
    try {
      const lessonId = `${currentSection.lessonNumber}.${lessons.length + 1}`;
      const res = await fetch("/api/admin/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lesson", sectionId: selectedSection, id: lessonId, ...newLesson })
      });
      if (!res.ok) throw new Error("Failed to add lesson");
      setShowAddLesson(false);
      const refreshed = await fetch("/api/admin/learning");
      const json = await refreshed.json();
      const sections = json.sections;
      const lessonsBySection = sections.map(section => ({
        ...section,
        lessons: json.lessons
          .filter(l => l.sectionId === section.id)
          .map(l => ({
            _id: l._id,
            id: l.id,
            title: l.title,
            description: l.description,
            difficulty: l.difficulty,
            estimatedTime: l.estimatedTime,
            lessonType: l.lessonType === "word" ? "word" : "alpha",
          }))
      }));
      setLearningData({ sections: lessonsBySection });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Learning Data Admin</h1>
          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>
          )}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {learningData.sections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.lessonNumber}. {section.name} - {section.description}
                </option>
              ))}
            </select>
          </div>
          {currentSection && (
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold text-purple-800 mb-2">
                {currentSection.name} Section
              </h2>
              <p className="text-purple-600">{currentSection.description}</p>
              <p className="text-sm text-purple-500 mt-2">
                {lessons.length} lessons • Lesson {currentSection.lessonNumber}
              </p>
            </div>
          )}
          <div className="mb-6">
            <button
              onClick={() => setShowAddLesson(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Add New Lesson
            </button>
          </div>
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-lg font-semibold text-gray-800">
                        {lesson.id}
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {lesson.difficulty}
                      </span>
                      <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {lesson.lessonType === "word" ? "Word" : "Alphabet"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {lesson.estimatedTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-medium text-gray-800 mb-1">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600">{lesson.description}</p>
                  </div>
                  <button
                    onClick={() => handleEditLesson(lesson)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
          {editingLesson && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Edit Lesson</h3>
                <LessonForm
                  lesson={editingLesson}
                  onSave={handleSaveLesson}
                  onCancel={() => setEditingLesson(null)}
                />
              </div>
            </div>
          )}
          {showAddLesson && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Add New Lesson</h3>
                <LessonForm
                  onSave={handleAddLesson}
                  onCancel={() => setShowAddLesson(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonForm({ lesson, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: lesson?.title || "",
    description: lesson?.description || "",
    difficulty: lesson?.difficulty || "beginner",
    estimatedTime: lesson?.estimatedTime || "5 minutes",
    lessonType: lesson?.lessonType === "word" ? "word" : "alpha"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows="3"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Difficulty
        </label>
        <select
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Time
        </label>
        <input
          type="text"
          value={formData.estimatedTime}
          onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="e.g., 5 minutes"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lesson Type
        </label>
        <select
          value={formData.lessonType}
          onChange={(e) => setFormData({ ...formData, lessonType: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="alpha">Alphabet (character typing)</option>
          <option value="word">Word typing</option>
        </select>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
        >
          {lesson ? "Update" : "Add"} Lesson
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
