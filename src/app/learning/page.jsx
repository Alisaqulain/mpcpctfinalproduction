"use client";
import React, { useState, useEffect } from "react";
import { 
  getLearningData, 
  getSections, 
  getLanguages, 
  getSettings,
  getLessonsBySection,
  getProgressStats,
  getLessonContent,
  getAvailableLanguages,
  validateLanguageSelection
} from "@/lib/learningData";

export default function TypingTutor() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedSubLanguage, setSelectedSubLanguage] = useState("");
  const [duration, setDuration] = useState(5);
  const [backspace, setBackspace] = useState("OFF");
  const [selectedSection, setSelectedSection] = useState("home");
  const [selectedCheckbox, setSelectedCheckbox] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [stats, setStats] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [currentLessonContent, setCurrentLessonContent] = useState("");
  const [userSubscription, setUserSubscription] = useState(null);
  const [accessChecks, setAccessChecks] = useState({});

  // Check user subscription and access
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/check-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'learning', isFree: false }),
          credentials: 'include'
        });
        const data = await res.json();
        if (data.hasAccess && data.reason === 'subscription') {
          setUserSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to check access:', error);
      }
    };
    checkAccess();
  }, []);

  // Check access for each lesson
  const checkLessonAccess = async (lesson) => {
    if (accessChecks[lesson.id] !== undefined) {
      return accessChecks[lesson.id];
    }
    
    try {
      const res = await fetch('/api/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'learning', 
          isFree: lesson.isFree || false,
          itemId: lesson.id 
        }),
        credentials: 'include'
      });
      const data = await res.json();
      const hasAccess = data.hasAccess;
      setAccessChecks(prev => ({ ...prev, [lesson.id]: hasAccess }));
      return hasAccess;
    } catch (error) {
      console.error('Failed to check lesson access:', error);
      return false;
    }
  };

  useEffect(() => {
    // Load learning data from API
    const fetchData = async () => {
      try {
        // Add cache-busting to ensure fresh data
        const res = await fetch('/api/learning?' + new Date().getTime());
        if (res.ok) {
          const data = await res.json();
          console.log('[Learning Page] Loaded data:', data.sections?.length, 'sections,', data.sections?.reduce((sum, s) => sum + (s.lessons?.length || 0), 0), 'lessons');
          setLearningData(data);
          
          // Calculate statistics
          const totalLessons = data.metadata?.totalLessons || 0;
          const sections = data.sections?.length || 0;
          const totalTime = data.metadata?.estimatedTotalTime || "0 minutes";
          const difficultyBreakdown = {};
          data.sections?.forEach(section => {
            section.lessons?.forEach(lesson => {
              difficultyBreakdown[lesson.difficulty] = (difficultyBreakdown[lesson.difficulty] || 0) + 1;
            });
          });
          setStats({
            totalLessons,
            sections,
            totalTime,
            difficultyBreakdown
          });
          
          // Load available languages
          if (data.languages?.main) {
            setAvailableLanguages(data.languages.main.map(lang => ({
              id: lang.id,
              name: lang.name,
              subLanguages: lang.subLanguages || []
            })));
          }
        } else {
          // Fallback to local data if API fails
          const data = getLearningData();
          setLearningData(data);
          const statistics = getProgressStats();
          setStats(statistics);
          const languages = getAvailableLanguages();
          setAvailableLanguages(languages);
        }
      } catch (error) {
        console.error('Failed to fetch learning data:', error);
        // Fallback to local data
        const data = getLearningData();
        setLearningData(data);
        const statistics = getProgressStats();
        setStats(statistics);
        const languages = getAvailableLanguages();
        setAvailableLanguages(languages);
      }
    };
    fetchData();
  }, []);

  // Update lesson content when language or lesson selection changes
  useEffect(() => {
    if (learningData && selectedCheckbox) {
      const lesson = selectedCheckbox;
      const languageId = selectedLanguage.toLowerCase();
      const subLanguageId = selectedSubLanguage.toLowerCase();
      
      // Get content based on language
      let contentKey = 'english';
      if (languageId === 'hindi') {
        if (subLanguageId === 'ramington') {
          contentKey = 'hindi_ramington';
        } else if (subLanguageId === 'inscript') {
          contentKey = 'hindi_inscript';
        } else {
          contentKey = 'hindi_ramington'; // default
        }
      }
      
      const content = lesson.content?.[contentKey] || lesson.content?.english || "Content not available";
      const scriptIndicator = (languageId === 'hindi' && subLanguageId) 
        ? (subLanguageId === 'ramington' ? '[Ramington Gail] ' : '[Inscript] ')
        : '';
      setCurrentLessonContent(scriptIndicator + content);
    }
  }, [selectedLanguage, selectedSubLanguage, selectedCheckbox, learningData]);

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    // Reset sub-language when main language changes
    setSelectedSubLanguage("");
  };

  const handleSubLanguageChange = (subLanguage) => {
    setSelectedSubLanguage(subLanguage);
  };

  const handleCheckboxChange = async (lesson) => {
    // Check if lesson is free (always allow free content)
    const isFree = lesson.isFree === true || lesson.isFree === 'true';
    
    // If free, always allow access
    if (isFree) {
      setSelectedCheckbox(lesson);
      return;
    }
    
    // For paid content, check subscription
    const hasAccess = userSubscription || await checkLessonAccess(lesson);
    
    if (!hasAccess) {
      // Show message and redirect to pricing
      alert('Please purchase subscription to access this content');
      window.location.href = '/price?type=learning';
      return;
    }
    
    setSelectedCheckbox(lesson);
  };

  if (!learningData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const currentSection = learningData.sections?.find(section => section.id === selectedSection);
  const lessons = currentSection ? currentSection.lessons : [];
  const languages = learningData.languages || getLanguages();
  const settings = learningData.settings || getSettings();

  return (
    <div className="bg-white font-sans min-h-screen p-4">
      {/* Progress Stats Banner */}
      {stats && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg mb-4">
          <div className="flex flex-wrap justify-between items-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalLessons}</div>
              <div className="text-sm">Total Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.sections}</div>
              <div className="text-sm">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalTime}</div>
              <div className="text-sm">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Object.values(stats.difficultyBreakdown).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm">Available</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Settings Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 md:p-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Language Selection */}
          <div className="bg-gradient-to-br from-[#290c52]/10 to-[#290c52]/20 p-4 rounded-lg border-2 border-[#290c52]/30">
            <h3 className="font-bold text-sm md:text-base mb-3 text-gray-800 flex items-center gap-2">
              <span className="bg-[#290c52] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
              Select Typing Language
            </h3>
            <div className="space-y-2 mb-3">
              <div className="text-xs md:text-sm font-medium text-gray-700 mb-1">Main Language:</div>
              <div className="grid grid-cols-2 gap-2">
                {languages.main.map((lang) => (
                  <label
                    key={lang.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                      selectedLanguage === lang.name
                        ? "bg-[#290c52] text-white shadow-md"
                        : "bg-white hover:bg-[#290c52]/10 border border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mainLanguage"
                      className="w-4 h-4"
                      value={lang.name}
                      checked={selectedLanguage === lang.name}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    />
                    <span className="text-xs md:text-sm font-medium">{lang.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {languages.main.find(lang => lang.name === selectedLanguage)?.subLanguages.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-[#290c52]/30">
                <div className="text-xs md:text-sm font-medium text-gray-700 mb-1">Script Type:</div>
                <div className="grid grid-cols-2 gap-2">
                  {languages.main.find(lang => lang.name === selectedLanguage)?.subLanguages.map((subLang) => (
                    <label
                      key={subLang.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                        selectedSubLanguage === subLang.name
                          ? "bg-[#290c52] text-white shadow-md"
                          : "bg-white hover:bg-[#290c52]/10 border border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="subLanguage"
                        className="w-4 h-4"
                        value={subLang.name}
                        checked={selectedSubLanguage === subLang.name}
                        onChange={(e) => handleSubLanguageChange(e.target.value)}
                      />
                      <span className="text-xs md:text-sm font-medium">{subLang.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="bg-gradient-to-br from-[#290c52]/10 to-[#290c52]/20 p-4 rounded-lg border-2 border-[#290c52]/30">
            <h3 className="font-bold text-sm md:text-base mb-3 text-gray-800 flex items-center gap-2">
              <span className="bg-[#290c52] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
              Select Duration (Minutes)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {settings.durations.map((time) => (
                <label
                  key={time}
                  className={`p-2 rounded text-center font-medium cursor-pointer transition-all border-2 ${
                    duration === time
                      ? "bg-[#290c52] text-white border-[#290c52] shadow-md transform scale-105"
                      : "bg-white hover:bg-[#290c52]/10 border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={time}
                    className="hidden"
                    onChange={() => setDuration(time)}
                    checked={duration === time}
                  />
                  <span className="text-xs md:text-sm">{time}M</span>
                </label>
              ))}
            </div>
          </div>

          {/* Backspace */}
          <div className="bg-gradient-to-br from-[#290c52]/10 to-[#290c52]/20 p-4 rounded-lg border-2 border-[#290c52]/30">
            <h3 className="font-bold text-sm md:text-base mb-3 text-gray-800 flex items-center gap-2">
              <span className="bg-[#290c52] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
              Backspace Option
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {settings.backspaceOptions.map((option) => (
                <label
                  key={option}
                  className={`p-3 rounded text-center font-medium cursor-pointer transition-all border-2 ${
                    backspace === option
                      ? "bg-[#290c52] text-white border-[#290c52] shadow-md transform scale-105"
                      : "bg-white hover:bg-[#290c52]/10 border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="backspace"
                    value={option}
                    className="hidden"
                    onChange={() => setBackspace(option)}
                    checked={backspace === option}
                  />
                  <span className="text-xs md:text-sm font-semibold">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="flex flex-row min-h-screen bg-blue-200 bg-[url('/bg.jpg')]">
        {/* Sidebar Navigation */}
        <div className="w-32 bg-transparent text-white pt-14 space-y-17 text-xl md:text-4xl pl-2 md:pl-10 flex flex-col">
          {learningData.sections?.map((section, index) => (
            <p
              key={section.id}
              onClick={() => {
                setSelectedSection(section.id);
                setSelectedCheckbox(null);
              }}
              className={`cursor-pointer py-2 rounded-md ${
                selectedSection === section.id 
                  ? "w-[500] bg-white text-[#290c52] font-bold pl-2" 
                  : "w-[190px] border-none pl-2"
              }`}
            >
              {section.lessonNumber}.{section.name}
            </p>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white p-6 shadow-md w-[60%] md:w-[70%] mx-auto mt-5 mr-2 md:mr-25">
          {currentSection && (
            <>
          <h2 className="text-center font-bold italic mb-4 text-md md:text-5xl">
                Lesson {currentSection.lessonNumber} - {currentSection.name} Row
          </h2>
              <p className="text-center text-gray-600 mb-6">{currentSection.description}</p>

          {/* Lesson List with Single Select Checkbox */}
          <ul className="space-y-8 mb-6 ml-0 md:ml-75 mt-10">
                {lessons.map((lesson, idx) => {
                  // Check if lesson is free - handle boolean, string, or undefined
                  const isFree = lesson.isFree === true || lesson.isFree === 'true';
                  // Free content is always accessible - no need to check subscription
                  const hasAccess = isFree ? true : (userSubscription || accessChecks[lesson.id] === true);
                  // Only lock if it's NOT free AND user doesn't have access
                  const isLocked = !isFree && !hasAccess;
                  
                  return (
                  <li 
                    key={lesson.id} 
                    className={`flex items-center gap-4 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={isLocked ? 'Please purchase subscription to access this content' : ''}
                  >
  {/* Lesson Number */}
  <span className="text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
                      {lesson.id}
  </span>

  {/* Lock Icon or Checkbox */}
  {isLocked ? (
    <div className="relative group">
      <svg 
        className="w-6 h-6 text-gray-400 flex-shrink-0" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
        Please purchase subscription
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  ) : (
    <input
      type="checkbox"
      className="w-5 h-5 accent-green-500 flex-shrink-0"
      checked={selectedCheckbox?.id === lesson.id}
      onChange={() => handleCheckboxChange(lesson)}
    />
  )}

  {/* Lesson Title */}
                    <div className="flex-1">
                      <span className={`text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl ${isLocked ? 'text-gray-400' : ''}`}>
                        {selectedLanguage === "Hindi" && lesson.title_hindi ? lesson.title_hindi : lesson.title}
                      </span>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {lesson.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          {lesson.estimatedTime}
  </span>
                        {isLocked && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            LOCKED
                          </span>
                        )}
                        {isFree && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedLanguage === "Hindi" && lesson.description_hindi ? lesson.description_hindi : lesson.description}
                      </p>
                    </div>
</li>
                )})}
          </ul>

              {/* Selected Lesson Content Preview */}
              {selectedCheckbox && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Content Preview ({selectedLanguage}{selectedSubLanguage ? ` - ${selectedSubLanguage}` : ''})</h3>
                  <div className="bg-white p-3 rounded border font-mono text-sm">
                    {currentLessonContent || "Select a language and script to view content"}
                  </div>
                  <div className="mt-3">
                    <a
                      href={`/tips/home?lesson=${selectedCheckbox.id}&language=${selectedLanguage.toLowerCase()}&subLanguage=${selectedSubLanguage.toLowerCase()}`}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm text-center block"
                    >
                      ⌨️ Start Keyboard Practice (With Hand Guide)
                    </a>
                  </div>
                </div>
              )}

              {!selectedCheckbox && (
                <div className="mt-6 flex justify-center">
                  <button
                    disabled
                    className="bg-gray-400 text-white w-full md:w-[40%] px-6 py-3 rounded-lg mx-auto block cursor-not-allowed text-center font-semibold text-lg shadow-lg opacity-60"
                  >
                    ⚠️ Please Select a Lesson First
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
