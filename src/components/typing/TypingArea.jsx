"use client";
import React, { useState, useEffect, useRef } from "react";
import { useHindiTyping } from "@/hooks/useHindiTyping";

/**
 * TypingArea: Single source of input via controlled hidden input.
 * Works on: Desktop browsers, mobile browsers, Android WebView (Expo), iOS WebView.
 * - Typing is driven by onChange (value), not keydown-only.
 * - On screen click we focus the input so soft keyboard opens on mobile.
 * - No preventDefault on touch, no pointer-events-none on input.
 *
 * Testing:
 * - Mobile Chrome: Tap typing area → focus → type; keys should register.
 * - Expo Go: Same; ensure WebView allows input focus.
 * - Android WebView: Build dev client, load app, test learning/skill typing.
 */

export default function TypingArea({
  content,
  onComplete,
  onProgress,
  showTimer = false,
  duration = null,
  allowBackspace = true,
  language = "English",
  scriptType = null,
  mode = "character",
  visibleInput = false,
  fontSize: fontSizeProp = null,
  disabled = false,
  onActiveKey = null,
}) {
  const fontSize = fontSizeProp ?? 16;
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration ? duration * 60 : null);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const inputRef = useRef(null);
  const lastProcessedLengthRef = useRef(0);
  const processTypingRef = useRef(null);
  const audioRef = useRef(null);
  const wordRefs = useRef([]);
  const containerRef = useRef(null);

  const isHindiTyping = language === "Hindi";
  const hindiLayout = scriptType && scriptType.toLowerCase().includes("inscript") ? "inscript" : "remington";
  const hindiTyping = useHindiTyping(hindiLayout || "remington", isHindiTyping, allowBackspace);

  // Debug: enable with ?typingDebug=1 or ?typingAlert=1 in URL (or window.__TYpingAreaDebug / __TYpingAreaAlert)
  const DEBUG_TYPING = typeof window !== "undefined" && (window.__TYpingAreaDebug === true || /[?&]typingDebug=1/.test(window.location.search || ""));
  const DEBUG_ALERT = typeof window !== "undefined" && (window.__TYpingAreaAlert === true || /[?&]typingAlert=1/.test(window.location.search || ""));

  const words = mode === "word" && content ? content.trim().split(/\s+/).filter((w) => w.length > 0) : [];
  const typedWords = mode === "word" && typedText ? typedText.trim().split(/\s+/).filter((w) => w.length > 0) : [];

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
      const elapsed = (Date.now() - startTime) / 1000 / 60;
      let wpm = 0;
      let accuracy = 100;
      if (mode === "word") {
        const wordsTyped = typedWords.length;
        wpm = elapsed > 0 ? Math.round(wordsTyped / elapsed) : 0;
        const correctWords = typedWords.filter((word, i) => word === words[i]).length;
        accuracy = wordsTyped > 0 ? Math.round((correctWords / wordsTyped) * 100) : 100;
      } else {
        const wordCount = typedText.trim().split(/\s+/).length;
        wpm = elapsed > 0 ? Math.round(wordCount / elapsed) : 0;
        accuracy = typedText.length > 0 ? Math.round(((typedText.length - mistakes) / typedText.length) * 100) : 100;
      }
      onProgress({
        wpm,
        accuracy,
        mistakes,
        backspaceCount,
        timeLeft,
        typedText: mode === "word" ? typedText : undefined,
        correctCount: mode === "word" ? typedWords.filter((word, i) => word === words[i]).length : undefined,
        totalCount: mode === "word" ? words.length : undefined,
      });
    }
  }, [typedText, typedWords, mistakes, backspaceCount, timeLeft, startTime, onProgress, mode, words]);

  // Single processTyping: drives all typing logic from current value. Same for laptop and mobile.
  const processTyping = (value) => {
    if (DEBUG_TYPING && mode === "character") {
      console.log("[TypingArea] processTyping character", { valueLen: value.length, currentIndex: lastProcessedLengthRef.current, expected: content[lastProcessedLengthRef.current] });
    }
    if (mode === "character") {
      const prevLen = lastProcessedLengthRef.current;
      if (value.length > prevLen) {
        if (prevLen === 0 && value.length > 0) {
          setIsActive(true);
          setStartTime(Date.now());
        }
        const added = value.slice(prevLen);
        let newMistakes = 0;
        for (let i = 0; i < added.length; i++) {
          const newChar = added[i];
          const expectedIndex = prevLen + i;
          const expectedChar = content[expectedIndex];
          if (DEBUG_TYPING) console.log("[TypingArea] char check", { newChar, expectedChar, match: newChar === expectedChar });
          if (typeof onActiveKey === "function") onActiveKey(newChar);
          if (newChar !== expectedChar) newMistakes += 1;
        }
        const newIndex = prevLen + added.length;
        lastProcessedLengthRef.current = newIndex;
        setCurrentIndex(newIndex);
        if (newMistakes > 0) setMistakes((prev) => prev + newMistakes);
        if (newIndex >= content.length) {
          setIsActive(false);
          if (onComplete) onComplete({ typedText: value, mistakes, backspaceCount });
        }
      } else if (value.length < prevLen) {
        lastProcessedLengthRef.current = value.length;
        setCurrentIndex((prev) => Math.max(0, prev - (prevLen - value.length)));
      }
      return;
    }

    // Word mode
    if (!isActive && value.length > 0) {
      setIsActive(true);
      setStartTime(Date.now());
    }
    const currentTypedWords = value.trim().split(/\s+/).filter((w) => w.length > 0);
    if (value.endsWith(" ") && currentTypedWords.length > 0) {
      const typedWord = currentTypedWords[currentTypedWords.length - 1];
      const correctWord = words[currentTypedWords.length - 1] || "";
      if (typedWord !== correctWord) setMistakes((prev) => prev + 1);
      const nextWordIndex = currentTypedWords.length;
      if (nextWordIndex >= words.length) {
        setIsActive(false);
        if (onComplete) {
          const finalTypedWords = value.trim().split(/\s+/).filter((w) => w.length > 0);
          const correctWordsCount = finalTypedWords.filter((w, i) => w === words[i]).length;
          const wrongWordsCount = finalTypedWords.length - correctWordsCount;
          const accuracy = finalTypedWords.length > 0 ? Math.round((correctWordsCount / finalTypedWords.length) * 100) : 100;
          const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
          const wpm = elapsed > 0 ? Math.round(finalTypedWords.length / elapsed) : 0;
          onComplete({ typedText: value, mistakes: wrongWordsCount, backspaceCount, wpm, accuracy });
        }
      }
    }
    const currentWordIndex =
      value.trim() === ""
        ? 0
        : value.endsWith(" ") || value.endsWith("\n") || value.endsWith("\t")
          ? currentTypedWords.length
          : currentTypedWords.length > 0
            ? currentTypedWords.length - 1
            : 0;
    setTimeout(() => {
      const wordEl = wordRefs.current[currentWordIndex];
      if (wordEl && containerRef.current) wordEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, 0);
  };
  processTypingRef.current = processTyping;

  // Single input handler: value-driven. Same for laptop and mobile keyboard.
  const handleInputChange = (e) => {
    const raw = e.target.value;
    let value = raw;
    if (DEBUG_TYPING) {
      console.log("[TypingArea] handleInputChange", { raw: raw.slice(-3), len: raw.length, mode, focus: document.activeElement?.tagName });
    }
    if (mode === "word" && isHindiTyping && hindiTyping.isEnabled && hindiTyping.handleInputChange) {
      const converted = hindiTyping.handleInputChange(value, typedText);
      if (converted !== null) {
        const val = typeof converted === "object" && "value" in converted ? converted.value : converted;
        const cursor = typeof converted === "object" && "cursor" in converted ? converted.cursor : val.length;
        value = val;
        e.target.value = val;
        e.target.setSelectionRange(cursor, cursor);
      }
    }
    if (DEBUG_ALERT && value.length === 1) {
      try { alert("Key caught: " + JSON.stringify(value)); } catch (a) {}
    }
    setTypedText(value);
    processTyping(value);
  };

  // Native "input" listener so mobile keyboard works in WebView (same as laptop)
  useEffect(() => {
    const el = inputRef.current;
    if (!el || mode !== "character") return;
    const handler = () => {
      const value = el.value || "";
      setTypedText(value);
      if (processTypingRef.current) processTypingRef.current(value);
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
    return () => {
      el.removeEventListener("input", handler);
      el.removeEventListener("change", handler);
    };
  }, [mode]);

  // When focus is on the typing container (not the input), physical keyboard keys go here.
  // Forward them to the input by injecting the key and running the same flow so "words catch".
  const handleContainerKeyDown = (e) => {
    const input = inputRef.current;
    const focused = document.activeElement;
    const focusIsInput = focused === input;
    if (focusIsInput) return; // Let the input handle it

    const key = e.key;
    // Printable character (length 1, not control) or Backspace/Space/Enter
    const isPrintable = key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    const isBackspace = key === "Backspace";
    const isSpaceOrEnter = key === " " || key === "Enter";

    if (!isPrintable && !isBackspace && !isSpaceOrEnter) return;

    e.preventDefault();
    e.stopPropagation();
    input?.focus();

    let newValue;
    if (isBackspace) {
      newValue = typedText.slice(0, -1);
    } else if (isSpaceOrEnter) {
      newValue = typedText + (key === "Enter" ? "\n" : " ");
    } else {
      newValue = typedText + key;
    }

    if (input) input.value = newValue;
    setTypedText(newValue);
    if (processTypingRef.current) processTypingRef.current(newValue);
    if (DEBUG_TYPING) console.log("[TypingArea] container key forwarded", { key, newValueLen: newValue.length });
  };

  // Optional keydown: sound + Hindi composition only. Typing logic is in handleInputChange.
  const handleKeyDown = (e) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (mode === "word" && isHindiTyping && hindiTyping.isEnabled) {
      const handled = hindiTyping.handleKeyDown(e, typedText, setTypedText);
      if (handled) {
        if (e.key === "Backspace") setBackspaceCount((prev) => prev + 1);
        return;
      }
    }
    if (mode === "word" && e.key === "Backspace" && allowBackspace) {
      setBackspaceCount((prev) => prev + 1);
      if (isHindiTyping) hindiTyping.clearBuffer();
    }
    if (mode === "word" && (e.key === " " || e.key === "Enter") && isHindiTyping) {
      hindiTyping.clearBuffer();
    }
    // Prevent cursor/arrow from moving in character mode
    if (mode === "character" && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const renderColoredWords = () => {
    if (mode !== "word" || words.length === 0) return null;
    const highlightedIndex =
      typedText.trim() === ""
        ? 0
        : typedText.endsWith(" ") || typedText.endsWith("\n") || typedText.endsWith("\t")
          ? typedWords.length
          : typedWords.length > 0
            ? typedWords.length - 1
            : 0;
    return (
      <div className="space-y-1">
        {words.map((word, index) => {
          let className = "";
          if (index < highlightedIndex) {
            className = typedWords[index] === word ? "text-green-600" : "text-red-600";
          } else if (index === highlightedIndex) {
            className = "bg-blue-500 text-white px-1 rounded";
          } else {
            className = "text-gray-500";
          }
          return (
            <span key={index} ref={(el) => (wordRefs.current[index] = el)} className={`${className} mr-1 inline-block`}>
              {word}{" "}
            </span>
          );
        })}
      </div>
    );
  };

  // Hidden input: visually hidden but focusable. 44px so mobile/WebView opens keyboard.
  const hiddenInputStyle = {
    position: "absolute",
    opacity: 0,
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    padding: 0,
    margin: 0,
    border: 0,
    outline: "none",
    left: 0,
    top: "40%",
    fontSize: 16,
    pointerEvents: "auto",
  };

  return (
    <div className="w-full">
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/keypress.mp3" type="audio/mpeg" />
      </audio>

      {showTimer && timeLeft !== null && (
        <div className="mb-4 text-center">
          <div className="text-3xl font-bold text-[#290c52]">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
        </div>
      )}

      {/* Typing area: click focuses the hidden input so mobile keyboard opens */}
      <div
        ref={containerRef}
        className="w-full p-6 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono min-h-[200px] max-h-[500px] overflow-y-auto cursor-text"
        style={{ fontSize: `${fontSize}px` }}
        onClick={() => inputRef.current?.focus()}
        role="button"
        tabIndex={0}
        onKeyDown={handleContainerKeyDown}
        aria-label="Tap to focus and type"
      >
        {mode === "word" ? (
          <div className="whitespace-pre-wrap break-words leading-relaxed">{renderColoredWords()}</div>
        ) : (
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            <span className="text-green-600">{typedText}</span>
            <span className="bg-yellow-200">{content[currentIndex] || ""}</span>
            <span className="text-gray-400">{content.slice(currentIndex + 1)}</span>
          </div>
        )}
      </div>

      {/* Visible input for character mode (alpha typing) so mobile soft keyboard has a clear target */}
      {mode === "character" ? (
        <div className="mt-3" data-typing-input-wrap>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tap here to type (mobile: opens keyboard)
          </label>
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={handleInputChange}
            onInput={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              const len = (e.target.value || "").length;
              e.target.setSelectionRange(len, len);
              lastProcessedLengthRef.current = len;
            }}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            aria-label="Type the letters above"
            data-typing-input
            className="w-full min-h-[48px] px-4 py-3 text-lg border-2 border-[#290c52] rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#290c52] focus:border-[#290c52]"
            style={{ fontSize: `${fontSize}px` }}
            inputMode="text"
            autoComplete="off"
            tabIndex={0}
            placeholder="Tap then type the letters above…"
          />
        </div>
      ) : mode === "word" && visibleInput ? (
        <textarea
          ref={inputRef}
          value={typedText}
          onChange={handleInputChange}
          onInput={handleInputChange}
          onKeyDown={handleKeyDown}
          onKeyUp={isHindiTyping ? (ev) => hindiTyping.handleKeyUp(ev, typedText, setTypedText) : undefined}
          placeholder={isHindiTyping ? `Type here (${hindiLayout === "inscript" ? "InScript" : "Remington"})…` : "Start typing here..."}
          lang={isHindiTyping ? "hi" : undefined}
          inputMode={isHindiTyping ? "text" : undefined}
          className="w-full min-h-[80px] max-h-[100px] lg:min-h-[180px] lg:max-h-[220px] p-2 border border-gray-400 border-b-4 border-b-[#290c52] rounded-md mt-1 bg-white font-sans text-base text-gray-800 focus:outline-none disabled:opacity-50"
          style={{ fontSize: `${fontSize}px` }}
          autoFocus
          tabIndex={0}
          spellCheck={false}
          disabled={disabled}
          aria-label="Type the text above"
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          defaultValue=""
          onChange={handleInputChange}
          onInput={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            const len = (e.target.value || "").length;
            e.target.setSelectionRange(len, len);
            lastProcessedLengthRef.current = len;
          }}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          aria-label="Type the text above"
          className="absolute border-0 p-0 m-0 outline-none"
          style={hiddenInputStyle}
          inputMode="text"
          autoComplete="off"
          tabIndex={0}
        />
      )}

      {mode === "character" && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">
            Progress: {currentIndex} / {content.length} characters
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#290c52] h-2 rounded-full transition-all"
              style={{ width: `${content.length ? Math.min(100, (currentIndex / content.length) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
