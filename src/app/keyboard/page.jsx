"use client";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Sun, Moon, RotateCw, X, Settings } from "lucide-react";
import { getLearningData, getLessonContent } from "@/lib/learningData";

// Debug: add ?debug=1 to keyboard URL to show alerts for mobile keyboard testing.
// Without ?debug=1, only console.log("[Keyboard]", ...) runs (no alerts).
function debugLog(...args) {
  console.log("[Keyboard]", ...args);
}

// Typing key handling: single unified handleTypingKey(key, source).
// - Desktop: window keydown -> handleTypingKey(e.key, "desktop") [disabled on mobile UA to prevent double trigger].
// - Mobile: hidden input onBeforeInput + onInput -> lastChar = e.data || e.target.value.slice(-1) -> handleTypingKey(lastChar, "mobile"); clear input.
// Hidden input: autoFocus, opacity 0, absolute, ref; prevent blur (refocus on blur); clear after read.

// ==================== DESKTOP VIEW COMPONENT ====================
function DesktopView({
  isDarkMode,
  highlightedKeys,
  currentIndex,
  currentRowIndex,
  isRowAnimating,
  keyStatus,
  pressedKey,
  hand,
  sound,
  keyboard,
  leftHandImage,
  rightHandImage,
  keys,
  getKeyWidth,
  getCurrentRowKeys,
  organizeKeysIntoRows,
  formatClock,
  correctCount,
  wrongCount,
  totalCount,
  backspaceCount,
  elapsedTime,
  wpm,
  userName,
  userProfileUrl,
  resetStats,
  setHand,
  setSound,
  setKeyboard,
  timer,
  totalAttempts
}) {
  const currentRowKeys = getCurrentRowKeys();
  const rows = organizeKeysIntoRows(highlightedKeys);
  
  const getOriginalIndex = (displayKeyIdx) => {
    if (displayKeyIdx >= currentRowKeys.length) return -1;
    
    const displayKey = currentRowKeys[displayKeyIdx];
    if (displayKey === "Space") {
      // Find the space in the original highlightedKeys array for this row
      // Count keys up to this row, then find the space at this position
      let keysBeforeRow = 0;
      for (let r = 0; r < currentRowIndex; r++) {
        const row = rows[r];
        if (row) keysBeforeRow += row.length;
      }
      
      // Count spaces before this display index in current row
      let spaceCountInRow = 0;
      for (let i = 0; i < displayKeyIdx; i++) {
        if (currentRowKeys[i] === "Space") spaceCountInRow++;
      }
      
      // Find the corresponding space in highlightedKeys
      let spaceCount = 0;
      for (let i = 0; i < highlightedKeys.length; i++) {
        if (highlightedKeys[i] === "Space") {
          if (spaceCount === spaceCountInRow && i >= keysBeforeRow) {
            return i;
          }
          spaceCount++;
        }
      }
      return -1;
    }
    
    // For non-space keys, map display position to original position
    // Count how many non-space keys before this display index in current row
    let nonSpaceCountInRow = 0;
    for (let i = 0; i < displayKeyIdx; i++) {
      if (currentRowKeys[i] !== "Space") nonSpaceCountInRow++;
    }
    
    // Count non-space keys before current row
    let nonSpaceCountBeforeRow = 0;
    for (let r = 0; r < currentRowIndex; r++) {
      const row = rows[r];
      if (row) {
        for (const key of row) {
          if (key !== "Space") nonSpaceCountBeforeRow++;
        }
      }
    }
    
    // Find the original index
    let nonSpaceCount = 0;
    for (let i = 0; i < highlightedKeys.length; i++) {
      if (highlightedKeys[i] !== "Space") {
        if (nonSpaceCount === nonSpaceCountBeforeRow + nonSpaceCountInRow) {
          return i;
        }
        nonSpaceCount++;
      }
    }
    return -1;
  };

  return (
    <div className="p-4 flex flex-col md:flex-row gap-6 w-full min-h-full relative" style={{ minHeight: '100dvh' }}>
      {/* Close Button - Desktop View */}
      <button
        onClick={() => window.location.href = '/learning'}
        className="fixed top-4 right-4 z-50 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Close and return to learning page"
      >
        Close
      </button>

      {/* Left Section */}
      <div className="flex-1 flex flex-col items-center gap-6 mobile-stack">
        {/* Typing Prompt Buttons - Desktop row-based layout */}
        <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2 relative mobile-tight-gap typing-prompt-container">
          {currentRowKeys.map((key, displayIdx) => {
            const originalIndex = getOriginalIndex(displayIdx);
            const isCurrentKey = originalIndex === currentIndex;
            const keyStatusForThisKey = originalIndex >= 0 ? keyStatus[originalIndex] : null;
            const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
            // Check if previous key was a space (for dynamic spacing)
            const previousKeyWasSpace = displayIdx > 0 && currentRowKeys[displayIdx - 1] === "Space";
            
            let marginClass = "";
            if (displayIdx === 0) {
              marginClass = "";
            } else if (previousKeyWasSpace) {
              marginClass = "md:ml-8 ml-6";
            } else {
              marginClass = "md:ml-2 ml-1.5";
            }
            
            return (
              <div
                key={`${currentRowIndex}-${displayIdx}`}
                className={`
                  ${key === "Space" ? "w-28 h-20 md:w-35 md:h-14 mt-1 mobile-space-key" : "w-16 h-14 mobile-small-key"}
                  rounded flex items-center justify-center text-2xl font-semibold mobile-small-text
                  ${marginClass}
                  transition-all duration-150
                  ${isRowAnimating ? 'animate-slide-in-right-key' : ''}
                  ${
                    keyStatusForThisKey === "wrong"
                      ? "bg-red-600 border-red-600 text-white"
                      : keyStatusForThisKey === "correct"
                      ? "bg-green-300 border-green-600 text-green-800"
                      : isCurrentKey && key === "Space"
                      ? "bg-blue-600 border-blue-400 border-2 text-white"
                      : isCurrentKey
                      ? "bg-blue-600 border-blue-400 border-2 text-white"
                      : isPressed && key === "Space"
                      ? "bg-gray-400 text-white border-gray-500 border-2 scale-95"
                      : isPressed
                      ? "bg-gray-400 text-white border-gray-500 border-2 scale-95"
                      : isDarkMode
                      ? "bg-white text-black border-white"
                      : "bg-white text-black border-black"
                  }
                  border
                `}
                style={isRowAnimating ? {
                  animationDelay: `${displayIdx * 0.05}s`
                } : {}}
              >
                {key === "Space" ? "Space" : key.toLowerCase()}
              </div>
            );
          })}
        </div>

        {/* Desktop Toggles */}
        <div className="hidden md:hidden lg:flex flex items-center gap-4 mt-2 mobile-tight-gap mobile-small-text">
          {/* Hand Toggle */}
          <label className="flex items-center gap-2">
            <span>Hand</span>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={hand}
                onChange={() => setHand(!hand)}
                className="sr-only peer"
              />
              <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
            </div>
          </label>

          {/* Sound Toggle */}
          <label className="flex items-center gap-2">
            <span>Sound</span>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={sound}
                onChange={() => setSound(!sound)}
                className="sr-only peer"
              />
              <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
            </div>
          </label>

          {/* Keyboard Toggle */}
          <label className="flex items-center gap-2">
            <span>Keyboard</span>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={keyboard}
                onChange={() => setKeyboard(!keyboard)}
                className="sr-only peer"
              />
              <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
            </div>
          </label>

          {/* Reset Button */}
          <button
            onClick={resetStats}
            className="ml-4 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white mobile-small-text"
          >
            Reset
          </button>
        </div>

        {/* Keyboard */}
        {keyboard && (
          <div className={`relative mt-4 p-5 border border-gray-600 rounded-3xl shadow-md keyboard-container ${
            isDarkMode ? "bg-[#403B3A]" : "bg-gray-200"
          } mobile-scale`}>
            
            {/* Dual Hand Image Overlay */}
            {hand && (leftHandImage || rightHandImage) && (
              <div className="absolute inset-0 pointer-events-none z-10 hand-overlay">
                <div className="absolute left-[-10px] top-78 transform -translate-y-1/2 -translate-x-12">
                  <img 
                    src={leftHandImage} 
                    alt="Left hand finger position" 
                    className="w-130 h-600 object-contain opacity-85 transition-all duration-500 ease-in-out transform scale-110"
                  />
                </div>
                
                <div className="absolute right-33 top-78 transform -translate-y-1/2 translate-x-12">
                  <img 
                    src={rightHandImage} 
                    alt="Right hand finger position" 
                    className="w-130 h-600 object-contain opacity-85 transition-all duration-500 ease-in-out transform scale-110"
                  />
                </div>
                
                {pressedKey && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-lg font-bold shadow-lg animate-pulse">
                      {pressedKey}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Full Keyboard Layout */}
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex mb-2.5">
                {row.map((key, keyIndex) => {
                  const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
                  const isCurrentKey = highlightedKeys[currentIndex] === key;
                  return (
                    <div
                      key={keyIndex}
                      className={`h-14 text-base ${getKeyWidth(key)} mx-1 rounded flex items-center justify-center 
                        border transition-all duration-200 ease-out ${
                          isDarkMode ? "border-gray-600 text-white" : "border-gray-400 text-gray-800"
                        }
                        ${
                          isPressed ? (isDarkMode ? "bg-gray-600 text-white border-gray-500 border-2 scale-95" : "bg-gray-400 text-gray-900 border-gray-500 border-2 scale-95") :
                          isCurrentKey ? "bg-blue-500 text-white border-blue-400 border-2" :
                          isDarkMode ? "bg-black text-white border-gray-600" : "bg-gray-300 text-gray-800 border-gray-400"
                        }`}
                    >
                      {key === "Space" ? "Space" : key}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Section - Desktop Stats */}
      <div className="hidden md:flex flex-col items-center md:mt-25 mt-15 mobile-stack mobile-small-text right-section-stats">
        <div className="flex flex-col items-center user-profile-section user-profile-landscape mb-16">
          <img
            src={userProfileUrl}
            alt="User"
            className="w-30 h-25 rounded-md border-2 border-white mobile-scale user-profile-image"
            onError={(e) => {
              e.target.src = "/lo.jpg";
            }}
          />
          <p className="font-semibold text-xs md:text-sm mt-1 user-profile-name">{userName}</p>
        </div>
        
        <div className="w-24 h-9 rounded-lg overflow-hidden text-center mb-10 shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)] mobile-scale">
          <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
          <div className="bg-white text-black text-sm font-bold">{formatClock(timer)}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-6 mb-10 gap-x-4 md:gap-x-4 w-full text-center mobile-tight-gap mobile-scale stats-grid-landscape">
          {[
            { label: "Correct", value: correctCount, color: "text-green-600" },
            { label: "Wrong", value: wrongCount, color: "text-red-500" },
            { label: "Total", value: totalCount, color: "text-[#290c52]" },
            { label: "Backspace", value: backspaceCount, color: "text-blue-500" }
          ].map(({ label, value, color }, i) => (
            <div key={i} className="w-full sm:w-24 h-9 rounded-lg overflow-hidden shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">{label}</div>
              <div className={`bg-white ${color} text-sm font-bold`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Speedometer */}
        <div className="hidden lg:block mt-10 mobile-scale">
          <div className="border-6 border-black rounded-full">
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
      </div>
    </div>
  );
}

// ==================== PORTRAIT MOBILE VIEW COMPONENT ====================
function PortraitMobileView({
  isDarkMode,
  setIsDarkMode,
  highlightedKeys,
  currentIndex,
  currentRowIndex,
  isRowAnimating,
  keyStatus,
  pressedKey,
  keyboard,
  hand,
  sound,
  setHand,
  setSound,
  setKeyboard,
  resetStats,
  keys,
  getKeyWidth,
  getCurrentRowKeys,
  organizeKeysIntoRows,
  correctCount,
  wrongCount,
  timer,
  elapsedTime,
  totalAttempts,
  formatClock,
  leftHandImage,
  rightHandImage,
  onRequestFocusInput
}) {
  const [showSettings, setShowSettings] = useState(false);
  const currentRowKeys = getCurrentRowKeys();
  const rows = organizeKeysIntoRows(highlightedKeys);
  
  const getOriginalIndex = (displayKeyIdx) => {
    if (displayKeyIdx >= currentRowKeys.length) return -1;
    
    const displayKey = currentRowKeys[displayKeyIdx];
    if (displayKey === "Space") {
      // Find the space in the original highlightedKeys array for this row
      let keysBeforeRow = 0;
      for (let r = 0; r < currentRowIndex; r++) {
        const row = rows[r];
        if (row) keysBeforeRow += row.length;
      }
      
      let spaceCountInRow = 0;
      for (let i = 0; i < displayKeyIdx; i++) {
        if (currentRowKeys[i] === "Space") spaceCountInRow++;
      }
      
      let spaceCount = 0;
      for (let i = 0; i < highlightedKeys.length; i++) {
        if (highlightedKeys[i] === "Space") {
          if (spaceCount === spaceCountInRow && i >= keysBeforeRow) {
            return i;
          }
          spaceCount++;
        }
      }
      return -1;
    }
    
    let nonSpaceCountInRow = 0;
    for (let i = 0; i < displayKeyIdx; i++) {
      if (currentRowKeys[i] !== "Space") nonSpaceCountInRow++;
    }
    
    let nonSpaceCountBeforeRow = 0;
    for (let r = 0; r < currentRowIndex; r++) {
      const row = rows[r];
      if (row) {
        for (const key of row) {
          if (key !== "Space") nonSpaceCountBeforeRow++;
        }
      }
    }
    
    let nonSpaceCount = 0;
    for (let i = 0; i < highlightedKeys.length; i++) {
      if (highlightedKeys[i] !== "Space") {
        if (nonSpaceCount === nonSpaceCountBeforeRow + nonSpaceCountInRow) {
          return i;
        }
        nonSpaceCount++;
      }
    }
    return -1;
  };
  return (
    <div className="p-4 flex flex-col gap-6 w-full min-h-full" style={{ minHeight: '100dvh' }}>
      {/* Theme Toggle and Settings - Portrait Mobile: safe area, larger tap targets, less cramped */}
      <div
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-full shadow min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isDarkMode ? "bg-white text-black" : "bg-black text-white"
            }`}
            aria-label="Settings"
          >
            <Settings size={22} />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full shadow min-w-[44px] min-h-[44px] flex items-center justify-center ${
              isDarkMode ? "bg-white text-black" : "bg-black text-white"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
        <button
          onClick={() => window.location.href = '/learning'}
          className={`py-3 px-4 rounded-lg shadow-lg min-h-[44px] font-medium text-sm ${
            isDarkMode ? "bg-red-600 text-white hover:bg-red-700" : "bg-white text-black border border-gray-300 hover:bg-gray-100"
          }`}
          aria-label="Close and return to learning page"
        >
          Close
        </button>
      </div>

      {/* Mobile Statistics Section - Top (below safe header) */}
      <div className="md:hidden w-full flex items-center justify-center gap-9 mb-4 px-18 mt-20 pr-18" style={{ marginTop: 'max(5rem, calc(env(safe-area-inset-top, 0px) + 4rem))' }}>
        <div className="flex-1 text-center">
          <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{correctCount}</div>
          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Correct</div>
        </div>
        <div className="flex-1 text-center">
          <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{wrongCount}</div>
          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Wrong</div>
        </div>
        <div className="flex-1 text-center">
          <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : (correctCount === 0 && wrongCount === 0 ? 0 : 100)}%</div>
          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Accuracy</div>
        </div>
        <div className="flex-1 text-center">
          <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{formatClock(timer)}</div>
          <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Timer</div>
        </div>
      </div>

      {/* Left Section - data-typing-area for app WebView so taps focus input and mobile keyboard works */}
      <div className="flex-1 flex flex-col items-center gap-6 mobile-stack" data-typing-area>
        {/* Typing Prompt - Tap to open keyboard and type */}
        <div 
          className="flex flex-nowrap justify-between items-center gap-0.5 relative mt-6 px-1 typing-prompt-container w-full portrait-typing-prompt touch-manipulation cursor-pointer active:opacity-90"
          style={{ overflow: 'hidden', maxWidth: '100%', WebkitTapHighlightColor: 'transparent' }}
          onClick={(e) => { e.preventDefault(); onRequestFocusInput?.(); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onRequestFocusInput?.(); }}
          aria-label="Tap to open keyboard and type"
        >
          {currentRowKeys.map((key, displayIdx) => {
            const originalIndex = getOriginalIndex(displayIdx);
            const isCurrentKey = originalIndex === currentIndex;
            const keyStatusForThisKey = originalIndex >= 0 ? keyStatus[originalIndex] : null;
            const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
            
            return (
              <div
                key={`${currentRowIndex}-${displayIdx}`}
                className={`
                  ${key === "Space" ? "w-12 h-10 min-w-[36px]" : "w-8 h-10 min-w-[24px]"}
                  rounded flex items-center justify-center text-xs font-semibold
                  transition-all duration-200 ease-out flex-shrink-0 portrait-char-box
                  ${isRowAnimating ? 'animate-slide-in-right-key' : ''}
                  ${
                    keyStatusForThisKey === "wrong"
                      ? "bg-red-600 border-red-600 text-white"
                      : keyStatusForThisKey === "correct"
                      ? "bg-green-300 border-green-600 text-green-800"
                      : isCurrentKey && key === "Space"
                      ? "bg-blue-600 border-blue-400 border-2 text-white"
                      : isCurrentKey
                      ? "bg-blue-600 border-blue-400 border-2 text-white"
                      : isPressed && key === "Space"
                      ? "bg-gray-400 text-white border-gray-500 border-2 scale-95"
                      : isPressed
                      ? "bg-gray-400 text-white border-gray-500 border-2 scale-95"
                      : "bg-white text-black border-gray-300"
                  }
                  border
                `}
                style={isRowAnimating ? { animationDelay: `${displayIdx * 0.05}s` } : undefined}
              >
                {key === "Space" ? "Space" : key.toLowerCase()}
              </div>
            );
          })}
        </div>
        <p className={`text-center text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Tap above to open keyboard
        </p>

        {/* Rotation Prompt - Rotate your phone (original in-view design) */}
        <div className="rotate-prompt-mobile fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 shadow-lg border border-gray-700 md:hidden" style={{ pointerEvents: 'none' }}>
          <div className="relative flex items-center justify-center w-20 h-20 animate-rotate-phone" style={{ transformOrigin: 'center center' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0">
              <path
                d="M 20 20 Q 10 40, 20 60"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />
              <path
                d="M 18 25 L 20 20 L 22 25"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 60 60 Q 70 40, 60 20"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />
              <path
                d="M 62 55 L 60 60 L 58 55"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="relative w-9 h-14 bg-blue-500 rounded-md border-2 border-blue-400 flex flex-col items-center justify-between py-1.5">
              <div className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
              <div className="flex-1 w-5 bg-blue-400 rounded my-1" />
              <div className="w-2.5 h-0.5 bg-blue-300 rounded" />
            </div>
          </div>
          <div className="flex flex-row items-center text-white font-semibold text-sm gap-1">
            <span>Rotate</span>
            <span>Your</span>
            <span>Phone</span>
          </div>
        </div>

        {/* Keyboard */}
        {keyboard && (
          <div 
            className={`relative mt-4 p-1 w-full border border-gray-600 rounded-3xl shadow-md keyboard-container portrait-keyboard touch-manipulation cursor-pointer active:opacity-95 ${
              isDarkMode ? "bg-[#403B3A]" : "bg-gray-200"
            }`}
            onClick={() => onRequestFocusInput?.()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onRequestFocusInput?.(); }}
            aria-label="Tap to open keyboard and type"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <style jsx>{`
              /* PORTRAIT: Increase space button size */
              .portrait-keyboard .flex > div[class*="flex-1"] {
                min-width: 100px !important;
                width: auto !important;
                max-width: 100% !important;
                height: 33px !important;
                font-size: 0.6rem !important;
                font-weight: 600 !important;
              }
              
              /* PORTRAIT: Dual hand overlay - same dynamic images as landscape so hands move when typing */
              .portrait-keyboard-hand-overlay {
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: space-between;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                padding: 0 2%;
              }
              
              .portrait-keyboard-hand-image {
                width: 42%;
                max-width: 42%;
                height: auto;
                object-fit: contain;
                opacity: 0.85;
                transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
              }
              .portrait-keyboard-hand-image.left {
                object-position: left center;
              }
              .portrait-keyboard-hand-image.right {
                object-position: right center;
              }
            `}</style>
            
            {/* Hand Image Overlay - key forces re-paint when finger changes (helps on real mobile) */}
            {hand && (leftHandImage || rightHandImage) && (
              <div className="portrait-keyboard-hand-overlay" style={{ zIndex: 15 }}>
                <img 
                  key={`${leftHandImage}-${pressedKey}`}
                  src={leftHandImage} 
                  alt="Left hand position" 
                  className="portrait-keyboard-hand-image left"
                  style={{ backfaceVisibility: 'hidden' }}
                />
                <img 
                  key={`${rightHandImage}-${pressedKey}`}
                  src={rightHandImage} 
                  alt="Right hand position" 
                  className="portrait-keyboard-hand-image right"
                  style={{ backfaceVisibility: 'hidden' }}
                />
              </div>
            )}
            
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex mb-1">
                {row.map((key, keyIndex) => {
                  const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
                  const isCurrentKey = highlightedKeys[currentIndex] === key;
                  return (
                    <div
                      key={keyIndex}
                      className={`h-7 text-[7px] ${getKeyWidth(key)} mx-0.5 rounded flex items-center justify-center 
                        border transition-all duration-200 ease-out ${
                          isDarkMode ? "border-gray-600 text-white" : "border-gray-400 text-gray-800"
                        }
                        ${
                          isPressed ? (isDarkMode ? "bg-gray-600 text-white border-gray-500 border-2 scale-95" : "bg-gray-400 text-gray-900 border-gray-500 border-2 scale-95") :
                          isCurrentKey ? "bg-blue-500 text-white border-blue-400 border-2" :
                          isDarkMode ? "bg-black text-white border-gray-600" : "bg-gray-300 text-gray-800 border-gray-400"
                        }`}
                    >
                      {key === "Space" ? "Space" : key}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Popup Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className={`rounded-lg p-6 max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 1000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-1 hover:bg-gray-200 rounded ${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-black'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Hand Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Hand</span>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={hand}
                    onChange={() => setHand(!hand)}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
                </div>
              </label>

              {/* Sound Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Sound</span>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={sound}
                    onChange={() => setSound(!sound)}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
                </div>
              </label>

              {/* Keyboard Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Keyboard</span>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={keyboard}
                    onChange={() => setKeyboard(!keyboard)}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
                </div>
              </label>

              {/* Reset Button */}
              <button
                onClick={() => {
                  resetStats();
                  setShowSettings(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white text-sm font-medium mt-2"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== LANDSCAPE MOBILE VIEW COMPONENT ====================
function LandscapeMobileView({
  isDarkMode,
  setIsDarkMode,
  highlightedKeys,
  currentIndex,
  currentRowIndex,
  keyStatus,
  pressedKey,
  keyboard,
  hand,
  sound,
  setHand,
  setSound,
  setKeyboard,
  resetStats,
  leftHandImage,
  rightHandImage,
  keys,
  getKeyWidth,
  getCurrentRowKeys,
  organizeKeysIntoRows,
  correctCount,
  wrongCount,
  totalCount,
  backspaceCount,
  elapsedTime,
  formatClock,
  timer
}) {
  const [showSettings, setShowSettings] = useState(false);
  const currentRowKeys = getCurrentRowKeys();
  const rows = organizeKeysIntoRows(highlightedKeys);
  
  const getOriginalIndex = (displayKeyIdx) => {
    if (displayKeyIdx >= currentRowKeys.length) return -1;
    
    const displayKey = currentRowKeys[displayKeyIdx];
    if (displayKey === "Space") {
      // Find the space in the original highlightedKeys array for this row
      // Count keys up to this row, then find the space at this position
      let keysBeforeRow = 0;
      for (let r = 0; r < currentRowIndex; r++) {
        const row = rows[r];
        if (row) keysBeforeRow += row.length;
      }
      
      // Count spaces before this display index in current row
      let spaceCountInRow = 0;
      for (let i = 0; i < displayKeyIdx; i++) {
        if (currentRowKeys[i] === "Space") spaceCountInRow++;
      }
      
      // Find the corresponding space in highlightedKeys
      let spaceCount = 0;
      for (let i = 0; i < highlightedKeys.length; i++) {
        if (highlightedKeys[i] === "Space") {
          if (spaceCount === spaceCountInRow && i >= keysBeforeRow) {
            return i;
          }
          spaceCount++;
        }
      }
      return -1;
    }
    
    // For non-space keys, map display position to original position
    // Count how many non-space keys before this display index in current row
    let nonSpaceCountInRow = 0;
    for (let i = 0; i < displayKeyIdx; i++) {
      if (currentRowKeys[i] !== "Space") nonSpaceCountInRow++;
    }
    
    // Count non-space keys before current row
    let nonSpaceCountBeforeRow = 0;
    for (let r = 0; r < currentRowIndex; r++) {
      const row = rows[r];
      if (row) {
        for (const key of row) {
          if (key !== "Space") nonSpaceCountBeforeRow++;
        }
      }
    }
    
    // Find the original index
    let nonSpaceCount = 0;
    for (let i = 0; i < highlightedKeys.length; i++) {
      if (highlightedKeys[i] !== "Space") {
        if (nonSpaceCount === nonSpaceCountBeforeRow + nonSpaceCountInRow) {
          return i;
        }
        nonSpaceCount++;
      }
    }
    return -1;
  };

  return (
    <div className="pl-4 pr-4 pt-4 pb-4 flex flex-col md:flex-row gap-6 w-full min-h-full landscape-mobile-view-container" style={{ minHeight: '100dvh' }}>
      {/* Settings Popup Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className={`rounded-lg p-6 max-w-sm w-full mx-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 1000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-1 hover:bg-gray-200 rounded ${isDarkMode ? 'text-white hover:bg-gray-700' : 'text-black'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Hand Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Hand</span>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={hand}
                    onChange={() => setHand(!hand)}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
                </div>
              </label>

              {/* Sound Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Sound</span>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={sound}
                    onChange={() => setSound(!sound)}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
                </div>
              </label>

              {/* Keyboard Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Keyboard</span>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={keyboard}
                    onChange={() => setKeyboard(!keyboard)}
                    className="sr-only peer"
                  />
                  <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 peer-checked:translate-x-6"></div>
                </div>
              </label>

              {/* Reset Button */}
              <button
                onClick={() => {
                  resetStats();
                  setShowSettings(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white text-sm font-medium mt-2"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Section - data-typing-area for app WebView so taps focus input and mobile keyboard works */}
      <div className="flex-1 flex flex-col items-center gap-6 mobile-stack relative" data-typing-area>
        {/* Typing Prompt Buttons - Landscape mobile row-based layout */}
        <div 
          className="flex flex-nowrap typing-prompt-mobile justify-between items-center gap-1 md:gap-2 absolute top-0 left-2 typing-prompt-container landscape-typing-prompt"
          style={{ width: 'calc(100% - 280px)', overflow: 'visible', paddingRight: '0', marginRight: '0' }}
        >
          {currentRowKeys.map((key, displayIdx) => {
            const originalIndex = getOriginalIndex(displayIdx);
            const isCurrentKey = originalIndex === currentIndex;
            const keyStatusForThisKey = originalIndex >= 0 ? keyStatus[originalIndex] : null;
            const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
            
            // No margin classes for landscape - use gap instead
            let marginClass = "";
            
            return (
              <div
                key={`${currentRowIndex}-${displayIdx}`}
                className={`
                  ${key === "Space" ? "w-32 h-14 text-xl" : "w-16 h-14"}
                  rounded flex items-center justify-center text-2xl font-semibold
                  transition-all duration-200 ease-out flex-shrink-0 landscape-char-box
               
                  ${
                    keyStatusForThisKey === "wrong"
                      ? "bg-red-600 border-red-600 text-white"
                      : keyStatusForThisKey === "correct"
                      ? "bg-green-300 border-green-600 text-green-800"
                      : isCurrentKey && key === "Space"
                      ? "bg-blue-600 border-blue-400 border-2 text-white"
                      : isCurrentKey
                      ? "bg-blue-600 border-blue-400 border-2 text-white"
                      : isPressed && key === "Space"
                      ? "bg-gray-400 text-white border-gray-500 border-2 scale-95"
                      : isPressed
                      ? "bg-gray-400 text-white border-gray-500 border-2 scale-95"
                      : "bg-white text-black border-gray-300"
                  }
                  border
                `}
              >
                {key === "Space" ? "Space" : key.toLowerCase()}
              </div>
            );
          })}
        </div>

        {/* Spacer to push keyboard down when typing prompt is absolute */}
        <div className="h-20 landscape-prompt-spacer"></div>

        {/* Keyboard */}
        {keyboard && (
          <div className={`absolute top-22 left-2 p-1 border border-gray-600 rounded-xl shadow-md keyboard-container landscape-keyboard-small ${
            isDarkMode ? "bg-[#403B3A]" : "bg-gray-200"
          }`}>
            
            {/* Dual Hand Image Overlay */}
            {hand && (leftHandImage || rightHandImage) && (
              <div className="absolute inset-0 pointer-events-none z-10 hand-overlay">
                <div className="absolute left-[-45px] top-55 transform -translate-y-1/2 -translate-x-12">
                  <img 
                    src={leftHandImage} 
                    alt="Left hand finger position" 
                    className="w-100 h-260 object-contain opacity-85 transition-all duration-500 ease-in-out transform scale-110"
                  />
                </div>
                
                <div className="absolute right-6 top-55 transform -translate-y-1/2 translate-x-12">
                  <img 
                    src={rightHandImage} 
                    alt="Right hand finger position" 
                    className="w-100 h-260 object-contain opacity-85 transition-all duration-500 ease-in-out transform scale-110"
                  />
                </div>
                
                {pressedKey && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-lg font-bold shadow-lg animate-pulse">
                      {pressedKey}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <style jsx>{`
              /* LANDSCAPE: Show hand overlay in landscape keyboard */
              .landscape-keyboard-small .hand-overlay {
                display: block !important;
              }
              
              /* LANDSCAPE: Base keyboard styles - keys remain unchanged */
              /* Only affects landscape-keyboard-small, not desktop keyboard-container */
              /* Account for stats panel (120px) + gap (4rem) on right side */
              .landscape-keyboard-small {
                width: calc(100% - 280px) !important;
                max-width: calc(100% - 280px) !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                transform-origin: left top !important;
                left: 0.5rem !important;
                right: auto !important;
              }
              
              /* LANDSCAPE: Align typing prompt container with keyboard edges */
              .landscape-typing-prompt {
                position: absolute !important;
                left: 0.5rem !important;
                top: 0 !important;
                width: calc(100% - 280px) !important;
                max-width: calc(100% - 280px) !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                justify-content: space-between !important;
                overflow: visible !important;
                flex-wrap: nowrap !important;
                box-sizing: border-box !important;
                right: auto !important;
                gap: 2rem !important;
              }
              
              /* LANDSCAPE: Ensure first and last boxes align with keyboard edges */
              .landscape-typing-prompt > div:first-child {
                margin-left: 0 !important;
              }
              
              .landscape-typing-prompt > div:last-child {
                margin-right: 0 !important;
              }
              
              /* LANDSCAPE: Character boxes size - increased to w-20 (80px) to span full width */
              .landscape-typing-prompt > div.landscape-char-box:not([class*="w-22"]):not([class*="w-24"]):not([class*="w-32"]),
              .landscape-typing-prompt > div[class*="w-20"]:not([class*="w-22"]):not([class*="w-24"]):not([class*="w-32"]),
              .landscape-typing-prompt > div[class*="w-15"]:not([class*="w-22"]):not([class*="w-24"]):not([class*="w-32"]) {
                width: 80px !important;
                min-width: 80px !important;
                max-width: 80px !important;
                flex-shrink: 0 !important;
              }
              
              /* LANDSCAPE: Space box size - increased to w-32 (128px) */
              .landscape-typing-prompt > div[class*="w-32"] {
                width: 140px !important;
                min-width: 140px !important;
                max-width: 140px !important;
                flex-shrink: 0 !important;
              }
              
              /* LANDSCAPE: Add spacer for absolute positioned typing prompt */
              .landscape-prompt-spacer {
                height: 80px !important;
              }
              
              /* Base pixel sizes - keys stay the same size */
              .landscape-keyboard-small .flex > div {
                height: 44px !important;
                min-height: 44px !important;
                max-height: 34px !important;
                font-size: 0.9rem !important;
                margin-left: 0.5px !important;
                margin-right: 0.5px !important;
                padding: 2px 1px !important;
                line-height: 1 !important;
              }
              
              .landscape-keyboard-small .flex {
                margin-bottom: 1px !important;
                gap: 1px !important;
              }
              
              /* LANDSCAPE: Override text size for keyboard keys */
              .landscape-keyboard-small .flex > div.text-xs {
                font-size: 0.9rem !important;
              }
              
              /* Key widths - fixed sizes, never change */
              .landscape-keyboard-small .flex > div[class*="w-"] {
                width: 20px !important;
                min-width: 8% !important;
                max-width: 20px !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="170px"] {
                width: 70px !important;
                min-width: 14.4% !important;
                max-width: 70px !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="175px"] {
                width: 70px !important;
                min-width: 17% !important;
                max-width: 70px !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="130px"] {
                width: 38px !important;
                min-width: 12.6% !important;
                max-width: 38px !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="118px"] {
                width: 36px !important;
                min-width: 13% !important;
                max-width: 36px !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="100px"] {
                width: 11% !important;
                min-width: 11% !important;
                max-width: 11% !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="95px"] {
                width: 30px !important;
                min-width: 8% !important;
                max-width: 30px !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="55px"] {
                width: 20px !important;
                min-width: 6.3% !important;
                max-width: 20px !important;
              }
              
              .landscape-keyboard-small .flex > div[class*="flex-1"] {
                flex: 1 1 auto !important;
                min-width: 60px !important;
                width: auto !important;
                max-width: 42% !important;
              }
              
              /* LANDSCAPE: Media queries - adjust container only, keys stay same */
              @media (min-width: 1400px) {
                .landscape-keyboard-small {
                  transform: scale(1.1) !important;
                  width: 95vw !important;
                  max-width: 95vw !important;
                }
              }
              
              @media (min-width: 1200px) and (max-width: 1399px) {
                .landscape-keyboard-small {
                  transform: scale(1) !important;
                  width: 98vw !important;
                  max-width: 98vw !important;
                }
              }
              
              @media (min-width: 1000px) and (max-width: 1199px) {
                .landscape-keyboard-small {
                  transform: scale(0.95) !important;
                  width: 98vw !important;
                  max-width: 98vw !important;
                }
              }
              
              @media (min-width: 800px) and (max-width: 999px) {
                .landscape-keyboard-small {
                  transform: scale(0.85) !important;
                  width: 98vw !important;
                  max-width: 98vw !important;
                }
              }
              
              @media (min-width: 600px) and (max-width: 799px) {
                .landscape-keyboard-small {
                  transform: scale(0.75) !important;
                  width: 98vw !important;
                  max-width: 98vw !important;
                }
              }
              
              @media (max-width: 599px) {
                .landscape-keyboard-small {
                  transform: scale(0.7) !important;
                  width: 98vw !important;
                  max-width: 98vw !important;
                }
              }
            `}</style>
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex mb-1">
                {row.map((key, keyIndex) => {
                  const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
                  const isCurrentKey = highlightedKeys[currentIndex] === key;
                  return (
                    <div
                      key={keyIndex}
                      className={`h-8 text-xs ${getKeyWidth(key)} mx-0.5 rounded flex items-center justify-center 
                        border transition-all duration-200 ease-out ${
                          isDarkMode ? "border-gray-600 text-white" : "border-gray-400 text-gray-800"
                        }
                        ${
                          isPressed ? (isDarkMode ? "bg-gray-600 text-white border-gray-500 border-2 scale-95" : "bg-gray-400 text-gray-900 border-gray-500 border-2 scale-95") :
                          isCurrentKey ? "bg-blue-500 text-white border-blue-400 border-2" :
                          isDarkMode ? "bg-black text-white border-gray-600" : "bg-gray-300 text-gray-800 border-gray-400"
                        }`}
                    >
                      {key === "Space" ? "Space" : key}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Section - Landscape: Close top right (a little right to avoid overlap), then Stats, then Settings/Theme at bottom */}
      <div className="flex flex-col items-center gap-2 mt-2 mobile-stack mobile-small-text right-section-stats absolute right-4 top-4">
        {/* Close Button - landscape only: small X icon, pushed right */}
        <div className="w-full max-w-[100px] flex justify-end mb-2">
          <button
            onClick={() => window.location.href = '/learning'}
            className="bg-red-600 text-white hover:bg-red-700 p-1.5 rounded-full shadow transition-all duration-200 hover:scale-110 flex items-center justify-center min-w-[36px] min-h-[36px]"
            aria-label="Close and return to learning page"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-[100px] items-center landscape-mobile-stats">
          <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
            <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
            <div className="bg-white text-black text-sm font-bold">{formatClock(timer)}</div>
          </div>
          <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
            <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Correct</div>
            <div className="bg-white text-green-600 text-sm font-bold">{correctCount}</div>
          </div>
          <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
            <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Wrong</div>
            <div className="bg-white text-red-500 text-sm font-bold">{wrongCount}</div>
          </div>
          <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
            <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Total</div>
            <div className="bg-white text-[#290c52] text-sm font-bold">{totalCount}</div>
          </div>
          <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
            <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Backspace</div>
            <div className="bg-white text-blue-500 text-sm font-bold">{backspaceCount}</div>
          </div>
        </div>
        {/* Settings & Theme - bottom right */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full shadow min-w-[40px] min-h-[40px] flex items-center justify-center ${
              isDarkMode ? "bg-white text-black" : "bg-black text-white"
            }`}
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full shadow min-w-[40px] min-h-[40px] flex items-center justify-center ${
              isDarkMode ? "bg-white text-black" : "bg-black text-white"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN KEYBOARD APP COMPONENT ====================
function KeyboardApp() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");
  const language = searchParams.get("language") || "english";
  const subLanguage = searchParams.get("subLanguage") || "";
  const debugKeyboard = searchParams.get("debug") === "1";
  // Timer duration in minutes from URL (e.g. ?duration=10) or default 3
  const durationMinutes = Math.max(1, parseInt(searchParams.get("duration"), 10) || 3);
  const initialTimerSeconds = durationMinutes * 60;
  const firstKeyAlertShownRef = useRef(false);
  // Dedupe: desktop keydown + input both fire; skip input if we just processed keydown
  const lastKeyDownTimeRef = useRef(0);
  const lastKeyDownKeyRef = useRef("");
  const releaseKeyVisualTimeoutRef = useRef(null);
  // Prevent double trigger: beforeinput and input both fire on mobile; we skip input if beforeinput already handled
  const lastHandledByBeforeInputRef = useRef(null);
  const isMobileUserAgentRef = useRef(
    typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent)
  );

  const [hand, setHand] = useState(true);
  const [sound, setSound] = useState(true);
  const [keyboard, setKeyboard] = useState(true);
  const [pressedKey, setPressedKey] = useState("");
  const [mobileInputValue, setMobileInputValue] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timer, setTimer] = useState(initialTimerSeconds);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [isMobile, setIsMobile] = useState(false);
  const [leftHandImage, setLeftHandImage] = useState("/images/left-resting-hand.webp");
  const [rightHandImage, setRightHandImage] = useState("/images/right-resting-hand.webp");
  const inputRef = useRef(null);
  const lastProcessedValueRef = useRef(0);
  const processMobileInputRef = useRef(() => {});
  const handleTypingKeyRef = useRef(() => {});
  const scheduleReleaseKeyVisualRef = useRef(() => {});
  const [loading, setLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [userName, setUserName] = useState("User");
  const [userProfileUrl, setUserProfileUrl] = useState("/lo.jpg");
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [isRowAnimating, setIsRowAnimating] = useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [keyDifficulties, setKeyDifficulties] = useState({}); // Track wrong attempts per key

  // Default home row keys if no lesson
  const defaultKeys = ["A", "S", "D", "F", "Space", "J", "K", "L", ";"];
  const [highlightedKeys, setHighlightedKeys] = useState(defaultKeys);
  const [keyStatus, setKeyStatus] = useState(Array(defaultKeys.length).fill(null));

  // Function to organize keys into rows: preserve spaces from content, no automatic spaces
  const organizeKeysIntoRows = (keys) => {
    const rows = [];
    
    // If no keys, return empty array
    if (keys.length === 0) {
      return [];
    }
    
    // Organize keys into rows, preserving spaces from content
    // Each row can contain up to 8 non-space keys, but spaces are preserved as-is
    let currentRow = [];
    let nonSpaceCount = 0;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      
      if (key === "Space") {
        // Preserve spaces from content - add them to current row
        currentRow.push("Space");
      } else {
        // Count non-space keys
        if (nonSpaceCount >= 8) {
          // Start a new row when we reach 8 non-space keys
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }
          currentRow = [];
          nonSpaceCount = 0;
        }
        currentRow.push(key);
        nonSpaceCount++;
      }
    }
    
    // Add the last row if it has any keys
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    
    return rows.length > 0 ? rows : [[]];
  };

  // Get current row keys based on progress
  const getCurrentRowKeys = () => {
    const rows = organizeKeysIntoRows(highlightedKeys);
    if (rows.length === 0) return [];
    
    return rows[Math.min(currentRowIndex, rows.length - 1)] || rows[0] || [];
  };

  // Update current row index based on progress
  useEffect(() => {
    const rows = organizeKeysIntoRows(highlightedKeys);
    if (rows.length === 0) return;
    
    // Count how many non-space keys have been typed
    let nonSpaceTyped = 0;
    for (let i = 0; i < currentIndex && i < highlightedKeys.length; i++) {
      if (highlightedKeys[i] !== "Space") {
        nonSpaceTyped++;
      }
    }
    
    // Each row has 8 alphabets, so calculate which row we're on
    const rowIndex = Math.floor(nonSpaceTyped / 8);
    const newRowIndex = Math.min(rowIndex, rows.length - 1);
    
    if (newRowIndex !== currentRowIndex) {
      // Trigger animation when row changes
      setIsRowAnimating(true);
      setCurrentRowIndex(newRowIndex);
      
      // Reset animation after it completes
      setTimeout(() => {
        setIsRowAnimating(false);
      }, 600); // Match animation duration
    }
  }, [currentIndex, highlightedKeys, currentRowIndex]);

  // Fetch lesson content and extract keys
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId) {
        // Use default home row keys
        setHighlightedKeys(defaultKeys);
        setKeyStatus(Array(defaultKeys.length).fill(null));
        return;
      }

      setLoading(true);
      try {
        // Fetch learning data
        const res = await fetch('/api/learning?' + new Date().getTime());
        if (res.ok) {
          const data = await res.json();
          // Find the lesson
          let lesson = null;
          for (const section of data.sections || []) {
            const foundLesson = section.lessons?.find(l => l.id === lessonId);
            if (foundLesson) {
              lesson = { ...foundLesson, section: section.name };
              break;
            }
          }

          if (lesson) {
            // Get content based on language - directly from lesson.content object
            const languageKey = language.toLowerCase();
            let contentKey = 'english';
            
            if (languageKey === 'hindi') {
              if (subLanguage.toLowerCase().includes("ramington")) {
                contentKey = 'hindi_ramington';
              } else if (subLanguage.toLowerCase().includes("inscript")) {
                contentKey = 'hindi_inscript';
              } else {
                contentKey = 'hindi_ramington'; // default for hindi
              }
            }
            
            // Get content directly from lesson.content object (database structure)
            const content = lesson.content?.[contentKey] || lesson.content?.english || "";
            setLessonContent(content);

            // Extract unique characters/keys from content (first 100 characters for practice)
            if (content) {
              const contentToUse = content.substring(0, 100).trim();
              // Convert content to array of characters, handling spaces
              const keys = [];
              for (let i = 0; i < contentToUse.length; i++) {
                const char = contentToUse[i];
                if (char === ' ') {
                  // Only add space if it's not at the beginning or end (avoid trailing spaces)
                  if (i > 0 && i < contentToUse.length - 1) {
                    keys.push("Space");
                  }
                } else if (languageKey === 'hindi') {
                  // For Hindi, include all Unicode characters (Hindi, Devanagari, etc.)
                  // Also include English characters and common punctuation
                  if (char.match(/[\u0900-\u097F\u0020-\u007E\u00A0-\u00FF]/)) {
                    // For Hindi keyboard, we need to map to actual keyboard keys
                    // For now, we'll use the character as-is for display
                    // But for keyboard practice, we might need to map to actual keys
                    // For simplicity, let's extract first 20-30 unique characters
                    keys.push(char);
                  }
                } else {
                  // For English, use standard regex
                  if (char.match(/[a-zA-Z0-9;:'",.?!\-=\[\]\\`~@#$%^&*()_+|<>?/{}]/)) {
                    keys.push(char.toUpperCase());
                  }
                }
              }
              // Remove any trailing Space keys
              while (keys.length > 0 && keys[keys.length - 1] === "Space") {
                keys.pop();
              }
              // Limit to reasonable number of keys (20-30 for Hindi, 50 for English)
              const maxKeys = languageKey === 'hindi' ? 30 : 50;
              const keysToUse = keys.length > 0 ? keys.slice(0, maxKeys) : defaultKeys;
              setHighlightedKeys(keysToUse);
              setKeyStatus(Array(keysToUse.length).fill(null));
            } else {
              setHighlightedKeys(defaultKeys);
              setKeyStatus(Array(defaultKeys.length).fill(null));
            }
          } else {
            // Fallback to local data
            const localData = getLearningData();
            for (const section of localData.sections || []) {
              const foundLesson = section.lessons?.find(l => l.id === lessonId);
              if (foundLesson) {
                const languageKey = language.toLowerCase();
                let contentKey = 'english';
                
                if (languageKey === 'hindi') {
                  if (subLanguage.toLowerCase().includes("ramington")) {
                    contentKey = 'hindi_ramington';
                  } else if (subLanguage.toLowerCase().includes("inscript")) {
                    contentKey = 'hindi_inscript';
                  } else {
                    contentKey = 'hindi_ramington';
                  }
                }
                
                const content = foundLesson.content?.[contentKey] || foundLesson.content?.english || "";
                if (content) {
                  const contentToUse = content.substring(0, 100).trim();
                  const keys = [];
                  for (let i = 0; i < contentToUse.length; i++) {
                    const char = contentToUse[i];
                    if (char === ' ') {
                      // Only add space if it's not at the beginning or end (avoid trailing spaces)
                      if (i > 0 && i < contentToUse.length - 1) {
                        keys.push("Space");
                      }
                    } else if (languageKey === 'hindi') {
                      if (char.match(/[\u0900-\u097F\u0020-\u007E\u00A0-\u00FF]/)) {
                        keys.push(char);
                      }
                    } else {
                      if (char.match(/[a-zA-Z0-9;:'",.?!\-=\[\]\\`~@#$%^&*()_+|<>?/{}]/)) {
                        keys.push(char.toUpperCase());
                      }
                    }
                  }
                  // Remove any trailing Space keys
                  while (keys.length > 0 && keys[keys.length - 1] === "Space") {
                    keys.pop();
                  }
                  const maxKeys = languageKey === 'hindi' ? 30 : 50;
                  const keysToUse = keys.length > 0 ? keys.slice(0, maxKeys) : defaultKeys;
                  setHighlightedKeys(keysToUse);
                  setKeyStatus(Array(keysToUse.length).fill(null));
                  setLessonContent(content);
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch lesson data:', error);
        // Use default keys on error
        setHighlightedKeys(defaultKeys);
        setKeyStatus(Array(defaultKeys.length).fill(null));
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId, language, subLanguage]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserName(data.user.name || "User");
            setUserProfileUrl(data.user.profileUrl || "/lo.jpg");
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Keep default values
      }
    };
    fetchUserProfile();
  }, []);

  // Calculate stats - correctCount should be the number of correctly typed keys
  const correctCount = isCompleted ? highlightedKeys.length : currentIndex;
  const wrongCount = keyStatus.filter(status => status === "wrong").length;
  const totalCount = highlightedKeys.length;
  const totalAttempts = correctCount + wrongCount;

  const wpm = elapsedTime > 0 ? Math.round((correctCount / elapsedTime) * 60) : 0;

  const fingerMap = {
    // Left hand keys
    "`": "pinky",
    "1": "pinky",
    "2": "pinky",
    "3": "pinky",
    "4": "pinky",
    "5": "pinky",
    "Q": "pinky",
    "W": "ring",
    "E": "middle",
    "R": "index-left",
    "T": "index-left",
    "A": "pinky",
    "S": "ring",
    "D": "middle",
    "F": "index-left",
    "G": "index-left",
    "Z": "pinky",
    "X": "ring",
    "C": "middle",
    "V": "index-left",
    "B": "index-left",
    "Shift": "pinky",
    "Tab": "pinky",
    "Caps": "pinky",
    "Ctrl": "pinky",
    "Alt": "thumb",
    "Win": "thumb",
    "Menu": "pinky",
    
    // Right hand keys
    "Y": "index-right",
    "U": "index-right",
    "I": "middle-right",
    "O": "ring-right",
    "P": "pinky-right",
    "H": "index-right",
    "J": "index-right",
    "K": "middle-right",
    "L": "ring-right",
    ";": "pinky-right",
    "'": "pinky-right",
    "N": "index-right",
    "M": "index-right",
    ",": "middle-right",
    ".": "ring-right",
    "/": "pinky-right",
    "6": "index-right",
    "7": "index-right",
    "8": "middle-right",
    "9": "ring-right",
    "0": "pinky-right",
    "-": "pinky-right",
    "=": "pinky-right",
    "[": "pinky-right",
    "]": "pinky-right",
    "\\": "pinky-right",
    "Enter": "pinky-right",
    "Backspace": "pinky-right",
    "Menu": "pinky-right",
    
    // Space key uses both thumbs
    "Space": "thumb"
  };

  // Mapping between keys and their corresponding hand images
  const keyToHandImage = {
    // Left hand keys
    "`": { left: "/images/left-key-~.webp", right: "/images/right-resting-hand.webp" },
    "1": { left: "/images/left-key-1.webp", right: "/images/right-resting-hand.webp" },
    "2": { left: "/images/left-key-2.webp", right: "/images/right-resting-hand.webp" },
    "3": { left: "/images/left-key-3.webp", right: "/images/right-resting-hand.webp" },
    "4": { left: "/images/left-key-4.webp", right: "/images/right-resting-hand.webp" },
    "5": { left: "/images/left-key-5.webp", right: "/images/right-resting-hand.webp" },
    "Q": { left: "/images/left-key-q.webp", right: "/images/right-resting-hand.webp" },
    "W": { left: "/images/left-key-w.webp", right: "/images/right-resting-hand.webp" },
    "E": { left: "/images/left-key-e.webp", right: "/images/right-resting-hand.webp" },
    "R": { left: "/images/left-key-r.webp", right: "/images/right-resting-hand.webp" },
    "T": { left: "/images/left-key-t.webp", right: "/images/right-resting-hand.webp" },
    "A": { left: "/images/left-key-a.webp", right: "/images/right-resting-hand.webp" },
    "S": { left: "/images/left-key-s.webp", right: "/images/right-resting-hand.webp" },
    "D": { left: "/images/left-key-d.webp", right: "/images/right-resting-hand.webp" },
    "F": { left: "/images/left-key-f.webp", right: "/images/right-resting-hand.webp" },
    "G": { left: "/images/left-key-g.webp", right: "/images/right-resting-hand.webp" },
    "Z": { left: "/images/left-key-z.webp", right: "/images/right-resting-hand.webp" },
    "X": { left: "/images/left-key-x.webp", right: "/images/right-resting-hand.webp" },
    "C": { left: "/images/left-key-c.webp", right: "/images/right-resting-hand.webp" },
    "V": { left: "/images/left-key-v.webp", right: "/images/right-resting-hand.webp" },
    "B": { left: "/images/left-key-b.webp", right: "/images/right-resting-hand.webp" },
    "Shift": { left: "/images/left-key-shift.webp", right: "/images/right-resting-hand.webp" },
    "Tab": { left: "/images/left-key-tab.webp", right: "/images/right-resting-hand.webp" },
    "Caps": { left: "/images/left-key-caps.webp", right: "/images/right-resting-hand.webp" },
    "Ctrl": { left: "/images/left-key-ctrl.webp", right: "/images/right-resting-hand.webp" },
    "Alt": { left: "/images/left-key-alt.webp", right: "/images/right-resting-hand.webp" },
    "Win": { left: "/images/left-key-win.webp", right: "/images/right-resting-hand.webp" },
    
    // Right hand keys
    "Y": { left: "/images/left-resting-hand.webp", right: "/images/right-key-y.webp" },
    "U": { left: "/images/left-resting-hand.webp", right: "/images/right-key-u.webp" },
    "I": { left: "/images/left-resting-hand.webp", right: "/images/right-key-i.webp" },
    "O": { left: "/images/left-resting-hand.webp", right: "/images/right-key-o.webp" },
    "P": { left: "/images/left-resting-hand.webp", right: "/images/right-key-p.webp" },
    "H": { left: "/images/left-resting-hand.webp", right: "/images/right-key-h.webp" },
    "J": { left: "/images/left-resting-hand.webp", right: "/images/right-key-j.webp" },
    "K": { left: "/images/left-resting-hand.webp", right: "/images/right-key-k.webp" },
    "L": { left: "/images/left-resting-hand.webp", right: "/images/right-key-l.webp" },
    "N": { left: "/images/left-resting-hand.webp", right: "/images/right-key-n.webp" },
    "M": { left: "/images/left-resting-hand.webp", right: "/images/right-key-m.webp" },
    ";": { left: "/images/left-resting-hand.webp", right: "/images/right-key-;.webp" },
    "'": { left: "/images/left-resting-hand.webp", right: "/images/right-key-'.webp" },
    ",": { left: "/images/left-resting-hand.webp", right: "/images/right-key-,.webp" },
    ".": { left: "/images/left-resting-hand.webp", right: "/images/right-key-..webp" },
    "/": { left: "/images/left-resting-hand.webp", right: "/images/right-key-questionMark.webp" },
    "6": { left: "/images/left-resting-hand.webp", right: "/images/right-key-6.webp" },
    "7": { left: "/images/left-resting-hand.webp", right: "/images/right-key-7.webp" },
    "8": { left: "/images/left-resting-hand.webp", right: "/images/right-key-8.webp" },
    "9": { left: "/images/left-resting-hand.webp", right: "/images/right-key-9.webp" },
    "0": { left: "/images/left-resting-hand.webp", right: "/images/right-key-0.webp" },
    "-": { left: "/images/left-resting-hand.webp", right: "/images/right-key-dash.webp" },
    "=": { left: "/images/left-resting-hand.webp", right: "/images/right-key-plus.webp" },
    "[": { left: "/images/left-resting-hand.webp", right: "/images/right-key-{.webp" },
    "]": { left: "/images/left-resting-hand.webp", right: "/images/right-key-}.webp" },
    "\\": { left: "/images/left-resting-hand.webp", right: "/images/right-key-questionMark.webp" },
    "Backspace": { left: "/images/left-resting-hand.webp", right: "/images/right-key-backspace.webp" },
    "Enter": { left: "/images/left-resting-hand.webp", right: "/images/right-key-enter.webp" },
    "Menu": { left: "/images/left-resting-hand.webp", right: "/images/right-key-menu.webp" },
    " ": { left: "/images/left-key-space.webp", right: "/images/right-key- .webp" }, // Space key
    "Space": { left: "/images/left-key-space.webp", right: "/images/right-key- .webp" }, // Space key
    
    // Default hand positions
    "resting": { left: "/images/left-resting-hand.webp", right: "/images/right-resting-hand.webp" }
  };

  const keys = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
    ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
    ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
    ["Ctrl", "Win", "Alt", "Space", "Alt", "Win", "Menu", "Ctrl"]
  ];

  useEffect(() => {
    const checkIfMobile = () => {
      const isMobile = window.innerWidth < 933;
      setIsMobile(isMobile);
      if (isMobile && inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    const checkOrientation = () => {
      // Multiple methods to detect landscape for all devices and WebViews
      let isLandscapeMode = false;
      
      if (window.matchMedia) {
        const q = window.matchMedia('(orientation: landscape)');
        if (q.matches) isLandscapeMode = true;
      }
      if (!isLandscapeMode && typeof screen !== 'undefined' && screen.orientation) {
        const angle = screen.orientation.angle;
        if (angle === 90 || angle === -90 || angle === 270) isLandscapeMode = true;
      }
      if (!isLandscapeMode && window.innerWidth > window.innerHeight) {
        isLandscapeMode = true;
      }
      
      setIsLandscape(isLandscapeMode);
      const isMobilePortrait = window.innerWidth < 768 && !isLandscapeMode;
      setShowRotatePrompt(isMobilePortrait);
    };
    
    checkIfMobile();
    checkOrientation();
    
    // Also check after delays to ensure orientation is detected on all devices
    const timeoutId1 = setTimeout(() => {
      checkOrientation();
    }, 100);
    
    const timeoutId2 = setTimeout(() => {
      checkOrientation();
    }, 300);
    
    const timeoutId3 = setTimeout(() => {
      checkOrientation();
    }, 500);
    
    const handleResize = () => {
      checkIfMobile();
      checkOrientation();
    };
    
    const scheduleOrientationCheck = () => {
      [0, 100, 300, 500, 800].forEach((delay) => {
        setTimeout(checkOrientation, delay);
      });
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', scheduleOrientationCheck);
    if (typeof screen !== 'undefined' && screen.orientation) {
      screen.orientation.addEventListener('change', scheduleOrientationCheck);
    }
    if (window.matchMedia) {
      const q = window.matchMedia('(orientation: landscape)');
      q.addEventListener('change', scheduleOrientationCheck);
    }
    
    const intervalId = setInterval(checkOrientation, 1500);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', scheduleOrientationCheck);
      if (typeof screen !== 'undefined' && screen.orientation) {
        screen.orientation.removeEventListener('change', scheduleOrientationCheck);
      }
      if (window.matchMedia) {
        const q = window.matchMedia('(orientation: landscape)');
        q.removeEventListener('change', scheduleOrientationCheck);
      }
    };
  }, []);

  // Auto-focus hidden input on page load (desktop + mobile) so soft keyboard can open on tap
  useEffect(() => {
    const t = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        debugLog("Input auto-focused on load");
        if (debugKeyboard) {
          try { window.alert("Keyboard: input auto-focused on load. Tap anywhere to refocus."); } catch (e) {}
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, []);

  // Prevent keyboard dismiss: refocus hidden input on blur (so mobile soft keyboard stays open)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handleBlur = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          debugLog("Input refocused after blur (prevent keyboard dismiss)");
          if (debugKeyboard) {
            try { window.alert("Keyboard: input refocused to prevent dismiss."); } catch (e) {}
          }
        }
      }, 100);
    };
    el.addEventListener("blur", handleBlur);
    return () => el.removeEventListener("blur", handleBlur);
  }, []);

  const getKeyWidth = (key) => {
    switch (key) {
      case "Backspace": return "w-[170px]";
      case "Tab": return "w-[130px]";
      case "Caps": return "w-[118px]";
      case "Enter": return "w-[170px]";
      case "Shift": return "w-[175px]";
      case "Ctrl":
      case "Alt":
      case "Win":
      case "Menu": return "w-[70px]";
      case "\\": return "w-[95px]";
      case "Space": return "flex-1";
      default: return "w-[55px]";
    }
  };

  const normalizeKey = (key) => {
    if (key === " ") return "Space";
    if (key === "Control") return "Ctrl";
    if (key === "AltGraph") return "Alt";
    if (key === "OS" || key === "Meta") return "Win";
    if (key === "ContextMenu") return "Menu";
    if (key.length === 1) return key.toUpperCase();
    return key;
  };

  // Function to update hand images based on the pressed key
  const updateHandImages = useCallback((key) => {
    // Get the finger mapping for this key
    const finger = fingerMap[key];
    
    if (!finger) {
      // If no finger mapping, use resting position
      setLeftHandImage(keyToHandImage["resting"].left);
      setRightHandImage(keyToHandImage["resting"].right);
      return;
    }

    // Determine which hand the finger belongs to
    const isLeftHand = ['pinky', 'ring', 'middle', 'index-left'].includes(finger);
    const isRightHand = ['index-right', 'middle-right', 'ring-right', 'pinky-right'].includes(finger);
    const isThumb = finger === 'thumb';

    try {
      if (isThumb) {
        // For thumb (space key), show both hands with thumb position
        if (key === "Space" || key === " ") {
          // Special handling for space key - use existing images for both thumbs
          setLeftHandImage("/images/left-key-ctrl.webp");
          setRightHandImage("/images/right-key- .webp");
        } else {
          const handImages = keyToHandImage[key] || keyToHandImage["resting"];
          setLeftHandImage(handImages.left);
          setRightHandImage(handImages.right);
        }
      } else if (isLeftHand) {
        // Show specific finger position for left hand, keep right hand resting
        const handImages = keyToHandImage[key] || keyToHandImage["resting"];
        setLeftHandImage(handImages.left);
        setRightHandImage(keyToHandImage["resting"].right);
      } else if (isRightHand) {
        // Show specific finger position for right hand, keep left hand resting
        const handImages = keyToHandImage[key] || keyToHandImage["resting"];
        setLeftHandImage(keyToHandImage["resting"].left);
        setRightHandImage(handImages.right);
      } else {
        // Fallback to resting position
        setLeftHandImage(keyToHandImage["resting"].left);
        setRightHandImage(keyToHandImage["resting"].right);
      }
    } catch (error) {
      console.error("Error updating hand images:", error);
      // Fallback to resting position on error
      setLeftHandImage(keyToHandImage["resting"].left);
      setRightHandImage(keyToHandImage["resting"].right);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // When countdown timer reaches 0, show result (completion)
  useEffect(() => {
    if (timer === 0 && !isCompleted) {
      setIsCompleted(true);
      setEndTime(Date.now());
    }
  }, [timer, isCompleted]);

  // Shared logic for both desktop (keydown) and mobile (input onChange)
  const processKeyForPractice = useCallback((normalizedKey, isBackspace = false) => {
    if (currentIndex >= highlightedKeys.length) return;
    if (isBackspace) {
      setBackspaceCount(prev => prev + 1);
      return;
    }
    const expectedKey = highlightedKeys[currentIndex];
    const isCorrect = normalizedKey === expectedKey;
    const newKeyStatus = [...keyStatus];
    newKeyStatus[currentIndex] = isCorrect ? 'correct' : 'wrong';
    setKeyStatus(newKeyStatus);
    if (!isCorrect && expectedKey) {
      setKeyDifficulties(prev => ({
        ...prev,
        [expectedKey]: (prev[expectedKey] || 0) + 1
      }));
    }
    if (!startTime && currentIndex === 0) {
      setStartTime(Date.now());
    }
    if (isCorrect) {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= highlightedKeys.length) {
          setIsCompleted(true);
          setEndTime(Date.now());
        }
        return nextIndex;
      });
    }
    const totalAttempts = currentIndex + (isCorrect ? 1 : 0) + wrongCount;
    const newAccuracy = Math.round(((currentIndex + (isCorrect ? 1 : 0)) / totalAttempts) * 100);
    setAccuracy(newAccuracy);
    if (sound) {
      const audio = new Audio(isCorrect ? '/correct.mp3' : '/wrong.mp3');
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [currentIndex, keyStatus, wrongCount, sound, highlightedKeys, startTime]);

  // Single unified handler: hand animation, virtual keyboard highlight, typing correctness, stats.
  // Desktop: keydown. Mobile: beforeinput/input. On mobile, flushSync so animation commits immediately.
  const handleTypingKey = useCallback((key, source) => {
    if (releaseKeyVisualTimeoutRef.current) {
      clearTimeout(releaseKeyVisualTimeoutRef.current);
      releaseKeyVisualTimeoutRef.current = null;
    }
    const normalizedKey = normalizeKey(key);
    console.log("[Keyboard]", "source=" + source, "character=" + (key === " " ? "<space>" : key), "animation triggered");
    debugLog("handleTypingKey", { source, character: key === " " ? " " : key, normalizedKey });

    const applyVisual = () => {
      updateHandImages(normalizedKey);
      setPressedKey(normalizedKey);
    };
    if (source === "mobile") {
      flushSync(applyVisual);
    } else {
      applyVisual();
    }

    if (currentIndex >= highlightedKeys.length) return;
    if (key === "Backspace" || normalizedKey === "Backspace") {
      processKeyForPractice(normalizedKey, true);
      return;
    }
    processKeyForPractice(normalizedKey);
  }, [currentIndex, highlightedKeys, updateHandImages, processKeyForPractice]);

  const releaseKeyVisual = useCallback(() => {
    if (releaseKeyVisualTimeoutRef.current) {
      clearTimeout(releaseKeyVisualTimeoutRef.current);
      releaseKeyVisualTimeoutRef.current = null;
    }
    setPressedKey("");
    setLeftHandImage(keyToHandImage["resting"].left);
    setRightHandImage(keyToHandImage["resting"].right);
  }, []);

  const onDesktopKeyDown = useCallback((e) => {
    lastKeyDownTimeRef.current = Date.now();
    lastKeyDownKeyRef.current = e.key;
    if (currentIndex < highlightedKeys.length && (e.key === " " || highlightedKeys.includes(normalizeKey(e.key)))) {
      e.preventDefault();
    }
    handleTypingKey(e.key, "desktop");
  }, [handleTypingKey, currentIndex, highlightedKeys]);

  const scheduleReleaseKeyVisual = useCallback(() => {
    if (releaseKeyVisualTimeoutRef.current) clearTimeout(releaseKeyVisualTimeoutRef.current);
    releaseKeyVisualTimeoutRef.current = setTimeout(() => {
        releaseKeyVisualTimeoutRef.current = null;
        setPressedKey("");
        setLeftHandImage(keyToHandImage["resting"].left);
        setRightHandImage(keyToHandImage["resting"].right);
      }, 420);
  }, []);

  const onDesktopKeyUp = useCallback(() => {
    scheduleReleaseKeyVisual();
  }, [scheduleReleaseKeyVisual]);

  // Desktop only: do NOT attach keydown on mobile user-agent to prevent double trigger (Android can fire both keydown and input)
  useEffect(() => {
    if (isMobileUserAgentRef.current) return;
    window.addEventListener("keydown", onDesktopKeyDown);
    window.addEventListener("keyup", onDesktopKeyUp);
    return () => {
      window.removeEventListener("keydown", onDesktopKeyDown);
      window.removeEventListener("keyup", onDesktopKeyUp);
    };
  }, [onDesktopKeyDown, onDesktopKeyUp]);

  // Mobile: process one key from value (last char or Backspace). Dedupe with beforeinput when it already handled.
  const processMobileInput = useCallback((value, fromBeforeInput = false) => {
    const input = inputRef.current;
    if (!input) return;
    const prevLen = lastProcessedValueRef.current;
    const len = (value || "").length;

    if (len > prevLen) {
      const lastChar = value[value.length - 1];
      if (!fromBeforeInput && lastHandledByBeforeInputRef.current === lastChar) {
        lastHandledByBeforeInputRef.current = null;
        lastProcessedValueRef.current = 0;
        setMobileInputValue("");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      console.log("[Keyboard]", "source=mobile", "character=" + (lastChar === " " ? "<space>" : lastChar), "animation triggered");
      handleTypingKey(lastChar, "mobile");
      scheduleReleaseKeyVisual();
    } else if (len < prevLen) {
      console.log("[Keyboard]", "source=mobile", "character=Backspace", "animation triggered");
      handleTypingKey("Backspace", "mobile");
      scheduleReleaseKeyVisual();
    }

    lastProcessedValueRef.current = 0;
    lastHandledByBeforeInputRef.current = null;
    setMobileInputValue("");
    if (inputRef.current) inputRef.current.value = "";
  }, [handleTypingKey, scheduleReleaseKeyVisual]);

  // React handlers: onInput and onBeforeInput (both used on mobile)
  const handleBeforeInput = useCallback((e) => {
    const lastChar = e.data ?? (e.target?.value && e.target.value.slice(-1));
    if (lastChar && lastChar.length === 1) {
      lastHandledByBeforeInputRef.current = lastChar;
      handleTypingKey(lastChar, "mobile");
      scheduleReleaseKeyVisual();
    }
  }, [handleTypingKey, scheduleReleaseKeyVisual]);

  const handleMobileInputChange = useCallback((e) => {
    const v = e.target?.value ?? "";
    processMobileInput(v, false);
  }, [processMobileInput]);

  // Refs for native listeners (mobile soft keyboard may not fire React synthetic events)
  handleTypingKeyRef.current = handleTypingKey;
  scheduleReleaseKeyVisualRef.current = scheduleReleaseKeyVisual;
  processMobileInputRef.current = processMobileInput;

  // Native input, change, and beforeinput so mobile always gets events
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onInput = () => {
      const v = el.value ?? "";
      processMobileInputRef.current(v, false);
    };
    const onBeforeInput = (e) => {
      const data = e.data;
      if (data && data.length === 1) {
        lastHandledByBeforeInputRef.current = data;
        handleTypingKeyRef.current(data, "mobile");
        scheduleReleaseKeyVisualRef.current();
      }
    };
    el.addEventListener("beforeinput", onBeforeInput);
    el.addEventListener("input", onInput);
    el.addEventListener("change", onInput);
    return () => {
      el.removeEventListener("beforeinput", onBeforeInput);
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onInput);
    };
  }, []);

  // WebView fallback: some WebViews don't fire "input" for native keyboard – poll value when input is focused
  useEffect(() => {
    if (!isMobile) return;
    const el = inputRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      const input = inputRef.current;
      if (!input || document.activeElement !== input) return;
      const v = input.value ?? "";
      if (v.length === 0) return;
      debugLog("poll fallback processed", v);
      processMobileInputRef.current(v);
      lastProcessedValueRef.current = 0;
      input.value = "";
    }, 100);
    return () => clearInterval(interval);
  }, [isMobile]);

  const resetStats = () => {
    setCurrentIndex(0);
    setCurrentRowIndex(0);
    setIsRowAnimating(false);
    setAccuracy(100);
    setKeyStatus(Array(highlightedKeys.length).fill(null));
    setTimer(initialTimerSeconds);
    setElapsedTime(0);
    setBackspaceCount(0);
    setPressedKey("");
    setIsCompleted(false);
    setStartTime(null);
    setEndTime(null);
    setKeyDifficulties({});
    setLeftHandImage(keyToHandImage["resting"].left);
    setRightHandImage(keyToHandImage["resting"].right);
    setMobileInputValue("");
    lastProcessedValueRef.current = 0;
    if (isMobile && inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  // Calculate final stats for completion modal
  // Use actual time taken from start to end, or fallback to elapsedTime
  const timeTaken = startTime && endTime ? (endTime - startTime) / 1000 : (elapsedTime > 0 ? elapsedTime : 1);
  
  // When completed, correctCount should equal totalCount
  const finalCorrectCount = isCompleted ? totalCount : correctCount;
  
  // WPM calculation: (correct keys / time in minutes)
  // For keyboard practice, we calculate based on keys typed correctly
  const finalWpm = timeTaken > 0 ? Math.round((finalCorrectCount / timeTaken) * 60) : 0;
  
  // Accuracy: percentage of correct keys out of total keys
  const finalAccuracy = totalCount > 0 ? Math.round((finalCorrectCount / totalCount) * 100) : 100;
  
  // Display correct count (should match totalCount when completed)
  const displayCorrectCount = isCompleted ? totalCount : correctCount;

  // Check for completion - separate effect to ensure it triggers
  useEffect(() => {
    if (currentIndex >= highlightedKeys.length && highlightedKeys.length > 0 && !isCompleted) {
      if (!startTime) {
        setStartTime(Date.now());
      }
      setIsCompleted(true);
      setEndTime(Date.now());
    }
  }, [currentIndex, highlightedKeys.length, isCompleted, startTime]);

  // Save result data to localStorage when completed and redirect
  useEffect(() => {
    const saveAndRedirect = async () => {
      if (isCompleted && startTime && endTime) {
        const timeTaken = (endTime - startTime) / 1000;
        const finalCorrectCount = totalCount;
        const finalWpm = timeTaken > 0 ? Math.round((finalCorrectCount / timeTaken) * 60) : 0;
        const finalAccuracy = totalCount > 0 ? Math.round((finalCorrectCount / totalCount) * 100) : 100;
        const netSpeed = Math.round(finalWpm * (finalAccuracy / 100));
        
        // Get ALL unique keys that were practiced with their difficulty levels
        // Count frequency of each key (how many times it appeared in the sequence)
        const keyFrequency = {};
        highlightedKeys.forEach(key => {
          const keyName = key === "Space" ? "Space" : key;
          keyFrequency[keyName] = (keyFrequency[keyName] || 0) + 1;
        });
        
        // Get all unique keys and their difficulties
        // keyDifficulties already contains the total error count for each key
        const uniqueKeys = [...new Set(highlightedKeys)];
        
        // Create data with all unique keys, showing frequency and total difficulty
        let difficultKeysData = uniqueKeys.map(key => {
          const keyName = key === "Space" ? "Space" : key;
          const difficulty = keyDifficulties[key] || 0; // Total errors for this key
          const frequency = keyFrequency[keyName] || 1; // How many times this key appeared
          
          return {
            key: keyName,
            difficulty: difficulty,
            frequency: frequency, // How many times this key appeared in practice
            // Add level classification for display
            level: difficulty === 0 ? "OK" : 
                   difficulty >= 3 ? "Problematic" : 
                   difficulty >= 1 ? "Difficult" : "OK"
          };
        }).sort((a, b) => {
          // Sort by difficulty (highest first), then by frequency, then alphabetically
          if (b.difficulty !== a.difficulty) {
            return b.difficulty - a.difficulty;
          }
          if (b.frequency !== a.frequency) {
            return b.frequency - a.frequency;
          }
          return a.key.localeCompare(b.key);
        });
        
        // Ensure difficultKeysData is always an array
        if (!Array.isArray(difficultKeysData)) {
          console.error('difficultKeysData is not an array after mapping:', difficultKeysData);
          difficultKeysData = [];
        }
        
        // Debug: Log the data being saved
        console.log('=== SAVING DIFFICULT KEYS DATA ===');
        console.log('Highlighted keys (all):', highlightedKeys);
        console.log('Unique keys:', uniqueKeys);
        console.log('Key frequencies:', keyFrequency);
        console.log('Key difficulties:', keyDifficulties);
        console.log('Difficult keys data to save:', difficultKeysData);
        console.log('Total keys in data:', difficultKeysData.length);
        console.log('Keys in data:', difficultKeysData.map(k => k.key));
        
        // Get user name and exercise info
        const userDataStr = localStorage.getItem('examUserData');
        const userData = userDataStr ? JSON.parse(userDataStr) : {};
        
        // Get exercise/lesson name
        let exerciseName = "";
        if (lessonId) {
          try {
            const res = await fetch('/api/learning?' + new Date().getTime());
            if (res.ok) {
              const data = await res.json();
              for (const section of data.sections || []) {
                const foundLesson = section.lessons?.find(l => l.id === lessonId);
                if (foundLesson) {
                  exerciseName = foundLesson.name || foundLesson.title || "";
                  break;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching lesson name:', error);
          }
        }
        
        // Get current date and time
        const now = new Date();
        const resultDate = now.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
        const resultTime = now.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        // Ensure difficultKeysData is an array before saving
        const keysToSave = Array.isArray(difficultKeysData) ? difficultKeysData : [];
        
        // Save to localStorage for learning result page
        const resultData = {
          timeUsed: Math.round(timeTaken),
          grossSpeed: finalWpm,
          accuracy: finalAccuracy,
          netSpeed: netSpeed,
          difficultKeys: keysToSave, // Always ensure it's an array
          userName: userName || userData.name || "User",
          exerciseName: exerciseName,
          language: language === "hindi" ? "Hindi" : "English",
          subLanguage: subLanguage || "",
          resultDate: resultDate,
          resultTime: resultTime,
          timeDuration: Math.round(timeTaken) // Save in seconds
        };
        
        // Verify the data structure before saving
        console.log('Final resultData to save:', resultData);
        console.log('difficultKeys in resultData:', resultData.difficultKeys);
        console.log('difficultKeys is array:', Array.isArray(resultData.difficultKeys));
        
        // Save to localStorage
        const dataToSave = JSON.stringify(resultData);
        localStorage.setItem('learningResult', dataToSave);
        
        // Verify data was saved
        const savedData = localStorage.getItem('learningResult');
        console.log('Data saved to localStorage:', savedData);
        console.log('Verifying saved data:', JSON.parse(savedData));
        
        // Auto-redirect to learning result page immediately
        window.location.href = '/result/learning-re';
      }
    };
    
    saveAndRedirect();
  }, [isCompleted, startTime, endTime, totalCount, highlightedKeys, keyDifficulties, lessonId, language, subLanguage, userName]);

  // Update keyStatus when highlightedKeys changes
  useEffect(() => {
    setKeyStatus(Array(highlightedKeys.length).fill(null));
    setCurrentIndex(0);
    setCurrentRowIndex(0);
    setIsRowAnimating(false);
  }, [highlightedKeys]);

  const formatClock = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Determine which view to render
  const renderView = () => {
    // Show landscape mobile view when mobile device is in landscape orientation
    if (isMobile && isLandscape) {
      return (
        <LandscapeMobileView
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          highlightedKeys={highlightedKeys}
          currentIndex={currentIndex}
          currentRowIndex={currentRowIndex}
          keyStatus={keyStatus}
          pressedKey={pressedKey}
          keyboard={keyboard}
          hand={hand}
          sound={sound}
          setHand={setHand}
          setSound={setSound}
          setKeyboard={setKeyboard}
          resetStats={resetStats}
          leftHandImage={leftHandImage}
          rightHandImage={rightHandImage}
          keys={keys}
          getKeyWidth={getKeyWidth}
          getCurrentRowKeys={getCurrentRowKeys}
          organizeKeysIntoRows={organizeKeysIntoRows}
          correctCount={correctCount}
          wrongCount={wrongCount}
          totalCount={totalCount}
          backspaceCount={backspaceCount}
          elapsedTime={elapsedTime}
          formatClock={formatClock}
          timer={timer}
        />
      );
    } else if (isMobile && !isLandscape) {
      return (
        <PortraitMobileView
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          highlightedKeys={highlightedKeys}
          currentIndex={currentIndex}
          currentRowIndex={currentRowIndex}
          isRowAnimating={isRowAnimating}
          keyStatus={keyStatus}
          pressedKey={pressedKey}
          keyboard={keyboard}
          hand={hand}
          sound={sound}
          setHand={setHand}
          setSound={setSound}
          setKeyboard={setKeyboard}
          resetStats={resetStats}
          keys={keys}
          getKeyWidth={getKeyWidth}
          getCurrentRowKeys={getCurrentRowKeys}
          organizeKeysIntoRows={organizeKeysIntoRows}
          correctCount={correctCount}
          wrongCount={wrongCount}
          timer={timer}
          elapsedTime={elapsedTime}
          totalAttempts={totalAttempts}
          formatClock={formatClock}
          leftHandImage={leftHandImage}
          rightHandImage={rightHandImage}
          onRequestFocusInput={() => {
            if (inputRef.current) {
              inputRef.current.value = "";
              lastProcessedValueRef.current = 0;
              inputRef.current.focus();
            }
          }}
        />
      );
    } else {
      return (
        <DesktopView
          isDarkMode={isDarkMode}
          highlightedKeys={highlightedKeys}
          currentIndex={currentIndex}
          currentRowIndex={currentRowIndex}
          isRowAnimating={isRowAnimating}
          keyStatus={keyStatus}
          pressedKey={pressedKey}
          hand={hand}
          sound={sound}
          keyboard={keyboard}
          leftHandImage={leftHandImage}
          rightHandImage={rightHandImage}
          keys={keys}
          getKeyWidth={getKeyWidth}
          getCurrentRowKeys={getCurrentRowKeys}
          organizeKeysIntoRows={organizeKeysIntoRows}
          formatClock={formatClock}
          correctCount={correctCount}
          wrongCount={wrongCount}
          totalCount={totalCount}
          backspaceCount={backspaceCount}
          elapsedTime={elapsedTime}
          wpm={wpm}
          userName={userName}
          userProfileUrl={userProfileUrl}
          resetStats={resetStats}
          setHand={setHand}
          setSound={setSound}
          setKeyboard={setKeyboard}
          timer={timer}
          totalAttempts={totalAttempts}
        />
      );
    }
  };

  // Tap anywhere (except buttons/links) to refocus hidden input (opens soft keyboard on mobile)
  const handleContainerTap = useCallback((e) => {
    const t = e?.target;
    if (t && /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (inputRef.current) {
      inputRef.current.focus();
      debugLog("Input focused (tap anywhere)");
      if (debugKeyboard) {
        try { window.alert("Keyboard: input focused. You can type now."); } catch (err) {}
      }
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-y-auto ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
      style={{
        minHeight: '100dvh', // Dynamic viewport height for mobile
      }}
      onClick={handleContainerTap}
      role="application"
      aria-label="Keyboard practice — tap to focus and type"
    >
      {/* Hidden input: autoFocus, opacity 0, absolute, ref. Prevent blur (refocus on blur). Clear after read. Mobile: onBeforeInput + onInput -> handleTypingKey(key, "mobile"). */}
      <input
        type="text"
        ref={inputRef}
        data-typing-input
        defaultValue=""
        onBeforeInput={handleBeforeInput}
        onInput={handleMobileInputChange}
        onChange={handleMobileInputChange}
        onFocus={(e) => {
          const el = e.target;
          lastProcessedValueRef.current = 0;
          el.value = "";
          el.setSelectionRange(0, 0);
          debugLog("Input focused");
          if (debugKeyboard) {
            try { window.alert("Keyboard: input focused. Tap anywhere to refocus, then type."); } catch (err) {}
          }
        }}
        className="keyboard-page-type-input absolute left-0 top-[30%] w-11 h-11 border-0 p-0 m-0 outline-none text-base min-w-[44px] min-h-[44px]"
        style={{ opacity: 0, zIndex: 1, fontSize: 16 }}
        placeholder="Type here"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        inputMode="text"
        enterKeyHint="next"
        aria-label="Type the keys"
        autoFocus
      />

      <div
        className={`w-full min-h-full ${
          isDarkMode ? "text-white" : "text-black"
        }`}
        style={{
          minHeight: '100dvh',
        }}
      >

      {/* Global Styles */}
      <style jsx>{`
        /* ============================================
           GLOBAL ANIMATIONS - Used in ALL views
           ============================================ */
        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideInRightKey {
          0% {
            transform: translateX(100px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes rotateArrows {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        /* Animation classes - Used in DESKTOP view for row transitions */
        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }
        
        /* Animation class - Used in DESKTOP view for key animations */
        .animate-slide-in-right-key {
          animation: slideInRightKey 0.4s ease-out forwards;
        }
        
        /* Animation class - Removed animation for fixed rotate button */
        .animate-rotate-arrows {
          animation: rotateArrows 3s linear infinite;
        }
        
        /* Rotate phone icon animation */
        @keyframes rotatePhone {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        .animate-rotate-phone {
          animation: rotatePhone 2s linear infinite !important;
          transform-origin: center center !important;
        }
        
        /* On small screens: show typing bar so white keyboard works */
        @media (max-width: 767px) {
          .keyboard-page-type-input {
            position: fixed !important;
            left: 1rem !important;
            right: 1rem !important;
            bottom: 5.5rem !important;
            top: auto !important;
            width: auto !important;
            height: 48px !important;
            min-height: 48px !important;
            opacity: 1 !important;
            padding: 12px 16px !important;
            border: 2px solid #3b82f6 !important;
            border-radius: 12px !important;
            background: #e5e7eb !important;
            color: #111 !important;
            font-size: 16px !important;
            z-index: 60 !important;
          }
        }

        /* ============================================
           PORTRAIT MOBILE VIEW STYLES
           (max-width: 767px) - Portrait orientation
           ============================================ */
        @media (max-width: 767px) {
          /* PORTRAIT: Scale down elements for mobile portrait view */
          .mobile-scale {
            transform: scale(0.8);
            transform-origin: top center;
            width: 125%;
            margin-left: 1%;
          }
          
          /* PORTRAIT: Stack elements vertically in mobile portrait */
          .mobile-stack {
            flex-direction: column;
          }
          
          /* PORTRAIT: Smaller text size for mobile portrait */
          .mobile-small-text {
            font-size: 0.8rem;
          }
          
          /* PORTRAIT: Tighter gap spacing for mobile portrait */
          .mobile-tight-gap {
            gap: 0.5rem;
          }
          
          /* PORTRAIT: Small key sizes for typing prompt in portrait */
          .mobile-small-key {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.7rem !important;
          }
          
          /* PORTRAIT: Space key size for typing prompt in portrait */
          .mobile-space-key {
            width: 60px !important;
            height: 30px !important;
          }
          
          /* PORTRAIT: Typing prompt - tight layout so all 8 boxes fit, no half-cut */
          .portrait-typing-prompt {
            justify-content: space-between !important;
            overflow: hidden !important;
            flex-wrap: nowrap !important;
            gap: 0.15rem !important;
            padding-left: 0.15rem !important;
            padding-right: 0.15rem !important;
            margin-top: 1.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          /* PORTRAIT: Increase gap between statistics items (Correct, Wrong, Accuracy, Timer) */
          @media (max-width: 767px) {
            .md\\:hidden.w-full.flex.items-center.justify-center.gap-8 {
              gap: 2rem !important;
            }
          }
          
          /* PORTRAIT: Letter boxes - 24px wide so 8 fit on narrow screens */
          .portrait-typing-prompt .portrait-char-box:not([class*="w-14"]):not([class*="w-16"]):not([class*="w-12"]) {
            width: 24px !important;
            height: 40px !important;
            min-width: 24px !important;
            max-width: 24px !important;
            min-height: 40px !important;
            font-size: 0.75rem !important;
            flex-shrink: 0 !important;
          }
          
          /* PORTRAIT: Space box - 36px so total row fits */
          .portrait-typing-prompt > div[class*="w-12"]:not([class*="w-8"]) {
            width: 36px !important;
            min-width: 36px !important;
            max-width: 36px !important;
            height: 40px !important;
            min-height: 40px !important;
            flex-shrink: 0 !important;
          }
          
          /* PORTRAIT: Keyboard container - full width, smaller keys */
          .portrait-keyboard {
            width: 100% !important;
            max-width: 100% !important;
            padding: 4px !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-sizing: border-box !important;
          }
          
          /* PORTRAIT: Reduce keyboard key sizes to fit all keys */
          .portrait-keyboard .flex > div {
            font-size: 0.45rem !important;
            padding: 2px 1px !important;
            margin-left: 0.25px !important;
            margin-right: 0.25px !important;
          }
          
          /* PORTRAIT: Reduce row spacing */
          .portrait-keyboard .flex {
            margin-bottom: 1px !important;
            gap: 0.5px !important;
          }
          
          /* PORTRAIT: Hide scrollbar for typing prompt in portrait */
          .portrait-typing-prompt::-webkit-scrollbar {
            display: none;
          }
          
          /* PORTRAIT: Rotation prompt visibility for portrait view */
          .rotate-prompt-mobile {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            bottom: 1rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          /* LANDSCAPE: Rotation prompt in landscape mobile view */
          @media (max-width: 932px) and (orientation: landscape) {
            .rotate-prompt-mobile {
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
              position: fixed !important;
              z-index: 9999 !important;
            }
          }
          
          /* PORTRAIT: Hide desktop hand-overlay only; keep portrait-keyboard-hand-overlay visible so hands move when typing */
          .hand-overlay {
            display: none !important;
          }
          .portrait-keyboard-hand-overlay {
            display: flex !important;
          }
        }

        
        /* ============================================
           LANDSCAPE MOBILE VIEW STYLES
           (max-width: 932px) and (orientation: landscape)
           ============================================ */
        @media (max-width: 932px) and (orientation: landscape),
               (max-height: 500px) and (orientation: landscape) {
          /* LANDSCAPE: Fix html/body for landscape mobile */
          html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            position: fixed;
          }
          
          /* LANDSCAPE: Hide top mobile stats container in landscape */
          .mobile-stats-container {
            display: none !important;
          }
          
          /* LANDSCAPE: Right section cards in landscape mobile - single column with 5 cards */
          .landscape-mobile-stats {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            max-width: 120px !important;
            gap: 0.5rem !important;
          }
          
          /* LANDSCAPE: Stats card width in landscape mobile */
          .landscape-mobile-stats > div {
            width: 100% !important;
            min-width: 100% !important;
          }
          
          /* LANDSCAPE: Hide user profile image in landscape mobile view */
          .user-profile-section,
          .user-profile-image,
          .user-profile-name {
            display: none !important;
          }
          
          /* LANDSCAPE: Force keyboard container to be smaller and fixed */
          .keyboard-container.mobile-scale,
          .mobile-scale.keyboard-container {
            transform: scale(0.85) !important;
            transform-origin: top center !important;
            width: 75% !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding: 4px !important;
            max-width: 85% !important;
            margin-top: 0 !important;
            border-radius: 8px !important;
            position: relative !important;
            overflow: visible !important;
          }
          
          /* LANDSCAPE: Remove border radius from keyboard keys */
          .keyboard-container.mobile-scale .flex > div {
            border-radius: 0 !important;
          }
          
          /* LANDSCAPE: Hide hand images in landscape mobile view */
          .keyboard-container.mobile-scale .hand-overlay {
            display: none !important;
          }
          
          /* LANDSCAPE: Hide user profile in landscape mobile view */
          .user-profile-landscape {
            display: none !important;
          }
          
          /* LANDSCAPE: Single column layout for stats in landscape mobile */
          .stats-grid-landscape {
            grid-template-columns: 1fr !important;
          }
          
          /* LANDSCAPE: Small key sizes for landscape mobile */
          .mobile-small-key {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.8rem !important;
          }
          
          /* LANDSCAPE: Space key size for landscape mobile */
          .mobile-space-key {
            width: 90px !important;
            height: 20px !important;
            font-size: 0.8rem !important;
          }
          
          /* LANDSCAPE: Keyboard keys in landscape - use specific class selector */
          .keyboard-container.mobile-scale .flex > div,
          .keyboard-container.mobile-scale .flex > div.h-14 {
            height: 32px !important;
            min-height: 32px !important;
            max-height: 32px !important;
            font-size: 0.5rem !important;
            margin-left: 1px !important;
            margin-right: 1px !important;
            padding: 4px 2px !important;
            line-height: 1.2 !important;
          }
          
          /* LANDSCAPE: Override all width classes with attribute selector - default keys */
          .keyboard-container.mobile-scale .flex > div[class*="w-"] {
            width: 28px !important;
            min-width: 58px !important;
            max-width: 28px !important;
          }
          
          /* LANDSCAPE: Special keys - Backspace and Enter (170px) */
          .keyboard-container.mobile-scale .flex > div[class*="170px"] {
            width: 60px !important;
            min-width: 82px !important;
            max-width: 60px !important;
          }
          
          /* LANDSCAPE: Shift button (175px) */
          .keyboard-container.mobile-scale .flex > div[class*="175px"] {
            width: 65px !important;
            min-width: 105px !important;
            max-width: 65px !important;
          }
          
          /* LANDSCAPE: Tab button (130px) */
          .keyboard-container.mobile-scale .flex > div[class*="130px"] {
            width: 50px !important;
            min-width: 82px !important;
            max-width: 50px !important;
          }
          
          /* LANDSCAPE: Caps button (118px) */
          .keyboard-container.mobile-scale .flex > div[class*="118px"] {
            width: 48px !important;
            min-width: 82px !important;
            max-width: 48px !important;
          }
          
          /* LANDSCAPE: Ctrl, Alt, Win, Menu buttons (70px) */
          .keyboard-container.mobile-scale .flex > div[class*="100px"] {
            width: 35px !important;
            min-width: 35px !important;
            max-width: 35px !important;
          }
          
          /* LANDSCAPE: Backslash button (95px) */
          .keyboard-container.mobile-scale .flex > div[class*="95px"] {
            width: 40px !important;
            min-width: 40px !important;
            max-width: 40px !important;
          }
          
          /* LANDSCAPE: Default letter keys (55px) */
          .keyboard-container.mobile-scale .flex > div[class*="55px"] {
            width: 28px !important;
            min-width: 40px !important;
            max-width: 28px !important;
          }
          
          /* LANDSCAPE: Space key */
          .keyboard-container.mobile-scale .flex > div[class*="flex-1"] {
            flex: 1 1 auto !important;
            min-width: 80px !important;
            width: auto !important;
            max-width: 270px !important;
          }
          
          /* LANDSCAPE: Row spacing for keyboard */
          .keyboard-container.mobile-scale .flex {
            margin-bottom: 2px !important;
            gap: 2px !important;
          }
          
          /* LANDSCAPE: Fix keyboard container positioning in landscape */
          .keyboard-container {
            position: relative !important;
            max-height: 50vh !important;
            overflow-y: auto !important;
            
          }
          
          /* LANDSCAPE: Right section absolute positioning in mobile landscape */
          .right-section-stats {
            position: absolute !important;
            right: 1rem !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 100 !important;
            padding-right: 0.5rem !important;
          }
          
          /* LANDSCAPE MOBILE: Hide theme toggle button at top right */
          .theme-toggle-button {
            display: none !important;
          }
          
          /* LANDSCAPE MOBILE: Hide desktop toggles */
          .mobile-stack > div:has(label),
          .mobile-stack > div.hidden.md\\:hidden.lg\\:flex {
            display: none !important;
          }
        }
        
        /* ============================================
           LANDSCAPE MOBILE: Typing Prompt Keys
           Increase typing prompt keys size in mobile landscape
           ============================================ */
        @media (max-width: 932px) and (orientation: landscape) {
          /* LANDSCAPE: Typing prompt container - ensure full width and all boxes visible */
          .landscape-typing-prompt {
            width: calc(100% - 280px) !important;
            max-width: calc(100% - 280px) !important;
            justify-content: space-between !important;
            overflow: visible !important;
            flex-wrap: nowrap !important;
            gap: 2rem !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-sizing: border-box !important;
            left: 0.5rem !important;
            right: auto !important;
          }
          
          /* LANDSCAPE: Ensure first and last boxes align with keyboard edges */
          .landscape-typing-prompt > div:first-child {
            margin-left: 0 !important;
          }
          
          .landscape-typing-prompt > div:last-child {
            margin-right: 0 !important;
          }
          
          /* LANDSCAPE: Character boxes size - increased to w-20 (80px) to span full width */
          .landscape-typing-prompt > div.landscape-char-box:not([class*="w-22"]):not([class*="w-24"]):not([class*="w-32"]),
          .landscape-typing-prompt > div[class*="w-20"]:not([class*="w-22"]):not([class*="w-24"]):not([class*="w-32"]),
          .landscape-typing-prompt > div[class*="w-15"]:not([class*="w-22"]):not([class*="w-24"]):not([class*="w-32"]) {
            width: 80px !important;
            min-width: 80px !important;
            max-width: 80px !important;
            height: 64px !important;
            min-height: 64px !important;
            font-size: 1.4rem !important;
            flex-shrink: 0 !important;
          }
          
          /* LANDSCAPE: Space key in typing prompt - increased size */
          .landscape-typing-prompt > div[class*="w-32"],
          .landscape-typing-prompt > div[class*="w-22"],
          .landscape-typing-prompt > div[class*="w-24"] {
            width: 140px !important;
            min-width: 140px !important;
            max-width: 140px !important;
            height: 64px !important;
            min-height: 64px !important;
            flex-shrink: 0 !important;
          }
          
          /* LANDSCAPE: Increase gap to distribute boxes evenly across full width */
          .landscape-typing-prompt {
            gap: 1.5rem !important;
          }
        }

        /* ============================================
           DESKTOP LANDSCAPE VIEW STYLES
           (min-width: 768px) and (orientation: landscape)
           ============================================ */
        @media (min-width: 768px) and (orientation: landscape) {
          /* DESKTOP LANDSCAPE: Fix keyboard container width - only affects desktop, not landscape-keyboard-small */
          .keyboard-container:not(.landscape-keyboard-small) {
            max-width: 70% !important;
            width: auto !important;
            margin: 0 auto !important;
            padding: 8px !important;
          }
        }
        
        /* ============================================
           MOBILE LANDSCAPE VIEWS ONLY
           (max-width: 932px) and (orientation: landscape)
           ============================================ */
        @media (max-width: 932px) and (orientation: landscape) {
          /* MOBILE LANDSCAPE: Only affect landscape-keyboard-small, not desktop keyboard-container */
          /* Account for stats panel (120px) + gap (4rem = 64px) on right side */
          .keyboard-container.landscape-keyboard-small {
            max-width: calc(100% - 280px) !important;
            width: calc(100% - 280px) !important;
            margin-left: 0 !important;
            margin-right: 4rem !important;
            left: 0.5rem !important;
          }
          
          /* MOBILE LANDSCAPE: Align typing prompt with keyboard edges */
          .landscape-typing-prompt {
            position: absolute !important;
            left: 0.5rem !important;
            top: 0 !important;
            width: calc(100% - 280px) !important;
            max-width: calc(100% - 280px) !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            justify-content: space-between !important;
            gap: 1.5rem !important;
          }
          
          
          /* MOBILE LANDSCAPE: Add spacer for absolute positioned typing prompt */
          .landscape-prompt-spacer {
            height: 80px !important;
          }
          
          /* MOBILE LANDSCAPE: Align stats section to right edge on mobile landscape devices */
          .right-section-stats {
            right: 1rem !important;
            padding-right: 0.5rem !important;
          }
          
          /* MOBILE LANDSCAPE: Ensure proper gap between keyboard and stats */
          .keyboard-container.landscape-keyboard-small + *,
          .landscape-keyboard-small {
            margin-right: 1.5rem !important;
          }
        }
      `}</style>

      {/* Theme Toggle Button - Hidden in Portrait Mobile View */}
      <div className="fixed top-4 right-28 z-40 cursor-pointer theme-toggle-button hidden md:block">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full shadow text-sm cursor-pointer ${
            isDarkMode ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Render appropriate view based on device and orientation */}
      {renderView()}

      {/* Completion Result Modal */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg p-6 md:p-8 max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-green-600">
              🎉 Practice Completed!
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{finalWpm}</div>
                <div className="text-sm text-gray-600 mt-1">WPM</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{finalAccuracy}%</div>
                <div className="text-sm text-gray-600 mt-1">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{Math.round(timeTaken)}s</div>
                <div className="text-sm text-gray-600 mt-1">Time</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{displayCorrectCount}/{totalCount}</div>
                <div className="text-sm text-gray-600 mt-1">Correct/Total</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetStats}
                className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/learning'}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                Back to Lessons
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function getFingerPosition(finger) {
  const positions = {
    'pinky': 'bottom-20 left-4',
    'ring': 'bottom-24 left-12',
    'middle': 'bottom-28 left-20',
    'index-left': 'bottom-28 left-28',
    'thumb': 'bottom-16 left-40',
    'index-right': 'bottom-28 right-28',
    'middle-right': 'bottom-28 right-20',
    'ring-right': 'bottom-24 right-12',
    'pinky-right': 'bottom-20 right-4'
  };
  return positions[finger] || 'bottom-16 left-40';
}

export default function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <KeyboardApp />
    </Suspense>
  );
}