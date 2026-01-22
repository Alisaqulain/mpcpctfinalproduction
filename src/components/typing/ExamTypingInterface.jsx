"use client";
import React, { useState, useEffect, useRef } from "react";

export default function ExamTypingInterface({
  content,
  onComplete,
  onProgress,
  userName = "User",
  userProfileUrl = "/lo.jpg",
  language = "English",
  allowBackspace = true,
  duration = null
}) {
  const [typedText, setTypedText] = useState("");
  const [keystrokesCount, setKeystrokesCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [typedWordCount, setTypedWordCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration ? duration * 60 : null);
  const [wpm, setWpm] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const wordRefs = useRef([]);

  // Initialize timer when duration changes
  useEffect(() => {
    if (duration) {
      setTimeRemaining(duration * 60);
    }
  }, [duration]);
  
  // Split content into words
  const words = content ? content.trim().split(/\s+/).filter(w => w.length > 0) : [];
  const totalWordCount = words.length;
  const typedWords = typedText.trim().split(/\s+/).filter(w => w.length > 0);
  const pendingWordCount = Math.max(0, totalWordCount - typedWords.length);
  
  // Determine which word should be highlighted
  const highlightedIndex = typedText.trim() === ''
    ? 0
    : typedText.endsWith(' ') || typedText.endsWith('\n') || typedText.endsWith('\t')
      ? typedWords.length
      : typedWords.length > 0 ? typedWords.length - 1 : 0;

  // Timer effect - countdown when active
  useEffect(() => {
    if (timeRemaining !== null && isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            setIsActive(false);
            if (onComplete) {
              const finalTypedWords = typedText.trim().split(/\s+/).filter(w => w.length > 0);
              const correctWordsCount = finalTypedWords.filter((w, i) => w === words[i]).length;
              const totalWords = finalTypedWords.length;
              const wrongWordsCount = totalWords - correctWordsCount;
              const accuracy = totalWords > 0 
                ? Math.round((correctWordsCount / totalWords) * 100)
                : 100;
              const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
              const finalWpm = elapsed > 0 ? Math.round(totalWords / elapsed) : 0;
              
              onComplete({ 
                typedText, 
                mistakes: wrongWordsCount,
                backspaceCount,
                wpm: finalWpm,
                accuracy,
                keystrokesCount,
                errorCount,
                timeTaken: startTime ? (Date.now() - startTime) / 1000 : 0
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isActive, typedText, words, onComplete, startTime, backspaceCount, keystrokesCount, errorCount]);

  useEffect(() => {
    setTypedWordCount(typedWords.length);
    
    if (onProgress && startTime) {
      const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
      const calculatedWpm = elapsed > 0 ? Math.round(typedWords.length / elapsed) : 0;
      setWpm(calculatedWpm);
      const correctWords = typedWords.filter((word, i) => word === words[i]).length;
      const accuracy = typedWords.length > 0 ? Math.round((correctWords / typedWords.length) * 100) : 100;
      
      onProgress({
        wpm: calculatedWpm,
        accuracy,
        mistakes: errorCount,
        backspaceCount,
        keystrokesCount,
        typedWordCount: typedWords.length
      });
    }
  }, [typedText, typedWords, errorCount, backspaceCount, keystrokesCount, startTime, onProgress, words]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    const previousLength = typedText.length;
    const newLength = value.length;
    
    // Calculate keystrokes (any character input)
    if (newLength > previousLength) {
      const addedChars = newLength - previousLength;
      setKeystrokesCount(prev => prev + addedChars);
    }
    
    setTypedText(value);
    
    if (!isActive && value.length > 0) {
      setIsActive(true);
      setStartTime(Date.now());
    }
    
    // Check for word completion and errors
    const currentTypedWords = value.trim().split(/\s+/).filter(w => w.length > 0);
    
    // Check if space was pressed (word completed)
    if (value.endsWith(" ") && currentTypedWords.length > 0) {
      const typedWord = currentTypedWords[currentTypedWords.length - 1];
      const correctWord = words[currentTypedWords.length - 1] || "";
      
      if (typedWord !== correctWord) {
        setErrorCount(prev => prev + 1);
      }
      
      // Check if all words completed
      const nextWordIndex = currentTypedWords.length;
      if (nextWordIndex >= words.length) {
        setIsActive(false);
        if (onComplete) {
          const finalTypedWords = value.trim().split(/\s+/).filter(w => w.length > 0);
          const correctWordsCount = finalTypedWords.filter((w, i) => w === words[i]).length;
          const totalWords = finalTypedWords.length;
          const wrongWordsCount = totalWords - correctWordsCount;
          const accuracy = totalWords > 0 
            ? Math.round((correctWordsCount / totalWords) * 100)
            : 100;
          const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
          const wpm = elapsed > 0 ? Math.round(totalWords / elapsed) : 0;
          
          onComplete({ 
            typedText: value, 
            mistakes: wrongWordsCount,
            backspaceCount,
            wpm,
            accuracy,
            keystrokesCount: keystrokesCount + (newLength - previousLength),
            errorCount,
            timeTaken: startTime ? (Date.now() - startTime) / 1000 : 0
          });
        }
      }
    }
    
    // Scroll to current word
    setTimeout(() => {
      const wordEl = wordRefs.current[highlightedIndex];
      if (wordEl && containerRef.current) {
        wordEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      if (allowBackspace) {
        setBackspaceCount(prev => prev + 1);
      } else {
        e.preventDefault();
      }
    }
  };

  const renderTextContent = () => {
    return (
      <div className="whitespace-pre-wrap break-words leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
        {words.map((word, index) => {
          let className = "";
          if (index < highlightedIndex) {
            // Already typed words - green if correct, red if wrong
            className = typedWords[index] === word ? "text-green-600" : "text-red-600";
          } else if (index === highlightedIndex) {
            // Current word being typed (highlighted) - blue background
            className = "bg-blue-500 text-white px-1 py-0.5 rounded";
          } else {
            // Future words - default color
            className = "text-gray-700";
          }
          return (
            <span
              key={index}
              ref={(el) => (wordRefs.current[index] = el)}
              className={`${className} mr-1 inline-block`}
            >
              {word}{" "}
            </span>
          );
        })}
      </div>
    );
  };

  // Calculate statistics
  const correctWords = typedWords.filter((word, i) => word === words[i]).length;
  const wrongWords = typedWords.length - correctWords;
  const totalTyped = typedWords.length;

  // Calculate speedometer angle (0-180 degrees, where 0 = 0 WPM, 180 = 90 WPM)
  const speedometerAngle = Math.min(180, (wpm / 90) * 180);

  const handleSubmit = () => {
    if (onComplete) {
      const finalTypedWords = typedText.trim().split(/\s+/).filter(w => w.length > 0);
      const correctWordsCount = finalTypedWords.filter((w, i) => w === words[i]).length;
      const totalWords = finalTypedWords.length;
      const wrongWordsCount = totalWords - correctWordsCount;
      const accuracy = totalWords > 0 
        ? Math.round((correctWordsCount / totalWords) * 100)
        : 100;
      const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
      const wpm = elapsed > 0 ? Math.round(totalWords / elapsed) : 0;
      
      onComplete({ 
        typedText, 
        mistakes: wrongWordsCount,
        backspaceCount,
        wpm,
        accuracy,
        keystrokesCount,
        errorCount,
        timeTaken: startTime ? (Date.now() - startTime) / 1000 : 0
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left: Text Display and Input */}
        <div className="flex-1 flex flex-col p-2 md:p-3 lg:p-4 overflow-hidden min-h-0">
          {/* Text to Type Box */}
          <div
            ref={containerRef}
            className="flex-1 bg-white border-2 border-gray-300 rounded-lg p-3 md:p-3 lg:p-4 mb-2 md:mb-2 lg:mb-4 overflow-y-auto min-h-0 scrollbar-hide landscape-typing-box"
          >
            {renderTextContent()}
          </div>

          {/* Input Field */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type Here ..."
            className="w-full h-28 md:h-24 lg:h-36 p-3 md:p-2 lg:p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-sm lg:text-base font-mono resize-none flex-shrink-0 landscape-input"
            spellCheck={false}
            autoFocus
            rows={2}
          />
        </div>

        {/* Right Sidebar - Using skill test design with white background */}
        <div className="w-full md:w-60 lg:w-80 bg-white border-t md:border-t-0 md:border-l p-3 md:p-3 lg:p-4 flex flex-col flex-shrink-0 min-h-0 landscape-sidebar sidebar-top-border">
          <div className="flex flex-col items-center space-y-3">
            {/* User Profile Picture */}
            <div className="mb-2">
              <img
                src={userProfileUrl}
                alt={userName}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gray-300"
                onError={(e) => {
                  e.target.src = "/lo.jpg";
                }}
              />
            </div>

            {/* Statistics Grid 2x2 */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {/* Correct */}
              <div className="h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Correct</div>
                <div className="bg-white text-green-600 text-sm font-bold">{correctWords}</div>
              </div>
              {/* Wrong */}
              <div className="h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Wrong</div>
                <div className="bg-white text-red-500 text-sm font-bold">{wrongWords}</div>
              </div>
              {/* Total */}
              <div className="h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Total</div>
                <div className="bg-white text-[#290c52] text-sm font-bold">{totalTyped}</div>
              </div>
              {/* Backspace */}
              <div className="h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Backspace</div>
                <div className="bg-white text-blue-500 text-sm font-bold">{backspaceCount}</div>
              </div>
            </div>

            {/* Speedometer */}
            <div className="mt-2 speedometer-container">
              <div className="relative w-20 h-20 md:w-24 md:h-24 bg-black rounded-full border-4 border-white flex items-center justify-center speedometer-gauge">
                <div className="absolute left-1 text-red-500 text-[6px] font-bold tracking-widest speedometer-label">SPEED</div>
                <svg width="100" height="100" viewBox="0 0 100 100" className="speedometer-svg">
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
                <span className="absolute bottom-5 text-red-500 font-bold text-xs speedometer-value">{wpm}</span>
              </div>
            </div>

            {/* Font Size Controls */}
            <div className="w-full">
              <p className="text-black text-xs font-semibold text-center mb-2">Font size</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                  className="bg-white text-black border-3 border-black rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
                  style={{ fontSize: 'clamp(10px, 1.5vw, 14px)', minHeight: '4vh', minWidth: '5vw' }}
                >
                  A -
                </button>
                <button
                  onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                  className="bg-white text-black border-3 border-black rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
                  style={{ fontSize: 'clamp(10px, 1.5vw, 14px)', minHeight: '4vh', minWidth: '5vw' }}
                >
                  A +
                </button>
              </div>
            </div>

            {/* Submit Section Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-2 md:py-2 lg:py-3 rounded-lg text-xs md:text-xs lg:text-base font-semibold hover:bg-blue-700 transition-colors mt-auto"
            >
              Submit Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

