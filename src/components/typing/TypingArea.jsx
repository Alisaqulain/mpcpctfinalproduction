"use client";
import React, { useState, useEffect, useRef } from "react";

export default function TypingArea({
  content,
  onComplete,
  onProgress,
  showTimer = false,
  duration = null,
  allowBackspace = true,
  language = "English",
  scriptType = null,
  mode = "character" // "character" or "word"
}) {
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration ? duration * 60 : null);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (showTimer && timeLeft !== null && isActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (onComplete) onComplete({ typedText, mistakes, backspaceCount });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isActive, showTimer]);

  useEffect(() => {
    if (onProgress && startTime) {
      const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
      const words = typedText.trim().split(/\s+/).length;
      const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
      const accuracy = typedText.length > 0 
        ? Math.round(((typedText.length - mistakes) / typedText.length) * 100)
        : 100;
      
      onProgress({
        wpm,
        accuracy,
        mistakes,
        backspaceCount,
        timeLeft
      });
    }
  }, [typedText, mistakes, backspaceCount, timeLeft, startTime, onProgress]);

  const handleKeyPress = (e) => {
    if (!isActive && typedText.length === 0) {
      setIsActive(true);
      setStartTime(Date.now());
    }

    const expectedChar = content[currentIndex];
    const pressedChar = e.key;

    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    if (mode === "character") {
      // Character mode - single character at a time
      if (pressedChar === expectedChar) {
        setTypedText((prev) => prev + pressedChar);
        setCurrentIndex((prev) => {
          const newIndex = prev + 1;
          if (newIndex >= content.length) {
            setIsActive(false);
            if (onComplete) {
              onComplete({ typedText: typedText + pressedChar, mistakes, backspaceCount });
            }
          }
          return newIndex;
        });
      } else if (pressedChar.length === 1) {
        // Wrong character
        setMistakes((prev) => prev + 1);
      }
    } else {
      // Word/Paragraph mode
      if (pressedChar === "Backspace") {
        if (allowBackspace) {
          setBackspaceCount((prev) => prev + 1);
          setTypedText((prev) => prev.slice(0, -1));
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      } else if (pressedChar.length === 1) {
        const expectedChar = content[currentIndex];
        if (pressedChar === expectedChar) {
          setTypedText((prev) => prev + pressedChar);
          setCurrentIndex((prev) => {
            const newIndex = prev + 1;
            if (newIndex >= content.length) {
              setIsActive(false);
              if (onComplete) {
                onComplete({ typedText: typedText + pressedChar, mistakes, backspaceCount });
              }
            }
            return newIndex;
          });
        } else {
          setMistakes((prev) => prev + 1);
          setTypedText((prev) => prev + pressedChar);
          setCurrentIndex((prev) => prev + 1);
        }
      }
    }
  };

  const getDisplayText = () => {
    if (mode === "character") {
      return content;
    }
    return content;
  };

  const getTypedDisplay = () => {
    return typedText;
  };

  const getRemainingDisplay = () => {
    return content.slice(currentIndex);
  };

  return (
    <div className="w-full">
      {/* Hidden audio for keypress sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/keypress.mp3" type="audio/mpeg" />
      </audio>

      {/* Timer Display */}
      {showTimer && timeLeft !== null && (
        <div className="mb-4 text-center">
          <div className="text-3xl font-bold text-[#290c52]">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        </div>
      )}

      {/* Typing Area */}
      <div
        className="w-full p-6 bg-gray-50 border-2 border-gray-300 rounded-lg text-lg md:text-xl font-mono min-h-[200px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="whitespace-pre-wrap break-words">
          <span className="text-green-600">{getTypedDisplay()}</span>
          <span className="bg-yellow-200">{content[currentIndex] || ""}</span>
          <span className="text-gray-400">{getRemainingDisplay().slice(1)}</span>
        </div>
      </div>

      {/* Input for capturing keystrokes - positioned off-screen but functional */}
      <input
        ref={inputRef}
        type="text"
        value=""
        onChange={() => {}}
        onKeyDown={handleKeyPress}
        className="absolute opacity-0 pointer-events-none"
        autoFocus
        tabIndex={-1}
      />

      {/* Progress Indicator */}
      {mode === "character" && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">
            Progress: {currentIndex} / {content.length} characters
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#290c52] h-2 rounded-full transition-all"
              style={{ width: `${(currentIndex / content.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

