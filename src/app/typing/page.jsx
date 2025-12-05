"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getLearningData, getLessonContent } from "@/lib/learningData";

function TypingTutorForm() {
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get("exercise");
  const language = searchParams.get("language") || "english";
  const subLanguage = searchParams.get("subLanguage") || "";
  const duration = parseInt(searchParams.get("duration")) || 5;
  const backspace = searchParams.get("backspace") || "OFF";

  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [learningData, setLearningData] = useState(null);

  // Fetch exercise content from API
  useEffect(() => {
    const fetchData = async () => {
      if (!exerciseId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch skill test data
        const res = await fetch('/api/skill-test?' + new Date().getTime());
        if (res.ok) {
          const data = await res.json();
          setLearningData(data);
          const exercise = data.exercises?.find(e => e.id === exerciseId);
          
          if (exercise) {
            let exerciseContent = "";
            
            // If exercise is linked to a lesson, use lesson content
            if (exercise.lessonId) {
              // Fetch learning data for lesson content
              try {
                const learningRes = await fetch('/api/learning?' + new Date().getTime());
                if (learningRes.ok) {
                  const learningData = await learningRes.json();
                  // Find the lesson
                  for (const section of learningData.sections || []) {
                    const lesson = section.lessons?.find(l => l.id === exercise.lessonId);
                    if (lesson) {
                      const languageKey = language.toLowerCase();
                      const subLangKey = subLanguage.toLowerCase().includes("ramington")
                        ? "ramington"
                        : subLanguage.toLowerCase().includes("inscript")
                        ? "inscript"
                        : "";
                      exerciseContent = getLessonContent(lesson, languageKey, subLangKey) || "";
                      break;
                    }
                  }
                } else {
                  // Fallback to local data
                  const localData = getLearningData();
                  setLearningData(localData);
                  for (const section of localData.sections || []) {
                    const lesson = section.lessons?.find(l => l.id === exercise.lessonId);
                    if (lesson) {
                      const languageKey = language.toLowerCase();
                      const subLangKey = subLanguage.toLowerCase().includes("ramington")
                        ? "ramington"
                        : subLanguage.toLowerCase().includes("inscript")
                        ? "inscript"
                        : "";
                      exerciseContent = getLessonContent(lesson, languageKey, subLangKey) || "";
                      break;
                    }
                  }
                }
              } catch (error) {
                console.error('Failed to fetch learning data:', error);
                // Fallback to local data
                const localData = getLearningData();
                setLearningData(localData);
              }
            } else {
              // Use exercise's custom content
              const exerciseContentObj = exercise.content || {};
              if (language.toLowerCase() === "hindi") {
                if (subLanguage.toLowerCase().includes("ramington")) {
                  exerciseContent = exerciseContentObj.hindi_ramington || "";
                } else if (subLanguage.toLowerCase().includes("inscript")) {
                  exerciseContent = exerciseContentObj.hindi_inscript || "";
                } else {
                  exerciseContent = exerciseContentObj.hindi_ramington || "";
                }
              } else {
                exerciseContent = exerciseContentObj.english || "";
              }
            }

            // Split content into lines (max ~80 characters per line for better display)
            if (exerciseContent && exerciseContent.trim()) {
              const words = exerciseContent.trim().split(/\s+/).filter(w => w.length > 0);
              if (words.length > 0) {
                const lines = [];
                let currentLine = "";
                for (const word of words) {
                  if ((currentLine + " " + word).length > 80 && currentLine) {
                    lines.push(currentLine.trim());
                    currentLine = word;
                  } else {
                    currentLine = currentLine ? currentLine + " " + word : word;
                  }
                }
                if (currentLine) {
                  lines.push(currentLine.trim());
                }
                setContent(lines.length > 0 ? lines : []);
              } else {
                setContent([]);
              }
            } else {
              setContent([]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch exercise data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exerciseId, language, subLanguage]);

  // Load user name from API and localStorage
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        // First try to get from API
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setUserName(data.user.name);
          }
          if (data.user?.profileUrl) {
            setUserProfileUrl(data.user.profileUrl);
          }
          if (data.user?.name || data.user?.profileUrl) {
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
      
      // Fallback to localStorage
      const userDataStr = localStorage.getItem('examUserData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData.name) {
            setUserName(userData.name);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };
    
    fetchUserName();
  }, []);

  // Fetch backspace settings
  useEffect(() => {
    const fetchBackspaceSettings = async () => {
      try {
        const res = await fetch('/api/backspace-settings');
        if (res.ok) {
          const data = await res.json();
          setBackspaceSettings(data.settings || []);
          
          // Find setting for current duration
          const setting = data.settings?.find(s => s.duration === duration);
          if (setting) {
            setBackspaceLimit(setting.backspaceLimit);
          } else {
            setBackspaceLimit(null); // No limit if no setting found
          }
        }
      } catch (error) {
        console.error('Failed to fetch backspace settings:', error);
        setBackspaceLimit(null);
      }
    };
    
    fetchBackspaceSettings();
  }, [duration]);

  const words = content.length > 0 && content.join(" ").trim() 
    ? content.join(" ").trim().split(/\s+/).filter(w => w.length > 0)
    : [];

  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [wpm, setWPM] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [resultId, setResultId] = useState(null);
  const [accuracy, setAccuracy] = useState(100);
  const [userName, setUserName] = useState("User");
  const [userProfileUrl, setUserProfileUrl] = useState("/lo.jpg");
  const [backspaceLimit, setBackspaceLimit] = useState(null); // null = unlimited
  const [backspaceSettings, setBackspaceSettings] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const intervalRef = useRef(null);
  const wordRefs = useRef([]);
  const containerRef = useRef(null);

  // Detect mobile and landscape orientation
  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      if (isMobileDevice) {
        const isLandscapeMode = window.innerWidth > window.innerHeight;
        setIsLandscape(isLandscapeMode);
      } else {
        setIsLandscape(false);
      }
    };

    checkMobileAndOrientation();
    window.addEventListener('resize', checkMobileAndOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobileAndOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', checkMobileAndOrientation);
      window.removeEventListener('orientationchange', checkMobileAndOrientation);
    };
  }, []);

  const typedWords = typedText.trim().split(/\s+/);
  const correctWords = typedWords.filter((word, i) => word === words[i]);
  const wrongWords = typedWords.filter((word, i) => word !== words[i] && word);

  const saveTypingResult = React.useCallback(async (endTime, startTime, grossWpm, accuracy) => {
    try {
      const timeTaken = Math.round((endTime - startTime) / 1000);
      const timeInMinutes = timeTaken / 60;
      const wordsTyped = typedWords.length;
      const correct = correctWords.length;
      const wrong = wrongWords.length;
      const netSpeed = Math.round((correct / timeInMinutes) || 0);
      
      // Calculate errors in format "THGe [The]"
      const errorStrings = [];
      for (let i = 0; i < Math.min(typedWords.length, words.length); i++) {
        if (typedWords[i] !== words[i]) {
          errorStrings.push(`${typedWords[i]} [${words[i]}]`);
        }
      }
      
      // Determine final result (PASS if net speed >= 30 WPM)
      const finalResult = netSpeed >= 30 ? "PASS" : "FAIL";
      
      // Determine remarks
      let remarks = "Fair";
      if (netSpeed >= 50) remarks = "Excellent";
      else if (netSpeed >= 40) remarks = "Very Good";
      else if (netSpeed >= 30) remarks = "Good";
      else if (netSpeed >= 20) remarks = "Fair";
      else remarks = "Poor";
      
      // Get user data - use actual userName from state (fetched from API)
      const userDataStr = localStorage.getItem('examUserData');
      const userData = userDataStr ? JSON.parse(userDataStr) : {};
      
      // Get exercise info
      const exerciseName = learningData?.exercises?.find(e => e.id === exerciseId)?.name || "Typing Exercise";
      
      // Use actual userName from state (which should be fetched from API), fallback to localStorage, then "User"
      const finalUserName = userName && userName !== "User" ? userName : (userData.name || "User");
      
      const resultData = {
        userId: userData.mobile || 'anonymous',
        userName: finalUserName,
        userMobile: userData.mobile,
        userCity: userData.city,
        exerciseId: exerciseId || "",
        exerciseName: exerciseName,
        language: language === "hindi" ? "Hindi" : "English",
        subLanguage: subLanguage || "",
        duration: duration,
        backspaceEnabled: backspace === "ON",
        grossSpeed: grossWpm,
        netSpeed: netSpeed,
        totalWords: wordsTyped,
        correctWords: correct,
        wrongWords: wrong,
        accuracy: accuracy,
        timeTaken: timeTaken,
        backspaceCount: backspaceCount,
        errors: errorStrings,
        finalResult: finalResult,
        remarks: remarks
      };
      
      const res = await fetch('/api/typing-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
      });
      
      if (res.ok) {
        const data = await res.json();
        setResultId(data.result._id);
        localStorage.setItem('lastTypingResultId', data.result._id);
        // Redirect directly to result page
        window.location.href = `/result/skill-test?resultId=${data.result._id}`;
      } else {
        console.error('Failed to save typing result');
      }
    } catch (error) {
      console.error('Error saving typing result:', error);
    }
  }, [typedWords, correctWords, wrongWords, words, learningData, exerciseId, language, subLanguage, duration, backspace, backspaceCount]);

  const handleCompletion = React.useCallback(() => {
    if (isCompleted) return;
    
    setIsCompleted(true);
    setIsPaused(true);
    const endTimeNow = Date.now();
    setEndTime(endTimeNow);
    
    // Calculate final stats
    const timeInMinutes = elapsedTime / 60 || 1;
    const finalWPM = Math.floor((correctWords.length / timeInMinutes));
    const totalTyped = typedWords.length;
    const correct = correctWords.length;
    const finalAccuracy = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;
    
    setWPM(finalWPM);
    setAccuracy(finalAccuracy);
    
    // Save result
    saveTypingResult(endTimeNow, startTime, finalWPM, finalAccuracy);
  }, [isCompleted, elapsedTime, correctWords.length, typedWords.length, startTime, saveTypingResult]);

  // Timer effect - count up elapsed time and count down remaining time
  useEffect(() => {
    if (isPaused || !startTime || isCompleted) return;
    
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1;
        setTimeRemaining((prevRemaining) => {
          const newRemaining = (duration * 60) - newTime;
          // Don't auto-complete when time runs out, just stop at 0
          return newRemaining <= 0 ? 0 : newRemaining;
        });
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, startTime, isCompleted, duration]);

  useEffect(() => {
    if (elapsedTime === 0 || isPaused || isCompleted) return;
    const timeInMinutes = elapsedTime / 60;
    if (timeInMinutes > 0) {
      setWPM(Math.floor((correctWords.length / timeInMinutes)));
      // Calculate accuracy
      const totalTyped = typedWords.length;
      const correct = correctWords.length;
      const accuracyCalc = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;
      setAccuracy(accuracyCalc);
    }
  }, [elapsedTime, correctWords.length, isPaused, isCompleted, typedWords.length]);

  // Removed automatic completion - user must click Submit button

  const handleChange = (e) => {
    if (isPaused || isCompleted) return;
    
    const newValue = e.target.value;
    
    // Handle backspace
    if (typedText.length > newValue.length) {
      if (backspace === "OFF") {
        // Prevent backspace if disabled
        e.target.value = typedText;
        return;
      }
      
      // Check backspace limit if enabled
      if (backspaceLimit !== null && backspaceCount >= backspaceLimit) {
        // Backspace limit reached
        e.target.value = typedText;
        alert(`Backspace limit reached! Maximum ${backspaceLimit} backspaces allowed for ${duration} minute test.`);
        return;
      }
      
      setBackspaceCount((prev) => prev + 1);
    }
    
    if (!startTime) {
      setStartTime(Date.now());
    }
    setTypedText(newValue);

    const currentIndex = newValue.trim().split(/\s+/).length - 1;
    const nextWordEl = wordRefs.current[currentIndex];
    if (nextWordEl && containerRef.current) {
      nextWordEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };


  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTypedText("");
    setStartTime(null);
    setEndTime(null);
    setWPM(0);
    setBackspaceCount(0);
    setElapsedTime(0);
    setTimeRemaining(duration * 60);
    setIsPaused(false);
    setIsCompleted(false);
    setResultId(null);
    setAccuracy(100);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const formatClock = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatMinutes = (seconds) => {
    return Math.floor(seconds / 60).toString().padStart(2, "0");
  };

  const formatSeconds = (seconds) => {
    return (seconds % 60).toString().padStart(2, "0");
  };

  const renderColoredWords = () => {
    let pointer = 0;
    return content.map((line, lineIndex) => {
      const lineWords = line.trim().split(/\s+/);
      return (
        <p
          key={lineIndex}
          className="mb-1 break-words h-[40px] flex items-center"
          style={{ fontSize: `${fontSize}px` }}
          ref={lineIndex === 0 ? containerRef : null}
        >
          {lineWords.map((word, i) => {
            const index = pointer++;
            let className = "";
            if (typedWords.length - 1 > index) {
              className = typedWords[index] === word ? "text-green-600" : "text-red-600";
            } else if (typedWords.length - 1 === index) {
              className = "bg-blue-500 text-white";
            } else {
              className = "text-gray-500";
            }
            return (
              <span
                key={i}
                ref={(el) => (wordRefs.current[index] = el)}
                className={`${className} mr-1`}
              >
                {word}
              </span>
            );
          })}
        </p>
      );
    });
  };

  const increaseFont = () => setFontSize((prev) => Math.min(prev + 2, 30));
  const decreaseFont = () => setFontSize((prev) => Math.max(prev - 2, 10));

  const handleDownloadPDF = () => {
    if (!resultId) {
      // If no resultId, redirect to result page
      const storedId = localStorage.getItem('lastTypingResultId');
      if (storedId) {
        window.location.href = `/result/skill-test?resultId=${storedId}`;
      }
      return;
    }
    window.location.href = `/result/skill-test?resultId=${resultId}`;
  };

  return (
    <div className="min-h-screen bg-[#290c52] bg-[url('/bg.jpg')] mt-30 md:mt-0  bg-cover bg-center bg-no-repeat px-4 py-6 md:px-14 md:py-12 md:mx-8 md:my-8 rounded-[0px] md:rounded-[100px] typing-background-container">
      <style jsx>{`
        @media (max-width: 767px) and (orientation: landscape),
               (max-height: 500px) and (orientation: landscape) {
          html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            position: fixed;
          }
          /* Remove rounded corners and make full width in landscape mobile view */
          .typing-background-container {
            border-radius: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          /* Landscape mobile layout adjustments */
          .landscape-mobile-container {
            display: flex !important;
            flex-direction: row !important;
            height: 100vh !important;
            overflow: hidden !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .landscape-mobile-typing-area {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 0.5rem !important;
          
          }
          .landscape-mobile-sidebar {
            width: 140px !important;
            min-width: 140px !important;
            flex-shrink: 0 !important;
            overflow-y: auto !important;
          }
          /* Hide user profile in landscape mobile view */
          .user-profile-landscape {
            display: none !important;
          }
          /* Hide font size buttons in landscape mobile view */
          .font-size-buttons-landscape {
            display: none !important;
          }
          /* Position absolute for stats div in landscape mobile view only */
          .stats-container-landscape {
            position: absolute !important;
            top: 15px !important;
            gap: 0px !important;
          }
          /* Margin adjustments for cards in landscape mobile view only */
          .card-correct-landscape {
            margin-right: 0% !important;
            margin-left: 22% !important;
          }
          .card-wrong-landscape {
            margin-right: 18% !important;
            margin-left: 2% !important;
          }
          .card-total-landscape {
            margin-left: 10% !important;
            margin-right: 4% !important;
          }
          .card-backspace-landscape {
            margin-left: 0% !important;
            margin-right: 10% !important;
          }
          /* Margin top for time div in landscape mobile view only */
          .time-container-landscape {
            margin-top: 30px !important;
            margin-left: 49% !important;
          }
        }
      `}</style>
      <div className={`max-w-7xl mx-auto mt-30 md:mt-15 ${isMobile && isLandscape ? "landscape-mobile-container" : ""}`}>
       <button className="hidden md:absolute md:right-22 md:top-6 border border-gray-600 text-white bg-red-500 px-4 py-1 rounded-md md:block">
  <a href="/skill_test">close</a>
</button>


        <div className={`flex ${isMobile && isLandscape ? "flex-row" : "flex-col-reverse lg:flex-row"} gap-6`}>
          
          {/* Typing Area */}
          <div className={`${isMobile && isLandscape ? "landscape-mobile-typing-area" : "w-[90%] lg:w-[110%]  mx-auto "}`}>
          {(!isMobile || !isLandscape) && (
            <p className="block lg:hidden text-md mb-15 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 text-center font-bold">
              Typing Tutor
              <br />
              <span className="text-xs font-normal text-white">(Type the words as they appear below)</span>
            </p>
          )}

            <div className={`bg-white ${isMobile && isLandscape ? "p-2" : "p-4 mr-10 md:p-6"} rounded-xl shadow-lg ${isMobile && isLandscape ? "" : "ml-5 mt-[-25]"}`}>
              {/* Results Display */}
              {isCompleted && (
                <div className="mb-6 bg-green-50 p-4 rounded-lg border-2 border-green-500">
                  <h2 className="text-xl font-bold text-green-800 mb-3">Test Completed!</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{wpm}</div>
                      <div className="text-sm text-green-700">WPM</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                      <div className="text-sm text-green-700">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatClock(elapsedTime)}</div>
                      <div className="text-sm text-green-700">Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{correctWords.length}</div>
                      <div className="text-sm text-green-700">Correct</div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleDownloadPDF}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={handleReset}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p>Loading exercise content...</p>
                </div>
              ) : content.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No content available for this exercise.</p>
                </div>
              ) : (
                <>
                  <div className={`text-sm leading-relaxed mb-4 overflow-auto ${isMobile && isLandscape ? "min-h-[150px] max-h-[200px]" : "min-h-[100px] max-h-[100px] lg:min-h-[200px] lg:max-h-[250px]"} mt-4 break-words font-sans`}>
                    {renderColoredWords()}
                  </div>
                  <textarea
                    value={typedText}
                    onChange={handleChange}
                    disabled={isPaused || isCompleted}
                    className={`w-full ${isMobile && isLandscape ? "min-h-[100px] max-h-[150px]" : "min-h-[100px] max-h-[100px] md:min-h-[80px] md:max-h-[100px] lg:min-h-[180px] lg:max-h-[220px]"} p-2 border-t border-gray-400 rounded-md focus:outline-none mt-4 disabled:opacity-50`}
                    placeholder={isMobile && isLandscape ? "Type Here..." : "Start typing here..."}
                    style={{ fontSize: `${fontSize}px` }}
                  />
                </>
              )}
            </div>
            <div className={`flex justify-center ${isMobile && isLandscape ? "mt-2" : "mt-5"} gap-6 flex-wrap`}>
              {!isMobile || !isLandscape ? (
                <>
                  <button
                    onClick={handleReset}
                    className="bg-pink-500 text-lg cursor-pointer hover:bg-orange-500 text-white px-8 py-1 rounded shadow"
                  >
                    Reset
                  </button>
                  <button
                    onClick={togglePause}
                    disabled={isCompleted}
                    className="bg-blue-600 cursor-pointer text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-1 rounded shadow"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                </>
              ) : null}
              <button
                onClick={handleCompletion}
                disabled={!startTime || isCompleted}
                className={`${isMobile && isLandscape ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} cursor-pointer text-lg disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-1 rounded shadow font-semibold`}
              >
                {isMobile && isLandscape ? "Submit Test" : "Submit"}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`${isMobile && isLandscape ? "landscape-mobile-sidebar" : "w-full lg:w-[20%]"} text-white p-3 ${isMobile && isLandscape ? "static" : "fixed top-0 mt-[-15] left-0 z-50"} bg-[#290c52] bg-[url('/bg.jpg')] bg-cover bg-top bg-no-repeat lg:static lg:bg-none lg:bg-transparent`}>
           <button className="absolute md:hidden right-3 top-5 md:right-22 md:top-86 border border-gray-600 text-white bg-red-500 px-4 py-1 rounded-md ">
  <a href="/skill_test">close</a>
</button>

            <div className="flex flex-col items-center space-y-1 mt-[-18]">
              {/* Hide profile in portrait view only */}
              {!isMobile || isLandscape ? (
                <div className="user-profile-landscape mb-4">
                  <img
                    src={userProfileUrl}
                    alt={userName}
                    className="w-20 h-20 md:w-30 md:h-25 rounded-md border-2 border-white"
                    onError={(e) => {
                      e.target.src = "/lo.jpg";
                    }}
                  />
                  <p className="font-semibold text-xs text-center">{userName}</p>
                  {backspaceLimit !== null && (
                    <p className="text-xs text-yellow-300 mt-1">
                      Backspace: {backspaceCount}/{backspaceLimit}
                    </p>
                  )}
                </div>
              ) : null}

              {/* Landscape Mobile: Single column layout with all stats */}
              {isMobile && isLandscape ? (
                <div className="flex flex-col gap-2 w-full max-w-[120px] items-center">
                  {/* Correct Card */}
                  <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Correct</div>
                    <div className="bg-white text-green-600 text-sm font-bold">{correctWords.length}</div>
                  </div>
                  {/* Wrong Card */}
                  <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Wrong</div>
                    <div className="bg-white text-red-500 text-sm font-bold">{wrongWords.length}</div>
                  </div>
                  {/* Total Card */}
                  <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Total</div>
                    <div className="bg-white text-[#290c52] text-sm font-bold">{words.length}</div>
                  </div>
                  {/* Speed Card */}
                  <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Speed</div>
                    <div className="bg-white text-black text-sm font-bold">{wpm}</div>
                  </div>
                  {/* Accuracy Card */}
                  <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Accuracy</div>
                    <div className="bg-white text-black text-sm font-bold">{accuracy.toFixed(1)}%</div>
                  </div>
                  {/* Backspace Card */}
                  <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Backspace</div>
                    <div className="bg-white text-blue-500 text-sm font-bold">{backspaceCount}</div>
                  </div>
                  {/* Timer - Two separate dark blue boxes */}
                  <div className="flex gap-2 w-full mt-1">
                    <div className="flex-1 h-9 rounded-lg overflow-hidden text-center bg-blue-900 border-2 border-blue-700">
                      <div className="bg-blue-800 text-white text-[10px] font-semibold py-[1px]">Min</div>
                      <div className="bg-blue-900 text-white text-sm font-bold">
                        {isCompleted ? formatMinutes(elapsedTime) : formatMinutes(timeRemaining)}
                      </div>
                    </div>
                    <div className="flex-1 h-9 rounded-lg overflow-hidden text-center bg-blue-900 border-2 border-blue-700">
                      <div className="bg-blue-800 text-white text-[10px] font-semibold py-[1px]">Sec</div>
                      <div className="bg-blue-900 text-white text-sm font-bold">
                        {isCompleted ? formatSeconds(elapsedTime) : formatSeconds(timeRemaining)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Portrait/Desktop: Original layout */}
                  <div className="w-24 h-9 rounded-lg overflow-hidden mx-auto text-center mt-10 md:mt-5 lg:mt-2 pt-0 md:pt-0 lg:pt-0 shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)] time-container-landscape">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
                    <div className="bg-white text-black text-sm font-bold">
                      {isCompleted ? formatClock(elapsedTime) : formatClock(timeRemaining)}
                    </div>
                  </div>
                  <div className={`flex grid-cols-1  gap-y-3 mt-2 gap-x-4  md:gap-x-15 lg:gap-x-15 mr-0 md:mr-10 w-[70%] md:w-full text-center lg:landscape:grid lg:grid-cols-2 stats-container-landscape`}>
                    {[{ label: "Correct", value: correctWords.length, color: "text-green-600" },
                      { label: "Wrong", value: wrongWords.length, color: "text-red-500" },
                      { label: "Total", value: words.length, color: "text-[#290c52]" },
                      { label: "Backspace", value: backspaceCount, color: "text-blue-500" }].map(({ label, value, color }, i) => (
                        <div key={i} className={`w-full sm:w-24 h-9 rounded-lg overflow-hidden mx-auto shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)] ${label === "Correct" ? "card-correct-landscape" : ""} ${label === "Wrong" ? "card-wrong-landscape" : ""} ${label === "Total" ? "card-total-landscape" : ""} ${label === "Backspace" ? "card-backspace-landscape" : ""}`}>
                          <div className="bg-black text-white text-[10px] font-semibold py-[1px]">{label}</div>
                          <div className={`bg-white ${color} text-sm font-bold`}>{value}</div>
                        </div>
                      ))}
                  </div>
                  {isCompleted && (
                    <div className="mt-3 text-center">
                      <div className="bg-white text-black px-4 py-2 rounded-lg shadow-md">
                        <div className="text-xs font-semibold mb-1">Accuracy</div>
                        <div className="text-lg font-bold text-green-600">{accuracy}%</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Speedometer */}
              <div className="hidden lg:block mt-4">
                <div className="border-6 border-black rounded-full mt-2">
                  <div className="relative w-24 h-24 bg-black rounded-full border-4 border-white flex items-center justify-center">
                    <div className="absolute left-1 text-red-500 text-[8px] font-bold tracking-widest">SPEED</div>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <line
                        x1="50"
                        y1="50"
                        x2={50 + 42 * Math.cos((wpm / 90) * (Math.PI * 1.5) - Math.PI)}
                        y2={50 + 42 * Math.sin((wpm / 90) * (Math.PI * 1.5) - Math.PI)}
                        stroke="red"
                        strokeWidth="2"
                      />
                      {Array.from({ length: 9 }).map((_, i) => {
                        const startAngle = (-Math.PI * 5) / 6;
                        const endAngle = (Math.PI * 5) / 6;
                        const angle = startAngle + (i / 8) * (endAngle - startAngle);
                        const x = 50 + 40 * Math.cos(angle);
                        const y = 50 + 42 * Math.sin(angle);
                        return (
                          <text key={i} x={x} y={y} fontSize="10" fill="white" textAnchor="middle" dominantBaseline="middle">
                            {(i + 1) * 10}
                          </text>
                        );
                      })}
                    </svg>
                    <span className="absolute bottom-5 text-red-500 font-bold text-xs">{wpm}</span>
                  </div>
                </div>
              </div>

             <div className="hidden md:flex flex-col items-center justify-center gap-1 font-size-buttons-landscape">
  <p className="text-center text-sm mb-1">Font Size</p>
  <div className="flex justify-center gap-3">
    <button
      onClick={decreaseFont}
      className="bg-white text-black border-3 cursor-pointer border-black px-5 py-[2px] text-xs rounded-md"
    >
      A -
    </button>
    <button
      onClick={increaseFont}
      className="bg-white text-black cursor-pointer border-3 border-black px-5 py-[2px] text-xs rounded-md"
    >
      A +
    </button>
  </div>
</div>

            </div>
          </div>
          {/* End Sidebar */}
        </div>
      </div>
    </div>
  );
}

export default function TypingTutor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#290c52] bg-[url('/bg.jpg')] mt-30 md:mt-0 bg-cover bg-center bg-no-repeat px-4 py-6 md:px-14 md:py-12 md:mx-8 md:my-8 rounded-[0px] md:rounded-[100px] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <TypingTutorForm />
    </Suspense>
  );
}
