"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useHindiTyping } from "@/hooks/useHindiTyping";

export default function ExamTypingInterface({
  content,
  onComplete,
  onProgress,
  userName = "User",
  userProfileUrl = "/lo.jpg",
  language = "English",
  scriptType = null,
  allowBackspace = true,
  duration = null,
  timeRemaining = null,
  onTimerUpdate = null
}) {
  const [typedText, setTypedText] = useState("");
  const [keystrokesCount, setKeystrokesCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [typedWordCount, setTypedWordCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [internalTimeRemaining, setInternalTimeRemaining] = useState(duration ? duration * 60 : null);
  const [wpm, setWpm] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const wordRefs = useRef([]);
  
  // Detect if Hindi typing is required
  const isHindiTyping = language === "Hindi";
  
  // Determine Hindi layout from scriptType
  const hindiLayout = scriptType && (
    scriptType.toLowerCase().includes('inscript') ? 'inscript' : 'remington'
  );
  
  // Initialize Hindi typing hook
  const hindiTyping = useHindiTyping(hindiLayout || 'remington', isHindiTyping, allowBackspace);
  
  // Function to detect if text contains English characters
  const containsEnglishChars = (text) => {
    if (!text) return false;
    return /[a-zA-Z]/.test(text);
  };
  
  // Function to detect if text contains Hindi characters
  const containsHindiChars = (text) => {
    if (!text) return false;
    return /[\u0900-\u097F]/.test(text);
  };
  
  // Use external timeRemaining if provided, otherwise use internal
  const timeRemainingToUse = timeRemaining !== null && timeRemaining !== undefined ? timeRemaining : internalTimeRemaining;

  // Use ref to track previous timeRemainingToUse to prevent infinite loops
  const prevTimeRemainingRef = useRef(timeRemainingToUse);
  const onTimerUpdateRef = useRef(onTimerUpdate);

  // Update ref when callback changes
  useEffect(() => {
    onTimerUpdateRef.current = onTimerUpdate;
  }, [onTimerUpdate]);

  // Initialize timer when duration changes - start immediately
  useEffect(() => {
    if (duration && timeRemaining === null && internalTimeRemaining === null) {
      const initialTime = duration * 60;
      setInternalTimeRemaining(initialTime);
      // Start timer immediately
      setIsActive(true);
      setStartTime(Date.now());
    }
  }, [duration, timeRemaining, internalTimeRemaining]);
  
  // Update parent with timer if callback provided - only when value actually changes
  useEffect(() => {
    if (onTimerUpdateRef.current && timeRemainingToUse !== null && prevTimeRemainingRef.current !== timeRemainingToUse) {
      prevTimeRemainingRef.current = timeRemainingToUse;
      onTimerUpdateRef.current(timeRemainingToUse);
    }
  }, [timeRemainingToUse]);
  
  // Split content into words - use useMemo to prevent unnecessary recalculations
  const words = useMemo(() => {
    return content ? content.trim().split(/\s+/).filter(w => w.length > 0) : [];
  }, [content]);
  
  const totalWordCount = words.length;
  
  // Use useMemo for typedWords to prevent infinite loops
  const typedWords = useMemo(() => {
    return typedText.trim().split(/\s+/).filter(w => w.length > 0);
  }, [typedText]);
  
  const pendingWordCount = Math.max(0, totalWordCount - typedWords.length);
  
  // Determine which word should be highlighted
  const highlightedIndex = typedText.trim() === ''
    ? 0
    : typedText.endsWith(' ') || typedText.endsWith('\n') || typedText.endsWith('\t')
      ? typedWords.length
      : typedWords.length > 0 ? typedWords.length - 1 : 0;

  // Timer effect - countdown when active (start immediately if timeRemaining is provided externally)
  useEffect(() => {
    // If external timeRemaining is provided, don't manage timer here (parent manages it)
    if (timeRemaining !== null && timeRemaining !== undefined) {
      return;
    }
    
    // Only use internal timer if external timeRemaining is not provided
    if (internalTimeRemaining !== null && internalTimeRemaining > 0) {
      const timer = setInterval(() => {
        setInternalTimeRemaining((prev) => {
          if (prev === null || prev <= 0) return 0;
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
  }, [internalTimeRemaining, timeRemaining, typedText, words, onComplete, startTime, backspaceCount, keystrokesCount, errorCount]);

  // Use ref for onProgress callback to prevent infinite loops
  const onProgressRef = useRef(onProgress);
  
  // Update ref when callback changes
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Use ref to track previous values to prevent unnecessary updates
  const prevProgressRef = useRef({
    typedWordCount: 0,
    errorCount: 0,
    backspaceCount: 0,
    keystrokesCount: 0
  });

  useEffect(() => {
    setTypedWordCount(typedWords.length);
    
    // Only call onProgress if values have actually changed
    const hasChanged = 
      prevProgressRef.current.typedWordCount !== typedWords.length ||
      prevProgressRef.current.errorCount !== errorCount ||
      prevProgressRef.current.backspaceCount !== backspaceCount ||
      prevProgressRef.current.keystrokesCount !== keystrokesCount;
    
    if (onProgressRef.current && startTime && hasChanged) {
      const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
      const calculatedWpm = elapsed > 0 ? Math.round(typedWords.length / elapsed) : 0;
      setWpm(calculatedWpm);
      const correctWords = typedWords.filter((word, i) => word === words[i]).length;
      const accuracy = typedWords.length > 0 ? Math.round((correctWords / typedWords.length) * 100) : 100;
      
      // Update ref with current values
      prevProgressRef.current = {
        typedWordCount: typedWords.length,
        errorCount,
        backspaceCount,
        keystrokesCount
      };
      
      onProgressRef.current({
        wpm: calculatedWpm,
        accuracy,
        mistakes: errorCount,
        backspaceCount,
        keystrokesCount,
        typedWordCount: typedWords.length
      });
    }
  }, [typedWords.length, errorCount, backspaceCount, keystrokesCount, startTime, words.length]);

  const handleInputChange = (e) => {
    let value = e.target.value;

    // Hindi: mobile fallback when keydown doesn't fire
    if (isHindiTyping && hindiTyping.isEnabled && hindiTyping.handleInputChange) {
      const converted = hindiTyping.handleInputChange(value, typedText);
      if (converted !== null) {
        const val = typeof converted === 'object' && 'value' in converted ? converted.value : converted;
        const cursor = typeof converted === 'object' && 'cursor' in converted ? converted.cursor : val.length;
        value = val;
        e.target.value = val;
        e.target.setSelectionRange(cursor, cursor);
      }
    }
    
    // Prevent unnecessary updates if value hasn't changed
    if (value === typedText) {
      return;
    }
    
    const previousLength = typedText.length;
    const newLength = value.length;
    
    // Calculate keystrokes (any character input)
    if (newLength > previousLength) {
      const addedChars = newLength - previousLength;
      setKeystrokesCount(prev => prev + addedChars);
    }
    
    // For Hindi typing with our converter, we don't need to show warning
    // The converter automatically handles English to Hindi conversion
    // No warning needed - automatic conversion handles everything
    
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
    // Handle Hindi typing conversion first
    if (isHindiTyping && hindiTyping.isEnabled) {
      const handled = hindiTyping.handleKeyDown(e, typedText, setTypedText);
      if (handled) {
        // Hindi conversion handled the event
        return;
      }
    }
    
    // Handle backspace
    if (e.key === "Backspace") {
      if (allowBackspace) {
        setBackspaceCount(prev => prev + 1);
        // Clear Hindi buffer on backspace
        if (isHindiTyping) {
          hindiTyping.clearBuffer();
        }
      } else {
        e.preventDefault();
      }
    } else if (e.key === " " || e.key === "Enter") {
      // Clear Hindi buffer on space or enter
      if (isHindiTyping) {
        hindiTyping.clearBuffer();
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

  // Format time for display
  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Portrait View - Mobile Only */}
      <div className="flex flex-col md:hidden h-full">
        {/* Top Section: User Profile, Stats, Speedometer */}
        <div className="flex items-start justify-between p-3 bg-white border-b border-gray-200">
          {/* Left: User Profile with A- below */}
          <div className="flex flex-col items-center justify-start" style={{ minHeight: '140px' }}>
            <img
              src={userProfileUrl}
              alt={userName}
              className="w-16 h-16 rounded-full border-2 border-gray-300 flex-shrink-0"
              onError={(e) => {
                e.target.src = "/lo.jpg";
              }}
            />
            <p className="text-xs mt-1 text-center font-semibold text-gray-700 whitespace-nowrap">{userName}</p>
            {/* A- button below profile - aligned with A+ */}
            <button
              onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
              className="bg-white text-black border-2 border-black rounded-md px-3 py-1.5 mt-auto hover:bg-gray-100 transition-colors text-xs font-semibold w-full"
            >
              A -
            </button>
          </div>

          {/* Center: Statistics Grid 2x2 */}
          <div className="flex-1 grid grid-cols-2 gap-2 mx-4">
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
            {/* Timer - spans 2 columns, placed last */}
            {timeRemainingToUse !== null && (
              <div className="col-span-2 h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
                <div className="bg-white text-black text-sm font-bold">{formatTime(timeRemainingToUse)}</div>
              </div>
            )}
          </div>

          {/* Right: Speedometer with A+ below */}
          <div className="flex flex-col items-center justify-start speedometer-container" style={{ minHeight: '140px' }}>
            <div className="relative w-16 h-16 bg-black rounded-full border-4 border-white flex items-center justify-center speedometer-gauge flex-shrink-0">
              <div className="absolute left-1 text-red-500 text-[6px] font-bold tracking-widest speedometer-label">SPEED</div>
              <svg width="64" height="64" viewBox="0 0 100 100" className="speedometer-svg" style={{ width: '64px', height: '64px' }}>
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
              <span className="absolute bottom-3 text-red-500 font-bold text-[10px] speedometer-value">{wpm}</span>
            </div>
            {/* A+ button below speedometer - aligned with A- */}
            <button
              onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
              className="bg-white text-black border-2 border-black rounded-md px-3 py-1.5 mt-auto hover:bg-gray-100 transition-colors text-xs font-semibold w-full"
            >
              A +
            </button>
          </div>
        </div>

        {/* Text to Type Box */}
        <div
          ref={containerRef}
          className="flex-1 bg-white border-2 border-gray-300 rounded-lg p-3 m-2 overflow-y-auto min-h-0 scrollbar-hide"
        >
          {renderTextContent()}
        </div>

        {/* Input Field */}
        <div className="p-2 bg-white border-t border-gray-200">
          {/* No keyboard warning - automatic conversion handles everything */}
          <textarea
            ref={inputRef}
            value={typedText}
            onInput={handleInputChange}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyUp={isHindiTyping ? (ev) => hindiTyping.handleKeyUp(ev, typedText, setTypedText) : undefined}
            placeholder={isHindiTyping ? `Type Here in Hindi (${hindiLayout === 'inscript' ? 'InScript' : 'Remington'} layout) ...` : "Type Here ..."}
            lang={isHindiTyping ? "hi" : undefined}
            inputMode={isHindiTyping ? "text" : undefined}
            className="w-full h-28 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono resize-none"
            spellCheck={false}
            autoFocus
            rows={2}
          />
        </div>

        {/* Submit Button */}
        <div className="p-2 bg-white border-t border-gray-200">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Section
          </button>
        </div>
      </div>

      {/* Desktop and Landscape View - Keep Original Layout */}
      <div className="hidden md:flex flex-1 flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left: Text Display and Input */}
        <div className="flex-1 flex flex-col p-2 md:p-3 lg:p-4 overflow-hidden min-h-0">
          {/* Text to Type Box */}
          <div
            ref={containerRef}
            className="flex-1 bg-white border-2 border-gray-300 rounded-lg p-3 md:p-3 lg:p-4 mb-2 md:mb-2 lg:mb-4 overflow-y-auto min-h-0 scrollbar-hide landscape-typing-box"
          >
            {renderTextContent()}
          </div>

          {/* No keyboard warning - automatic conversion handles everything */}
          <textarea
            ref={inputRef}
            value={typedText}
            onInput={handleInputChange}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onKeyUp={isHindiTyping ? (ev) => hindiTyping.handleKeyUp(ev, typedText, setTypedText) : undefined}
            placeholder={isHindiTyping ? `Type Here in Hindi (${hindiLayout === 'inscript' ? 'InScript' : 'Remington'} layout) ...` : "Type Here ..."}
            lang={isHindiTyping ? "hi" : undefined}
            inputMode={isHindiTyping ? "text" : undefined}
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

