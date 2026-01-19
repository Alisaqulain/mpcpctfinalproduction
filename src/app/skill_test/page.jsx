"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { getLearningData, getLessonContent } from "@/lib/learningData";

export default function TypingTutor() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedSubLanguage, setSelectedSubLanguage] = useState("");
  const [duration, setDuration] = useState(5);
  const [selected, setSelected] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [backspace, setBackspace] = useState("OFF");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: "",
    content_english: "",
    content_hindi_ramington: "",
    content_hindi_inscript: "",
    difficulty: "beginner"
  });
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // Data from API
  const [skillTestData, setSkillTestData] = useState({
    exercises: [],
    exams: [],
    settings: {
      mainLanguages: ["Hindi", "English"],
      subLanguages: ["Ramington Gail", "Inscript"],
      backspaceOptions: ["OFF", "ON"],
      durations: [2, 5, 10, 15, 20, 30],
      description: "Matter to type is given on upper half part of screen. Word to type is highlighted. Back space is allowed till current word. Wrong typed word makes bold. So user can identify such mistakes. One or more word afterwards the highlighted word can be skipped, if needed. Skipped word will not added as mistakes.",
      description_hindi: ""
    }
  });
  const [loading, setLoading] = useState(true);

  // Load learning data for exercise content linking
  const [learningData, setLearningData] = useState(null);
  
  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Profile API returns 'id', not '_id'
          const userId = data.user?.id || data.user?._id;
          if (userId) {
            const userIdString = userId.toString();
            console.log('[Skill Test] Current user ID:', userIdString);
            setCurrentUserId(userIdString);
          } else {
            console.warn('[Skill Test] No user ID found in profile response:', data);
          }
        } else {
          console.warn('[Skill Test] Failed to fetch profile:', res.status);
        }
      } catch (error) {
        console.error('[Skill Test] Failed to get user ID:', error);
      }
    };
    getUserId();
  }, []);

  // Fetch skill test data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/skill-test?' + new Date().getTime(), {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          console.log('[Skill Test Page] Loaded data:', data.exercises?.length, 'exercises,', data.exams?.length, 'exams');
          console.log('[Skill Test Page] Exercises:', data.exercises);
          setSkillTestData(data);
          
          // Set default selections only if not already set
          if (data.exercises && data.exercises.length > 0) {
            setSelected(prev => prev || data.exercises[0].id);
          }
          if (data.exams && data.exams.length > 0) {
            setSelectedExam(prev => prev || data.exams[0].id);
          }
        } else {
          console.error('Failed to fetch skill test data:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch skill test data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load learning data for exercise content
  useEffect(() => {
    const fetchLearningData = async () => {
      try {
        const res = await fetch('/api/learning?' + new Date().getTime());
        if (res.ok) {
          const data = await res.json();
          setLearningData(data);
        } else {
          // Fallback to local data
          const data = getLearningData();
          setLearningData(data);
        }
      } catch (error) {
        console.error('Failed to fetch learning data:', error);
        // Fallback to local data
        const data = getLearningData();
        setLearningData(data);
      }
    };
    fetchLearningData();
  }, []);

  // Flatten lessons to map exercises -> lessons
  const lessonsFlat = useMemo(() => {
    if (!learningData) return [];
    const all = [];
    for (const section of learningData.sections || []) {
      for (const lesson of section.lessons || []) {
        all.push({ ...lesson, sectionId: section.id, sectionName: section.name });
      }
    }
    return all;
  }, [learningData]);

  // Get selected exercise
  const selectedExercise = useMemo(() => {
    return skillTestData.exercises.find(e => e.id === selected);
  }, [skillTestData.exercises, selected]);

  // Get selected exam
  const selectedExamData = useMemo(() => {
    return skillTestData.exams.find(e => e.id === selectedExam);
  }, [skillTestData.exams, selectedExam]);

  // Compute preview content based on language/script
  const previewContent = useMemo(() => {
    if (!selectedExercise) return "";
    
    // If exercise is linked to a lesson, use lesson content
    if (selectedExercise.lessonId) {
      const linkedLesson = lessonsFlat.find(l => l.id === selectedExercise.lessonId);
      if (linkedLesson) {
        const languageKey = selectedLanguage.toLowerCase();
        const subLangKey = (selectedSubLanguage || "").toLowerCase().includes("ramington")
          ? "ramington"
          : (selectedSubLanguage || "").toLowerCase().includes("inscript")
          ? "inscript"
          : "";
        return getLessonContent(linkedLesson, languageKey, subLangKey) || "";
      }
    }
    
    // Otherwise use exercise's custom content
    const content = selectedExercise.content || {};
    if (selectedLanguage.toLowerCase() === "hindi") {
      if ((selectedSubLanguage || "").toLowerCase().includes("ramington")) {
        return content.hindi_ramington || "";
      } else if ((selectedSubLanguage || "").toLowerCase().includes("inscript")) {
        return content.hindi_inscript || "";
      }
      return content.hindi_ramington || "";
    }
    return content.english || "";
  }, [selectedExercise, selectedLanguage, selectedSubLanguage, lessonsFlat]);

  // Get description based on language
  const description = useMemo(() => {
    if (!selectedExamData) return skillTestData.settings.description;
    if (selectedLanguage.toLowerCase() === "hindi" && selectedExamData.description_hindi) {
      return selectedExamData.description_hindi;
    }
    return selectedExamData.description || skillTestData.settings.description;
  }, [selectedExamData, selectedLanguage, skillTestData.settings.description]);

  // Handle exercise upload
  const handleUploadExercise = async (e) => {
    e.preventDefault();
    
    if (useFileUpload && uploadFile) {
      // File upload mode
      if (!uploadForm.name) {
        alert('Please enter exercise name');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('name', uploadForm.name);
        formData.append('difficulty', uploadForm.difficulty);

        const res = await fetch('/api/user-exercises/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          alert('Exercise uploaded successfully from file!');
          setUploadForm({
            name: "",
            content_english: "",
            content_hindi_ramington: "",
            content_hindi_inscript: "",
            difficulty: "beginner"
          });
          setUploadFile(null);
          setUseFileUpload(false);
          setShowUploadForm(false);
          // Refresh data
          window.location.reload();
        } else {
          const data = await res.json();
          if (data.extractedText) {
            // If extraction partially worked, show the text and let user edit
            setUploadForm({
              ...uploadForm,
              content_english: data.extractedText
            });
            setUseFileUpload(false);
            alert('Text extracted from file. Please review and edit the content, then submit again.');
          } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
      } finally {
        setUploading(false);
      }
    } else {
      // Manual text entry mode
      if (!uploadForm.name || !uploadForm.content_english) {
        alert('Please fill in exercise name and English content');
        return;
      }

      setUploading(true);
      try {
        const res = await fetch('/api/user-exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: uploadForm.name,
            content: {
              english: uploadForm.content_english,
              hindi_ramington: uploadForm.content_hindi_ramington,
              hindi_inscript: uploadForm.content_hindi_inscript
            },
            difficulty: uploadForm.difficulty
          })
        });

        if (res.ok) {
          alert('Exercise uploaded successfully!');
          setUploadForm({
            name: "",
            content_english: "",
            content_hindi_ramington: "",
            content_hindi_inscript: "",
            difficulty: "beginner"
          });
          setShowUploadForm(false);
          // Refresh data
          window.location.reload();
        } else {
          const data = await res.json();
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle exercise delete
  const handleDeleteExercise = async (exercise) => {
    // Basic validation - backend will verify ownership
    if (!exercise.isUserExercise || !exercise._id) {
      alert('You can only delete your own exercises');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/user-exercises?_id=${exercise._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        // Remove the exercise from the list without full page reload
        setSkillTestData(prev => ({
          ...prev,
          exercises: prev.exercises.filter(ex => ex._id !== exercise._id)
        }));
        
        // If deleted exercise was selected, clear selection
        if (selected === exercise.id) {
          setSelected('');
        }
        
        alert('Exercise deleted successfully!');
      } else {
        const data = await res.json();
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <div className="bg-[#290c52] text-yellow-400 p-3 md:p-4  shadow-md mb-4">
        <h1 className="text-lg md:text-2xl font-bold text-center">Skill Test</h1>
      </div>

      {/* Settings Section - Top Row */}
      <div className="bg-white border border-[#290c52] rounded-lg shadow-md p-4 md:p-6 mb-4">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    
    {/* Language Selection */}
    <div className="bg-[#290c52] p-4 rounded-lg border border-[#ffffff40]">
      <h3 className="font-bold text-sm mb-3 text-white flex items-center gap-2">
        <span className="bg-yellow-400 text-[#290c52] rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
        Select Typing Language
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {(skillTestData.settings.mainLanguages || []).map((lang) => (
          <label
            key={lang}
            className="flex items-center gap-2 p-2 rounded cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 transition-all"
          >
            <input
              type="radio"
              name="mainLanguage"
              className="w-4 h-4"
              value={lang}
              checked={selectedLanguage === lang}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setSelectedSubLanguage("");
              }}
            />
            <span className="text-xs md:text-sm font-medium text-[#290c52]">{lang}</span>
          </label>
        ))}
      </div>

      {/* Sub Language */}
      {selectedLanguage === "Hindi" && (
        <div className="mt-4 pt-3 border-t border-white/40">
          <div className="text-xs md:text-sm font-medium text-white mb-2">Script Type:</div>

          <div className="grid grid-cols-2 gap-2">
            {(skillTestData.settings.subLanguages || []).map((subLang) => (
              <label
                key={subLang}
                className="flex items-center gap-2 p-2 rounded cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 transition-all"
              >
                <input
                  type="radio"
                  name="subLanguage"
                  className="w-4 h-4"
                  value={subLang}
                  checked={selectedSubLanguage === subLang}
                  onChange={(e) => setSelectedSubLanguage(e.target.value)}
                />
                <span className="text-xs md:text-sm font-medium text-[#290c52]">{subLang}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Duration */}
    <div className="bg-[#290c52] p-4 rounded-lg border border-[#ffffff40]">
      <h3 className="font-bold text-sm mb-3 text-white flex items-center gap-2">
        <span className="bg-yellow-400 text-[#290c52] rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
        Select Duration (Minutes)
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {(skillTestData.settings.durations || []).map((time) => (
          <label
            key={time}
            className="flex items-center justify-center gap-2 p-2 rounded cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 transition-all"
          >
            <input
              type="radio"
              name="duration"
              className="w-4 h-4"
              value={time}
              checked={duration === time}
              onChange={() => setDuration(time)}
            />
            <span className="text-xs md:text-sm font-semibold text-[#290c52]">{time}M</span>
          </label>
        ))}
      </div>
    </div>

    {/* Backspace */}
    <div className="bg-[#290c52] p-4 rounded-lg border border-[#ffffff40]">
      <h3 className="font-bold text-sm mb-3 text-white flex items-center gap-2">
        <span className="bg-yellow-400 text-[#290c52] rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
        Backspace Option
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {(skillTestData.settings.backspaceOptions || []).map((option) => (
          <label
            key={option}
            className="flex items-center justify-center gap-2 p-2 rounded cursor-pointer bg-white border border-gray-300 hover:bg-gray-100 transition-all"
          >
            <input
              type="radio"
              name="backspace"
              className="w-4 h-4"
              value={option}
              checked={backspace === option}
              onChange={() => setBackspace(option)}
            />
            <span className="text-xs md:text-sm font-semibold text-[#290c52]">{option}</span>
          </label>
        ))}
      </div>
    </div>

  </div>
</div>





      {/* Exercise Selection & Preview - Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden mb-4">
        <div className="bg-[#290c52] text-white p-3 border-b border-gray-300">
          <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-yellow-400 text-[#290c52] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
            Select Exercise & Preview Content
          </h2>
        </div>
        <div className="flex flex-col md:flex-row min-h-[500px]">
          {/* Exercise List - Left Sidebar */}
          <div className="w-full md:w-80 border-r border-gray-300 bg-white p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm md:text-base font-semibold text-gray-700">Available Exercises</h3>
              <div className="flex items-center gap-2">
                {selectedExercise && selectedExercise.isUserExercise && (
                  <button
                    onClick={() => {
                      if (selectedExercise) {
                        handleDeleteExercise(selectedExercise);
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                    title="Delete selected exercise"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                >
                  {showUploadForm ? 'Cancel' : '+ Upload'}
                </button>
              </div>
            </div>
            
            {/* Upload Form */}
            {showUploadForm && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <form onSubmit={handleUploadExercise} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Exercise Name *"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm"
                    required
                  />
                  
                  {/* File Upload Toggle */}
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useFileUpload}
                        onChange={(e) => {
                          setUseFileUpload(e.target.checked);
                          if (e.target.checked) {
                            setUploadForm({...uploadForm, content_english: ""});
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium">Upload from File (PDF/Word/TXT)</span>
                    </label>
                    <p className="text-xs text-gray-600 mt-1 ml-6">
                      Check to upload PDF, Word (.doc, .docx), or Text file. Uncheck to enter text manually.
                    </p>
                  </div>

                  {useFileUpload ? (
                    <div>
                      <label className="block text-xs font-medium mb-1">Select File (PDF/Word/TXT) *</label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="w-full border rounded px-2 py-1 text-sm"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supported: PDF, Word (.doc, .docx), Text (.txt)
                      </p>
                    </div>
                  ) : (
                    <>
                      <textarea
                        placeholder="English Content *"
                        value={uploadForm.content_english}
                        onChange={(e) => setUploadForm({...uploadForm, content_english: e.target.value})}
                        className="w-full border rounded px-2 py-1 text-sm"
                        rows="3"
                        required
                      />
                      <textarea
                        placeholder="Hindi Ramington (Optional)"
                        value={uploadForm.content_hindi_ramington}
                        onChange={(e) => setUploadForm({...uploadForm, content_hindi_ramington: e.target.value})}
                        className="w-full border rounded px-2 py-1 text-sm"
                        rows="2"
                      />
                      <textarea
                        placeholder="Hindi Inscript (Optional)"
                        value={uploadForm.content_hindi_inscript}
                        onChange={(e) => setUploadForm({...uploadForm, content_hindi_inscript: e.target.value})}
                        className="w-full border rounded px-2 py-1 text-sm"
                        rows="2"
                      />
                    </>
                  )}
                  
                  <select
                    value={uploadForm.difficulty}
                    onChange={(e) => setUploadForm({...uploadForm, difficulty: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-semibold"
                  >
                    {uploading ? 'Uploading...' : useFileUpload ? 'Upload from File' : 'Upload Exercise'}
                  </button>
                </form>
              </div>
            )}
            <div
              className=" h-[200px] md:h-[450px] overflow-y-scroll pr-2 border border-gray-300 rounded-lg bg-white shadow-inner"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#a0aec0 #f1f1f1",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 8px;
                  display: block;
                  -webkit-appearance: none;
                }
                div::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                  background-color: #a0aec0;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background-color: #718096;
                }
                @media (max-width: 768px) {
                  div::-webkit-scrollbar {
                    width: 8px;
                    display: block !important;
                    -webkit-appearance: none;
                  }
                  div::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background-color: #a0aec0;
                    border-radius: 4px;
                  }
                }
              `}</style>

              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#290c52] mx-auto mb-2"></div>
                  <p className="text-sm">Loading exercises...</p>
                </div>
              ) : !skillTestData.exercises || skillTestData.exercises.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm mb-2">No exercises available</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Refresh Page
                  </button>
                </div>
              ) : (
                skillTestData.exercises.map((exercise, index) => {
                  // Debug logging for user exercises
                  if (exercise.isUserExercise) {
                    console.log('[Skill Test] User exercise found:', {
                      name: exercise.name,
                      exerciseUserId: exercise.userId,
                      exerciseUserIdType: typeof exercise.userId,
                      currentUserId: currentUserId,
                      currentUserIdType: typeof currentUserId,
                      isUserExercise: exercise.isUserExercise,
                      _id: exercise._id
                    });
                  }
                  
                  // Check if this is the current user's exercise
                  const isMyExercise = exercise.isUserExercise && 
                                       exercise.userId && 
                                       currentUserId && 
                                       (String(exercise.userId) === String(currentUserId) || 
                                        exercise.userId.toString() === currentUserId.toString());
                  
                  return (
                  <div
                    key={exercise.id}
                    className={`p-3 mb-2 rounded-lg transition-all ${
                      selected === exercise.id
                        ? "bg-[#290c52] text-white shadow-lg transform scale-[1.02]"
                        : "bg-white hover:bg-[#290c52]/10 border border-gray-200 hover:border-[#290c52]/30"
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between gap-2"
                    >
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => setSelected(exercise.id)}
                      >
                        <span className={`text-xs font-bold ${
                          selected === exercise.id ? "text-yellow-400" : "text-[#290c52]"
                        }`}>
                          {index + 1}.
                        </span>
                        <div className="text-xs md:text-sm font-medium flex-1 flex items-center gap-2">
                          {exercise.name}
                          {exercise.isUserExercise && (
                            <span className="text-[8px] md:text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded" title="Your uploaded exercise">
                              📤 Your Upload
                            </span>
                          )}
                        </div>
                      </div>
                      {exercise.isUserExercise && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(exercise);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-md hover:shadow-lg flex-shrink-0 z-10"
                          title="Delete your uploaded exercise"
                          aria-label="Delete exercise"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>

          {/* Exercise Preview - Right Content */}
          <div className="flex-1 p-4 md:p-6 bg-white border-l border-gray-200 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                {selectedExercise ? selectedExercise.name : "Exercise Preview"}
              </h3>
              {previewContent && (
                <div className="text-xs md:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  <span className="font-semibold">Characters:</span> {previewContent.length} | 
                  <span className="font-semibold ml-2">Words:</span> {previewContent.trim().split(/\s+/).length}
                </div>
              )}
            </div>
            <div className="border-2 border-gray-300 p-4 md:p-6 text-sm md:text-base leading-relaxed h-[150px] md:h-[450px] overflow-y-auto bg-gray-50 rounded-lg shadow-inner font-serif w-full" style={{ wordWrap: 'normal', overflowWrap: 'normal', wordBreak: 'normal', whiteSpace: 'normal', hyphens: 'none' }}>
              {previewContent ? (
                <div className="text-gray-800 whitespace-pre-wrap w-full" style={{ wordWrap: 'normal', overflowWrap: 'normal', wordBreak: 'normal', whiteSpace: 'pre-wrap', hyphens: 'none', width: '100%', maxWidth: '100%' }}>{previewContent}</div>
              ) : (
                <div className="text-gray-400 text-center py-20">
                  <p className="text-lg mb-2">No exercise selected</p>
                  <p className="text-sm">Please select an exercise from the left panel to preview its content</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start Test Button */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-center p-4 md:p-6">
          <a
            href={selected ? `/typing?exercise=${selected}&language=${selectedLanguage.toLowerCase()}&subLanguage=${selectedSubLanguage.toLowerCase()}&duration=${duration}&backspace=${backspace}` : '#'}
            className={`px-50 py-3 rounded-lg text-xl md:text-2xl font-semibold shadow-md transition-all text-center whitespace-nowrap ${
              selected 
                ? 'bg-green-600 text-white hover:bg-[#3d1470] transform hover:scale-105' 
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
            onClick={(e) => {
              if (!selected) {
                e.preventDefault();
                alert('Please select an exercise first');
              }
            }}
          >
            {selected ? '▶ Start Test' : 'Select an Exercise First'}
          </a>
        </div>
      </div>
    </div>
  );
}