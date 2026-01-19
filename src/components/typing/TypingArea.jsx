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
  const wordRefs = useRef([]);
  const containerRef = useRef(null);
  
  // Split content into words for word mode
  const words = mode === "word" && content 
    ? content.trim().split(/\s+/).filter(w => w.length > 0)
    : [];
  const typedWords = mode === "word" && typedText
    ? typedText.trim().split(/\s+/).filter(w => w.length > 0)
    : [];

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
      let wpm = 0;
      let accuracy = 100;
      
      if (mode === "word") {
        const wordsTyped = typedWords.length;
        wpm = elapsed > 0 ? Math.round(wordsTyped / elapsed) : 0;
        const correctWords = typedWords.filter((word, i) => word === words[i]).length;
        accuracy = wordsTyped > 0 ? Math.round((correctWords / wordsTyped) * 100) : 100;
      } else {
        const words = typedText.trim().split(/\s+/).length;
        wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
        accuracy = typedText.length > 0 
          ? Math.round(((typedText.length - mistakes) / typedText.length) * 100)
          : 100;
      }
      
      onProgress({
        wpm,
        accuracy,
        mistakes,
        backspaceCount,
        timeLeft
      });
    }
  }, [typedText, typedWords, mistakes, backspaceCount, timeLeft, startTime, onProgress, mode, words]);

  const handleChange = (e) => {
    const value = e.target.value;
    setTypedText(value);
    
    if (!isActive && value.length > 0) {
      setIsActive(true);
      setStartTime(Date.now());
    }
    
    if (mode === "word") {
      const currentTypedWords = value.trim().split(/\s+/).filter(w => w.length > 0);
      
      // Check if space was pressed (word completed)
      if (value.endsWith(" ") && currentTypedWords.length > 0) {
        const typedWord = currentTypedWords[currentTypedWords.length - 1];
        const correctWord = words[currentTypedWords.length - 1] || "";
        
        if (typedWord !== correctWord) {
          setMistakes((prev) => prev + 1);
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
              accuracy
            });
          }
        }
      }
      
      // Calculate which word should be highlighted/scrolled to
      // If text ends with space, the next word (not yet typed) should be highlighted
      // Otherwise, the current word being typed should be highlighted
      // If text is empty, scroll to first word (index 0)
      const currentWordIndex = value.trim() === ''
        ? 0  // First word when starting
        : value.endsWith(' ') || value.endsWith('\n') || value.endsWith('\t')
          ? currentTypedWords.length  // Next word to type (not yet in currentTypedWords)
          : currentTypedWords.length > 0 ? currentTypedWords.length - 1 : 0; // Current word being typed
      
      // Use setTimeout to ensure DOM is updated after state change
      setTimeout(() => {
        const wordEl = wordRefs.current[currentWordIndex];
        if (wordEl && containerRef.current) {
          wordEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
      }, 0);
    }
  };

  const handleKeyPress = (e) => {
    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    if (mode === "character") {
      if (!isActive && typedText.length === 0) {
        setIsActive(true);
        setStartTime(Date.now());
      }

      const expectedChar = content[currentIndex];
      const pressedChar = e.key;

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
      // Word mode - handle backspace
      if (e.key === "Backspace") {
        if (allowBackspace) {
          setBackspaceCount((prev) => prev + 1);
        } else {
          e.preventDefault();
        }
      }
    }
  };

  const renderColoredWords = () => {
    if (mode !== "word" || words.length === 0) return null;
    
    let pointer = 0;
    
    // Determine which word should be highlighted (current word being typed)
    // If typedText ends with space, highlight the next word (index = typedWords.length)
    // Otherwise, highlight the current word (index = typedWords.length - 1)
    // If text is empty, highlight the first word (index 0)
    const highlightedIndex = typedText.trim() === ''
      ? 0  // First word when starting
      : typedText.endsWith(' ') || typedText.endsWith('\n') || typedText.endsWith('\t')
        ? typedWords.length  // Next word to type
        : typedWords.length > 0 ? typedWords.length - 1 : 0; // Current word being typed
    
    return (
      <div className="space-y-1">
        {words.map((word, index) => {
          let className = "";
          if (index < highlightedIndex) {
            // Already typed words - green if correct, red if wrong
            className = typedWords[index] === word ? "text-green-600" : "text-red-600";
          } else if (index === highlightedIndex) {
            // Current word being typed (highlighted) - blue background
            className = "bg-blue-500 text-white px-1 rounded";
          } else {
            // Future words - gray
            className = "text-gray-500";
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
        className="w-full p-6 bg-gray-50 border-2 border-gray-300 rounded-lg text-lg md:text-xl font-mono min-h-[200px] max-h-[500px] overflow-y-auto cursor-text"
        onClick={() => inputRef.current?.focus()}
        ref={containerRef}
      >
        {mode === "word" ? (
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {renderColoredWords()}
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            <span className="text-green-600">{typedText}</span>
            <span className="bg-yellow-200">{content[currentIndex] || ""}</span>
            <span className="text-gray-400">{content.slice(currentIndex + 1)}</span>
          </div>
        )}
      </div>

      {/* Input for capturing keystrokes */}
      {mode === "word" ? (
        <textarea
          ref={inputRef}
          value={typedText}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          autoFocus
          tabIndex={-1}
          spellCheck={false}
        />
      ) : (
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
      )}

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

