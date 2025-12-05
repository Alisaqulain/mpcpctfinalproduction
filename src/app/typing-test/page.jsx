"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getLessonById, getLessonContent } from "@/lib/learningData";
import { calculateCPCTMetricsFromText } from "@/lib/cpctFormulas";

function TypingTestForm() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");
  const language = searchParams.get("language") || "english";
  const subLanguageRaw = (searchParams.get("subLanguage") || "").toLowerCase();
  // Normalize subLanguage to keys used by getLessonContent
  const subLanguage = subLanguageRaw.includes("ramington") ? "ramington" : (subLanguageRaw.includes("inscript") ? "inscript" : "");
  const duration = parseInt(searchParams.get("duration")) || 5; // Duration in minutes
  const backspaceEnabled = searchParams.get("backspace") === "ON";
  
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState("");
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState([]);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [backspaceCount, setBackspaceCount] = useState(0);
  // Backspace policy: <=3m => 10, >3m && <=5m => 20, >5m => 40
  const deriveBackspaceLimit = (m) => (m <= 3 ? 10 : (m <= 5 ? 20 : 40));
  const [backspaceLimit, setBackspaceLimit] = useState(deriveBackspaceLimit(duration));
  const [resultId, setResultId] = useState(null);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (lessonId) {
        try {
          // Fetch all learning data from API
          const res = await fetch('/api/learning?' + new Date().getTime());
          if (res.ok) {
            const data = await res.json();
            // Find the lesson in the data
            let lessonData = null;
            for (const section of data.sections || []) {
              const foundLesson = section.lessons?.find(l => l.id === lessonId);
              if (foundLesson) {
                lessonData = {
                  ...foundLesson,
                  section: section.name,
                  sectionId: section.id
                };
                break;
              }
            }
            
            if (lessonData) {
              setLesson(lessonData);
              // Get content based on language
              let contentKey = 'english';
              if (language === 'hindi') {
                if (subLanguage === 'ramington') {
                  contentKey = 'hindi_ramington';
                } else if (subLanguage === 'inscript') {
                  contentKey = 'hindi_inscript';
                } else {
                  contentKey = 'hindi_ramington'; // default
                }
              }
              
              const lessonContent = lessonData.content?.[contentKey] || lessonData.content?.english || "Content not available";
              const scriptIndicator = (language === 'hindi' && subLanguage) 
                ? (subLanguage === 'ramington' ? '[Ramington Gail] ' : '[Inscript] ')
                : '';
              setContent(scriptIndicator + lessonContent);
            } else {
              // Fallback to local data if not found in database
              const localLesson = getLessonById(lessonId);
              if (localLesson) {
                setLesson(localLesson);
                const lessonContent = getLessonContent(localLesson, language, subLanguage);
                setContent(lessonContent || "Content not available");
              }
            }
          } else {
            // Fallback to local data if API fails
            const localLesson = getLessonById(lessonId);
            if (localLesson) {
              setLesson(localLesson);
              const lessonContent = getLessonContent(localLesson, language, subLanguage);
              setContent(lessonContent || "Content not available");
            }
          }
        } catch (error) {
          console.error('Failed to fetch lesson:', error);
          // Fallback to local data
          const localLesson = getLessonById(lessonId);
          if (localLesson) {
            setLesson(localLesson);
            const lessonContent = getLessonContent(localLesson, language, subLanguage);
            setContent(lessonContent || "Content not available");
          }
        }
      }
    };
    fetchLesson();
  }, [lessonId, language, subLanguage]);

  // If duration changes (via query), resync time and backspace policy
  useEffect(() => {
    setTimeRemaining(duration * 60);
    setBackspaceLimit(deriveBackspaceLimit(duration));
  }, [duration]);

  // Timer effect
  useEffect(() => {
    if (isStarted && !isCompleted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - end the test
            const endTimeStamp = Date.now();
            setEndTime(endTimeStamp);
            setIsCompleted(true);
            setIsStarted(false);
            
            // Calculate CPCT metrics
            const timeInMinutes = (endTimeStamp - startTime) / 60000;
            const cpctMetrics = calculateCPCTMetricsFromText(userInput || "", content, timeInMinutes);
            setWpm(Math.round(cpctMetrics.nwpm)); // Display NWPM
            setAccuracy(Math.round(cpctMetrics.accuracy)); // Display CPCT Accuracy
            
            // Save result to database
            saveTypingResult(endTimeStamp, startTime, cpctMetrics.gwpm, cpctMetrics.accuracy, userInput);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStarted, isCompleted, timeRemaining, startTime, userInput, errors]);

  const startTest = () => {
    setIsStarted(true);
    setStartTime(Date.now());
    setUserInput("");
    setCurrentIndex(0);
    setErrors([]);
    setTimeRemaining(duration * 60);
    setBackspaceCount(0);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    if (!isStarted) return;

    const value = e.target.value;
    const previousLength = userInput.length;
    
    // Check if this is a backspace (input got shorter)
    if (value.length < previousLength) {
      if (!backspaceEnabled) {
        // Backspace is disabled, prevent the change
        e.target.value = userInput;
        return;
      }
      
      const backspaceUsed = previousLength - value.length;
      const newBackspaceCount = backspaceCount + backspaceUsed;
      
      if (newBackspaceCount > backspaceLimit) {
        // Backspace limit exceeded, prevent the change
        e.target.value = userInput;
        return;
      }
      
      setBackspaceCount(newBackspaceCount);
    }
    
    setUserInput(value);

    // Check for errors
    const newErrors = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== content[i]) {
        newErrors.push(i);
      }
    }
    setErrors(newErrors);

    // Check if completed (only if not time-based)
    if (value.length === content.length && timeRemaining > 0) {
      const endTimeStamp = Date.now();
      setEndTime(endTimeStamp);
      setIsCompleted(true);
      setIsStarted(false);

      // Calculate CPCT metrics
      const timeInMinutes = (endTimeStamp - startTime) / 60000;
      const cpctMetrics = calculateCPCTMetricsFromText(value || "", content, timeInMinutes);
      setWpm(Math.round(cpctMetrics.nwpm)); // Display NWPM
      setAccuracy(Math.round(cpctMetrics.accuracy)); // Display CPCT Accuracy
      
      // Save result to database
      saveTypingResult(endTimeStamp, startTime, cpctMetrics.gwpm, cpctMetrics.accuracy, value);
    }
  };

  const saveTypingResult = async (endTime, startTime, gwpm, accuracy, typedText) => {
    try {
      // Calculate statistics using CPCT formulas
      const timeTaken = Math.round((endTime - startTime) / 1000); // in seconds
      const timeInMinutes = timeTaken / 60;
      
      // Use CPCT formulas to calculate metrics
      const cpctMetrics = calculateCPCTMetricsFromText(typedText || "", content, timeInMinutes);
      
      // Extract values from CPCT metrics
      const grossSpeed = Math.round(cpctMetrics.gwpm);
      const netSpeed = Math.round(cpctMetrics.nwpm);
      const correctWords = cpctMetrics.netWords;
      const wrongWords = cpctMetrics.grossWords - cpctMetrics.netWords;
      const totalWords = cpctMetrics.grossWords;
      
      // Calculate errors in format "THGe [The]"
      const errorStrings = [];
      const words = typedText.trim().split(/\s+/);
      const correctWordsArray = content.trim().split(/\s+/);
      for (let i = 0; i < Math.min(words.length, correctWordsArray.length); i++) {
        if (words[i] !== correctWordsArray[i]) {
          errorStrings.push(`${words[i]} [${correctWordsArray[i]}]`);
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
      
      // Get user data
      const userDataStr = localStorage.getItem('examUserData');
      const userData = userDataStr ? JSON.parse(userDataStr) : {};
      
      // Get exercise info from URL or localStorage
      const exerciseId = searchParams.get("exercise") || "";
      const exerciseName = lesson?.title || "Typing Test";
      
      const resultData = {
        userId: userData.mobile || 'anonymous',
        userName: userData.name || 'User',
        userMobile: userData.mobile,
        userCity: userData.city,
        exerciseId: exerciseId,
        exerciseName: exerciseName,
        language: language === "hindi" ? "Hindi" : "English",
        subLanguage: subLanguage || "",
        duration: duration,
        backspaceEnabled: backspaceEnabled,
        grossSpeed: grossSpeed,
        netSpeed: netSpeed,
        totalWords: totalWords,
        correctWords: correctWords,
        wrongWords: wrongWords,
        accuracy: Math.round(cpctMetrics.accuracy),
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
        // Store result ID for result page
        localStorage.setItem('lastTypingResultId', data.result._id);
        // Redirect to result page
        window.location.href = `/result/skill-test?resultId=${data.result._id}`;
      } else {
        console.error('Failed to save typing result');
      }
    } catch (error) {
      console.error('Error saving typing result:', error);
    }
  };

  const resetTest = () => {
    setIsStarted(false);
    setIsCompleted(false);
    setUserInput("");
    setCurrentIndex(0);
    setErrors([]);
    setStartTime(null);
    setEndTime(null);
    setWpm(0);
    setAccuracy(100);
    setTimeRemaining(duration * 60);
    setBackspaceCount(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const renderContent = () => {
    if (!content) return null;

    return content.split("").map((char, index) => {
      let className = "text-gray-800";
      
      if (index < userInput.length) {
        if (userInput[index] === char) {
          className = "text-green-600 bg-green-100";
        } else {
          className = "text-red-600 bg-red-100";
        }
      } else if (index === userInput.length) {
        className = "text-blue-600 bg-blue-100 border-b-2 border-blue-600";
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Typing Test - {lesson.title}
            </h1>
            <p className="text-gray-600">
              {lesson.section} • {lesson.difficulty} • {lesson.estimatedTime}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Language: {language === "hindi" ? "Hindi" : "English"}
              {subLanguage && ` (${subLanguage})`}
            </p>
          </div>

          {/* Instructions */}
          {!isStarted && !isCompleted && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h2>
              <ul className="text-blue-700 space-y-1">
                <li>• Type the text exactly as shown</li>
                <li>• Test duration: {duration} minutes - will auto-complete when time runs out</li>
                <li>• Backspace: {backspaceEnabled ? `${backspaceLimit} times allowed` : 'Disabled'}</li>
                <li>• Your speed (WPM) and accuracy will be calculated</li>
                <li>• Click "Start Test" when you're ready</li>
              </ul>
              <button
                onClick={startTest}
                className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Test
              </button>
            </div>
          )}

          {/* Test Area */}
          {isStarted && (
            <div className="mb-6">
              {/* Timer and Backspace Counter */}
              <div className="flex justify-between items-center mb-4 bg-gray-100 p-3 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">
                  Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
                {backspaceEnabled && (
                  <div className="text-lg font-semibold text-gray-700">
                    Backspace: {backspaceCount}/{backspaceLimit}
                  </div>
                )}
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg mb-4">
                <div className="text-lg leading-relaxed font-mono">
                  {renderContent()}
                </div>
              </div>
              
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={handleInputChange}
                placeholder="Start typing here..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                rows="4"
                disabled={isCompleted}
              />
            </div>
          )}

          {/* Results */}
          {isCompleted && (
            <div className="mb-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-green-800 mb-4">Test Completed!</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{wpm}</div>
                    <div className="text-green-700">Words Per Minute</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
                    <div className="text-green-700">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round((endTime - startTime) / 1000)}s
                    </div>
                    <div className="text-green-700">Time Taken</div>
                  </div>
                  {backspaceEnabled && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{backspaceCount}</div>
                      <div className="text-green-700">Backspaces Used</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={resetTest}
                  className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Progress */}
          {isStarted && !isCompleted && (
            <div className="mb-6">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((userInput.length / content.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userInput.length / content.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <a
              href="/learning"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Back to Learning
            </a>
            {isCompleted && (
              <a
                href={`/typing-test?lesson=${lessonId}&language=${language}&subLanguage=${subLanguage}&duration=${duration}&backspace=${backspaceEnabled ? "ON" : "OFF"}`}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Practice Again
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TypingTest() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TypingTestForm />
    </Suspense>
  );
}
