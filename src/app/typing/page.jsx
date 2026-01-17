"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getLearningData, getLessonContent } from "@/lib/learningData";

// Desktop View Component
function DesktopView({
  content,
  loading,
  typedText,
  handleChange,
  isPaused,
  isCompleted,
  renderColoredWords,
  fontSize,
  handleReset,
  togglePause,
  handleCompletion,
  startTime,
  wpm,
  accuracy,
  elapsedTime,
  correctWords,
  handleDownloadPDF,
  formatClock,
  timeRemaining,
  words,
  wrongWords,
  backspaceCount,
  backspaceLimit,
  userName,
  userProfileUrl,
  increaseFont,
  decreaseFont,
  wordRefs,
  containerRef,
  textareaRef
}) {
  return (
    <>
      <button className="hidden md:absolute md:right-22 md:top-6 border border-gray-600 text-white bg-red-500 px-4 py-1 rounded-md md:block">
        <a href="/skill_test">close</a>
      </button>

      <div className="flex flex-col-reverse lg:flex-row gap-6">
        {/* Typing Area */}
        <div className="w-[90%] lg:w-[110%] mx-auto">
          <div className="bg-white p-2 lg:p-3 mr-10 md:p-6 rounded-xl shadow-lg ml-5 mt-[-25]">
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
                <div className="text-sm leading-tight mb-2 lg:mb-2 overflow-y-auto min-h-[100px] max-h-[100px] lg:min-h-[200px] lg:max-h-[250px] mt-2 lg:mt-2 break-words font-sans w-full" style={{ fontSize: `${fontSize}px`, width: '100%', maxWidth: '100%' }}>
                  {renderColoredWords()}
                </div>
                <textarea
                  ref={textareaRef}
                  value={typedText}
                  onChange={handleChange}
                  disabled={isPaused || isCompleted}
                  className="w-full min-h-[100px] max-h-[100px] md:min-h-[80px] md:max-h-[100px] lg:min-h-[180px] lg:max-h-[220px] p-2 border-t border-gray-400 rounded-md focus:outline-none mt-4 disabled:opacity-50"
                  placeholder="Start typing here..."
                  style={{ fontSize: `${fontSize}px` }}
                  autoFocus
                />
              </>
            )}
          </div>
          <div className="flex justify-center mt-5 gap-6 flex-wrap">
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
            <button
              onClick={handleCompletion}
              disabled={!startTime || isCompleted}
              className="bg-green-600 hover:bg-green-700 cursor-pointer text-lg disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-1 rounded shadow font-semibold"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[20%] text-white p-3 fixed top-0 mt-[-15] left-0 z-50 bg-[#290c52] bg-[url('/bg.jpg')] bg-cover bg-top bg-no-repeat lg:static lg:bg-none lg:bg-transparent">
          <div className="flex flex-col items-center space-y-1 mt-[-18]">
            <div className="mb-4">
              <img
                src={userProfileUrl}
                alt={userName}
                className="w-20 h-20 md:w-30 md:h-25 rounded-md border-2 border-white"
                onError={(e) => {
                  e.target.src = "/lo.jpg";
                }}
              />
              <p className="font-semibold text-xs text-center">{userName}</p>
             
            </div>

            <div className="w-24 h-9 rounded-lg overflow-hidden mx-auto text-center mt-10 md:mt-5 lg:mt-2 pt-0 md:pt-0 lg:pt-0 shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
              <div className="bg-white text-black text-sm font-bold">
                {isCompleted ? formatClock(elapsedTime) : formatClock(timeRemaining)}
              </div>
            </div>
            <div className="flex grid-cols-1 gap-y-3 mt-2 gap-x-4 md:gap-x-15 lg:gap-x-15 mr-0 md:mr-10 w-[70%] md:w-full text-center lg:landscape:grid lg:grid-cols-2">
              {[{ label: "Correct", value: correctWords.length, color: "text-green-600" },
                { label: "Wrong", value: wrongWords.length, color: "text-red-500" },
                { label: "Total", value: words.length, color: "text-[#290c52]" },
                { label: "Backspace", value: backspaceCount, color: "text-blue-500" }].map(({ label, value, color }, i) => (
                  <div key={i} className="w-full sm:w-24 h-9 rounded-lg overflow-hidden mx-auto shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
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

            <div className="hidden md:flex flex-col items-center justify-center gap-1">
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
      </div>
    </>
  );
}

// Portrait View Component (Mobile Portrait)
function PortraitView({
  content,
  loading,
  typedText,
  handleChange,
  isPaused,
  isCompleted,
  renderColoredWords,
  fontSize,
  handleReset,
  togglePause,
  handleCompletion,
  startTime,
  wpm,
  accuracy,
  elapsedTime,
  correctWords,
  handleDownloadPDF,
  formatClock,
  timeRemaining,
  words,
  wrongWords,
  backspaceCount,
  backspaceLimit,
  userName,
  userProfileUrl,
  wordRefs,
  containerRef,
  increaseFont,
  decreaseFont,
  textareaRef
}) {
  return (
    <>
      <button className="absolute md:hidden right-3 top-5 border border-gray-600 text-white bg-red-500 px-4 py-1 rounded-md">
        <a href="/skill_test">close</a>
      </button>

      <div className="flex flex-col-reverse gap-6">
        {/* Typing Area */}
        <div className="w-[90%] mx-auto">
          <p className="block lg:hidden text-md mb-15 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 text-center font-bold">
            Typing Tutor
            <br />
            <span className="text-xs font-normal text-white">(Type the words as they appear below)</span>
          </p>

          <div className="bg-white p-4 mr-10 md:p-6 rounded-xl shadow-lg mt-[-25] w-full">
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
                <div className="text-sm leading-tight mb-4 overflow-y-auto min-h-[200px] max-h-[100px] mt-4 break-words font-sans w-full" style={{ fontSize: `${fontSize}px`, width: '100%', maxWidth: '100%' }}>
                  {renderColoredWords()}
                </div>
                <textarea
                  ref={textareaRef}
                  value={typedText}
                  onChange={handleChange}
                  disabled={isPaused || isCompleted}
                  className="w-full min-h-[100px] max-h-[100px] p-2 border-t border-gray-400 rounded-md focus:outline-none mt-4 disabled:opacity-50"
                  placeholder="Start typing here..."
                  style={{ fontSize: `${fontSize}px` }}
                  autoFocus
                />
              </>
            )}
          </div>
          <div className="flex justify-center mt-5 gap-6 flex-wrap">
          <button
              onClick={handleCompletion}
              disabled={!startTime || isCompleted}
              className="bg-green-600 hover:bg-green-700 cursor-pointer text-lg disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-1 rounded shadow font-semibold w-full"
            >
              Submit
            </button>
            
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
            {/* <button
              onClick={handleCompletion}
              disabled={!startTime || isCompleted}
              className="bg-green-600 hover:bg-green-700 cursor-pointer text-lg disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-1 rounded shadow font-semibold w-full"
            >
              Submit
            </button> */}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full text-white p-3 fixed top-0 mt-[-15] left-0 z-50 bg-[#290c52] bg-[url('/bg.jpg')] bg-cover bg-top bg-no-repeat">
          <div className="flex flex-col items-center space-y-1 mt-[-18]">
            {/* User Profile */}
            <div className="mb-4 absolute top-10 left-2">
              <img
                src={userProfileUrl}
                alt={userName}
                className="w-20 h-20 md:w-30 md:h-25 rounded-md border-2 border-white"
                onError={(e) => {
                  e.target.src = "/lo.jpg";
                }}
              />
              <p className="font-semibold text-xs text-center">{userName}</p>
            
               
  
            </div>
            {/* <div className="w-24 h-9 rounded-lg overflow-hidden mx-auto text-center mt-10 md:mt-5 pt-0 md:pt-0 shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
              <div className="bg-white text-black text-sm font-bold">
                {isCompleted ? formatClock(elapsedTime) : formatClock(timeRemaining)}
              </div>
            </div> */}
            <div className="grid grid-cols-2 gap-3 mt-10 w-[40%] md:w-full text-center">
              {[{ label: "Correct", value: correctWords.length, color: "text-green-600" },
                { label: "Wrong", value: wrongWords.length, color: "text-red-500" },
                { label: "Total", value: words.length, color: "text-[#290c52]" },
                { label: "Backspace", value: backspaceCount, color: "text-blue-500" }].map(({ label, value, color }, i) => (
                  <div key={i} className="w-full h-9 rounded-lg overflow-hidden shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
                    <div className="bg-black text-white text-[10px] font-semibold py-[1px]">{label}</div>
                    <div className={`bg-white ${color} text-sm font-bold`}>{value}</div>
                  </div>
                ))}
            </div>
            <div className="w-[40%] h-9 rounded-lg overflow-hidden mx-auto text-center mt-3 md:mt-5 pt-0 md:pt-0 shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
              <div className="bg-white text-black text-sm font-bold">
                {isCompleted ? formatClock(elapsedTime) : formatClock(timeRemaining)}
              </div>
            </div>
            {isCompleted && (
              <div className="mt-3 text-center">
                <div className="bg-white text-black px-4 py-2 rounded-lg shadow-md">
                  <div className="text-xs font-semibold mb-1">Accuracy</div>
                  <div className="text-lg font-bold text-green-600">{accuracy}%</div>
                </div>
              </div>
            )}

            {/* Speedometer */}
            <div className="mt-4 absolute bottom-13 right-2">
              <div className="border-6 border-black rounded-full mt-2">
                <div className="relative w-20 h-20 bg-black rounded-full border-4 border-white flex items-center justify-center">
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

            {/* Font Size Controls */}
              
                <button
                  onClick={decreaseFont}
                  className="bg-white absolute top-35 left-4 text-black border-3 cursor-pointer border-black px-5 py-[2px] text-xs rounded-md"
                >
                  A -
                </button>
                <button
                  onClick={increaseFont}
                  className="bg-white absolute top-35 right-5 text-black cursor-pointer border-3 border-black px-5 py-[2px] text-xs rounded-md"
                >
                  A +
                </button>
            
            
          </div>
        </div>
      </div>
    </>
  );
}

// Landscape View Component (Mobile Landscape)
function LandscapeView({
  content,
  loading,
  typedText,
  handleChange,
  isPaused,
  isCompleted,
  renderColoredWords,
  fontSize,
  handleReset,
  togglePause,
  handleCompletion,
  startTime,
  wpm,
  accuracy,
  elapsedTime,
  correctWords,
  handleDownloadPDF,
  formatClock,
  words,
  wrongWords,
  backspaceCount,
  backspaceLimit,
  userName,
  userProfileUrl,
  wordRefs,
  containerRef,
  increaseFont,
  decreaseFont,
  textareaRef
}) {
  return (
    <>
      <button className="fixed md:hidden right-2 top-2 z-[9999] border-2 border-gray-600 text-white bg-red-500 hover:bg-red-600 rounded-md shadow-lg" style={{ padding: '0.8vh 2vw', fontSize: 'clamp(9px, 1.8vw, 12px)', minHeight: '4vh', position: 'fixed', zIndex: 9999 }}>
        <a href="/skill_test" className="font-semibold">close</a>
      </button>
      <div className="landscape-mobile-container">

      <div className="flex flex-row gap-6">
        {/* Typing Area */}
        <div className="landscape-mobile-typing-area ml-26 " style={{ flex: '1', overflowY: 'auto', padding: '0.5vh 0.5vw', height: '100vh', width: 'calc(90vw - 18vw)', maxWidth: 'calc(100vw - 18vw)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Stats row at header */}
          <div className="flex gap-x-4  justify-center items-center w-full" style={{ marginBottom: '5vh', flexWrap: 'wrap', gap: '1vw' }}>
            {[{ label: "Correct", value: correctWords.length, color: "text-green-600" },
              { label: "Wrong", value: wrongWords.length, color: "text-red-500" },
              { label: "Total", value: words.length, color: "text-[#290c52]" },
              { label: "Backspace", value: backspaceCount, color: "text-blue-500" }].map(({ label, value, color }, i) => (
                <div key={i} className="w-24 h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]" style={{ flexShrink: 0 }}>
                  <div className="bg-black text-white text-[10px] font-semibold py-[1px]">{label}</div>
                  <div className={`bg-white ${color} text-sm font-bold`}>{value}</div>
                </div>
              ))}
          </div>

          <div className="bg-white p-2 rounded-xl shadow-lg" style={{ width: '95%', maxWidth: '95%', padding: '1vh 1vw', marginLeft: 'auto', marginRight: 'auto' }}>
            {/* Results Display */}
            {isCompleted && (
              <div className="mb-6 bg-green-50 p-4 rounded-lg border-2 border-green-500" style={{ padding: '1.5vh 1.5vw', marginBottom: '1vh' }}>
                <h2 className="text-xl font-bold text-green-800 mb-3" style={{ fontSize: 'clamp(12px, 2.5vw, 18px)', marginBottom: '1vh' }}>Test Completed!</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3" style={{ gap: '1vw', marginBottom: '1vh' }}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>{wpm}</div>
                    <div className="text-sm text-green-700" style={{ fontSize: 'clamp(9px, 1.8vw, 12px)' }}>WPM</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>{accuracy}%</div>
                    <div className="text-sm text-green-700" style={{ fontSize: 'clamp(9px, 1.8vw, 12px)' }}>Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>{formatClock(elapsedTime)}</div>
                    <div className="text-sm text-green-700" style={{ fontSize: 'clamp(9px, 1.8vw, 12px)' }}>Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600" style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>{correctWords.length}</div>
                    <div className="text-sm text-green-700" style={{ fontSize: 'clamp(9px, 1.8vw, 12px)' }}>Correct</div>
                  </div>
                </div>
                <div className="flex gap-3 justify-center" style={{ gap: '1vw' }}>
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                    style={{ padding: '1vh 2.5vw', fontSize: 'clamp(10px, 2vw, 14px)', minHeight: '4.5vh' }}
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={handleReset}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                    style={{ padding: '1vh 2.5vw', fontSize: 'clamp(10px, 2vw, 14px)', minHeight: '4.5vh' }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8" style={{ padding: '2vh 0' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" style={{ width: '4vw', height: '4vw', minWidth: '30px', minHeight: '30px' }}></div>
                <p style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>Loading exercise content...</p>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-8 text-gray-500" style={{ padding: '2vh 0', fontSize: 'clamp(10px, 2vw, 14px)' }}>
                <p>No content available for this exercise.</p>
              </div>
            ) : (
              <>
                <div className="text-sm leading-tight mb-4 overflow-y-auto min-h-[180px] max-h-[250px] mt-4 break-words font-sans w-full" style={{ minHeight: '30vh', maxHeight: '25vh', fontSize: 'clamp(10px, 2vw, 14px)', lineHeight: '1.2', width: '100%', maxWidth: '100%' }}>
                  {renderColoredWords(true)}
                </div>
                <textarea
                  ref={textareaRef}
                  value={typedText}
                  onChange={handleChange}
                  disabled={isPaused || isCompleted}
                  className="w-full auto-focus min-h-[150px] max-h-[180px] p-2 border-t border-gray-400 rounded-md focus:outline-none mt-4 disabled:opacity-50"
                  placeholder="Type Here..."
                  style={{ fontSize: `clamp(10px, 2vw, ${fontSize}px)`, minHeight: '18vh', maxHeight: '15vh', padding: '1vh 1vw', width: '100%' }}
                  autoFocus
                />
              </>
            )}
          </div>
          <div className="flex justify-center mt-2 gap-6 flex-wrap" style={{ marginTop: '4vh', gap: '1vw' }}>
            <button
              onClick={handleReset}
              className="bg-pink-500 text-lg cursor-pointer hover:bg-orange-500 text-white px-8 py-1 rounded shadow"
              style={{ padding: '1vh 3vw', fontSize: 'clamp(10px, 2vw, 14px)', minHeight: '5vh' }}
            >
              Reset
            </button>
            <button
              onClick={togglePause}
              disabled={isCompleted}
              className="bg-blue-600 cursor-pointer text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-1 rounded shadow"
              style={{ padding: '1vh 3vw', fontSize: 'clamp(10px, 2vw, 14px)', minHeight: '5vh' }}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={handleCompletion}
              disabled={!startTime || isCompleted}
              className="bg-green-600 hover:bg-green-700 cursor-pointer text-lg disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-1 rounded shadow font-semibold"
              style={{ padding: '1vh 3vw', fontSize: 'clamp(10px, 2vw, 14px)', minHeight: '5vh' }}
            >
              Submit
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="landscape-mobile-sidebar text-white bg-[#290c52] bg-[url('/bg.jpg')] bg-cover bg-top bg-no-repeat" style={{ width: '18vw', minWidth: '18vw', maxWidth: '18vw', height: '100vh', padding: '1vh 1vw' }}>
          <div className="flex flex-col items-center justify-center h-full">
            {/* User Profile */}
            <div className="mb-4 absolute top-14.5 left-4">
              <img
                src={userProfileUrl}
                alt={userName}
                className="w-24 h-24 rounded-md border-2 border-white"
                style={{ width: 'clamp(60px, 12vw, 80px)', height: 'clamp(60px, 12vw, 80px)' }}
                onError={(e) => {
                  e.target.src = "/lo.jpg";
                }}
              />
              <p className="font-semibold text-xs text-center text-white" style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', marginTop: '0.5vh' }}>{userName}</p>
            </div>
            {/* Speedometer */}
            <div className="mt-4 absolute top-8 right-1">
              <div className="border-6 border-black rounded-full mt-2">
                <div className="relative w-20 h-20 bg-black rounded-full border-4 border-white flex items-center justify-center" style={{ width: 'clamp(60px, 12vw, 80px)', height: 'clamp(60px, 12vw, 80px)' }}>
                  <div className="absolute left-1 text-red-500 text-[6px] font-bold tracking-widest" style={{ fontSize: 'clamp(6px, 1vw, 8px)' }}>SPEED</div>
                  <svg width="100" height="100" viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
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
                  <span className="absolute bottom-5 text-red-500 font-bold text-xs" style={{ fontSize: 'clamp(8px, 1.2vw, 10px)' }}>{wpm}</span>
                </div>
              </div>
            </div>

            {/* Font Size Controls */}
            <p className="text-white text-xs font-semibold absolute top-43 right-6">Font size</p>
                <button
                  onClick={decreaseFont}
                  className="bg-white absolute top-57 right-7 text-black border-3 cursor-pointer border-black rounded-md"
                  style={{ padding: '0.8vh 1.5vw', fontSize: 'clamp(10px, 1.5vw, 14px)', minHeight: '4vh', minWidth: '5vw' }}
                >
                  A -
                </button>
                <button
                  onClick={increaseFont}
                  className="bg-white absolute top-48 right-7 text-black cursor-pointer border-3 border-black rounded-md"
                  style={{ padding: '0.8vh 1.5vw', fontSize: 'clamp(10px, 1.5vw, 14px)', minHeight: '4vh', minWidth: '5vw' }}
                >
                  A +
                </button>
             
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

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

            // Remove all line breaks from uploaded content and join into continuous text
            if (exerciseContent && exerciseContent.trim()) {
              // Remove all line breaks and normalize whitespace
              const normalizedContent = exerciseContent
                .replace(/\r\n/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              
              // Store as single continuous line - browser will wrap naturally based on container width
              setContent([normalizedContent]);
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
  const textareaRef = useRef(null);

  // Auto-focus textarea when content is loaded and ready
  useEffect(() => {
    if (!loading && content.length > 0 && textareaRef.current && !isPaused && !isCompleted) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, content, isPaused, isCompleted]);

  // Detect mobile and landscape orientation
  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // More robust mobile detection - check for touch device or small screen
      const isMobileDevice = width < 768 || 
                            (navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i)) ||
                            ('ontouchstart' in window);
      
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        // Multiple checks for landscape orientation
        const isLandscapeMode = 
          width > height || // Width greater than height
          (window.orientation !== undefined && (Math.abs(window.orientation) === 90 || Math.abs(window.orientation) === -90)) || // Orientation API
          (screen.orientation && screen.orientation.angle % 180 !== 0) || // Screen Orientation API
          (width / height > 1.2); // Aspect ratio check
        
        setIsLandscape(isLandscapeMode);
      } else {
        setIsLandscape(false);
      }
    };

    // Initial check
    checkMobileAndOrientation();
    
    // Listen for resize events (throttled for performance)
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobileAndOrientation, 100);
    };
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation changes with multiple event types for better compatibility
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobileAndOrientation, 200);
    });
    
    // Screen orientation API (more reliable on modern devices)
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        setTimeout(checkMobileAndOrientation, 200);
      });
    }
    
    // Also check on focus (handles device rotation while app is in background)
    window.addEventListener('focus', checkMobileAndOrientation);
    
    // Periodic check as fallback for devices that don't fire events properly (every 2 seconds)
    const intervalId = setInterval(() => {
      checkMobileAndOrientation();
    }, 2000);

    return () => {
      clearTimeout(resizeTimeout);
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkMobileAndOrientation);
      window.removeEventListener('focus', checkMobileAndOrientation);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', checkMobileAndOrientation);
      }
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
    // Re-focus textarea after reset
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const togglePause = () => {
    setIsPaused((prev) => {
      const newPaused = !prev;
      // Focus textarea when resuming
      if (!newPaused && !isCompleted) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
      return newPaused;
    });
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

  const renderColoredWords = (isLandscapeMode = false) => {
    let pointer = 0;
    return content.map((line, lineIndex) => {
      const lineWords = line.trim().split(/\s+/);
      return (
        <p
          key={lineIndex}
          className="mb-0 break-words w-full"
          style={isLandscapeMode ? { 
            fontSize: `clamp(10px, 2vw, ${fontSize}px)`, 
            height: 'auto', 
            minHeight: 'auto', 
            marginBottom: '0.2vh',
            lineHeight: '1.2',
            width: '100%',
            maxWidth: '100%'
          } : { 
            fontSize: `${fontSize}px`,
            lineHeight: '1.2',
            width: '100%',
            maxWidth: '100%'
          }}
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
                className={`${className} mr-1 inline-block`}
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

  // Common props for all views
  const commonProps = {
    content,
    loading,
    typedText,
    handleChange,
    isPaused,
    isCompleted,
    renderColoredWords,
    fontSize,
    handleReset,
    togglePause,
    handleCompletion,
    startTime,
    wpm,
    accuracy,
    elapsedTime,
    correctWords,
    handleDownloadPDF,
    formatClock,
    timeRemaining,
    words,
    wrongWords,
    backspaceCount,
    wordRefs,
    containerRef,
    userName,
    userProfileUrl,
    backspaceLimit,
    increaseFont,
    decreaseFont,
    textareaRef
  };

  return (
    <div className="min-h-screen bg-[#290c52] bg-[url('/bg.jpg')] mt-30 md:mt-0  bg-cover bg-center bg-no-repeat px-4 py-6 md:px-14 md:py-12 md:mx-8 md:my-8 rounded-[0px] md:rounded-[100px] typing-background-container">
      <style jsx>{`
        @media (max-width: 767px) and (orientation: portrait) {
          html, body {
            overflow: hidden !important;
            height: 100vh !important;
            position: fixed !important;
            width: 100% !important;
          }
          .typing-background-container {
            height: 100vh !important;
            overflow: hidden !important;
            position: fixed !important;
            width: 100vw !important;
          }
          /* Hide scrollbar for sidebar in mobile */
          .w-full.text-white::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .w-full.text-white {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          /* Keep typing box scrollable but hide its scrollbar */
          .overflow-y-auto::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .overflow-y-auto {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
        }
        @media (max-width: 1024px) and (orientation: landscape),
               (max-width: 767px) and (orientation: landscape),
               (max-height: 600px) and (orientation: landscape),
               (max-height: 500px) and (min-aspect-ratio: 1/1) {
          html, body {
            height: 100vh !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            position: fixed !important;
          }
          /* Remove rounded corners and make full width in landscape mobile view */
          .typing-background-container {
            border-radius: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100vw !important;
            min-height: 100vh !important;
          }
          /* Close button in landscape - ensure visibility */
          button[class*="fixed"][class*="md:hidden"] {
            position: fixed !important;
            z-index: 9999 !important;
            display: block !important;
            visibility: visible !important;
          }
          /* Landscape mobile layout adjustments */
          .landscape-mobile-container {
            display: flex !important;
            flex-direction: row !important;
            height: 100vh !important;
            width: 100vw !important;
            overflow: hidden !important;
            max-width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .landscape-mobile-typing-area {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 0.5vh 0.5vw !important;
            height: 100vh !important;
            width: calc(100vw - 18vw) !important;
            max-width: calc(100vw - 18vw) !important;
          }
          .landscape-mobile-sidebar {
            width: 18vw !important;
            min-width: 18vw !important;
            max-width: 18vw !important;
            flex-shrink: 0 !important;
            overflow-y: auto !important;
            height: 100vh !important;
            padding: 1vh 1vw !important;
          }
          /* Hide user profile in landscape mobile view */
          .user-profile-landscape {
            display: none !important;
          }
          /* Hide font size buttons in landscape mobile view */
          .font-size-buttons-landscape {
            display: none !important;
          }
          /* Typing area content container */
          .landscape-mobile-typing-area > div {
            width: 100% !important;
            max-width: 100% !important;
            padding: 1vh 1vw !important;
            margin: 0 !important;
          }
          /* Text display area in landscape */
          .landscape-mobile-typing-area .text-sm {
            min-height: 20vh !important;
            max-height: 25vh !important;
            font-size: clamp(10px, 2vw, 14px) !important;
            line-height: 1.4 !important;
          }
          /* Textarea in landscape */
          .landscape-mobile-typing-area textarea {
            min-height: 12vh !important;
            max-height: 15vh !important;
            font-size: clamp(10px, 2vw, 14px) !important;
            padding: 1vh 1vw !important;
            width: 100% !important;
          }
          /* Buttons container in landscape */
          .landscape-mobile-typing-area ~ div {
            margin-top: 1vh !important;
            gap: 1vw !important;
          }
          /* Button sizes in landscape */
          .landscape-mobile-typing-area ~ div button {
            padding: 1vh 3vw !important;
            font-size: clamp(10px, 2vw, 14px) !important;
            min-height: 5vh !important;
          }
          /* Stats cards in landscape sidebar */
          .landscape-mobile-sidebar > div > div {
            width: 100% !important;
            max-width: 100% !important;
            height: 5vh !important;
            min-height: 5vh !important;
            margin-bottom: 0.5vh !important;
          }
          .landscape-mobile-sidebar > div > div > div:first-child {
            font-size: clamp(8px, 1.5vw, 10px) !important;
            padding: 0.3vh 0 !important;
          }
          .landscape-mobile-sidebar > div > div > div:last-child {
            font-size: clamp(10px, 2vw, 14px) !important;
            padding: 0.5vh 0 !important;
          }
          /* Timer boxes in landscape */
          .landscape-mobile-sidebar .flex.gap-2 {
            gap: 0.5vw !important;
            margin-top: 0.5vh !important;
          }
          .landscape-mobile-sidebar .flex.gap-2 > div {
            height: 5vh !important;
            min-height: 5vh !important;
            flex: 1 !important;
          }
          .landscape-mobile-sidebar .flex.gap-2 > div > div:first-child {
            font-size: clamp(8px, 1.5vw, 10px) !important;
            padding: 0.3vh 0 !important;
          }
          .landscape-mobile-sidebar .flex.gap-2 > div > div:last-child {
            font-size: clamp(10px, 2vw, 14px) !important;
            padding: 0.5vh 0 !important;
          }
          /* Close button in landscape */
          .landscape-mobile-sidebar button,
          .landscape-mobile-typing-area ~ button {
            padding: 0.8vh 2vw !important;
            font-size: clamp(9px, 1.8vw, 12px) !important;
            min-height: 4vh !important;
          }
          /* Word line height in landscape */
          .landscape-mobile-typing-area p {
            height: auto !important;
            min-height: 3vh !important;
            margin-bottom: 0.3vh !important;
            font-size: clamp(10px, 2vw, 14px) !important;
          }
          /* Completed test message in landscape */
          .landscape-mobile-typing-area .bg-green-50 {
            padding: 1.5vh 1.5vw !important;
            margin-bottom: 1vh !important;
          }
          .landscape-mobile-typing-area .bg-green-50 h2 {
            font-size: clamp(12px, 2.5vw, 18px) !important;
            margin-bottom: 1vh !important;
          }
          .landscape-mobile-typing-area .bg-green-50 .grid {
            gap: 1vw !important;
            margin-bottom: 1vh !important;
          }
          .landscape-mobile-typing-area .bg-green-50 .text-2xl {
            font-size: clamp(14px, 3vw, 20px) !important;
          }
          .landscape-mobile-typing-area .bg-green-50 .text-sm {
            font-size: clamp(9px, 1.8vw, 12px) !important;
          }
          .landscape-mobile-typing-area .bg-green-50 button {
            padding: 1vh 2.5vw !important;
            font-size: clamp(10px, 2vw, 14px) !important;
            min-height: 4.5vh !important;
          }
          /* Loading spinner in landscape */
          .landscape-mobile-typing-area .animate-spin {
            width: 4vw !important;
            height: 4vw !important;
            min-width: 30px !important;
            min-height: 30px !important;
          }
          /* Ensure all text is readable in landscape */
          .landscape-mobile-typing-area,
          .landscape-mobile-sidebar {
            font-size: clamp(10px, 2vw, 14px) !important;
          }
          /* Scrollbar styling for landscape */
          .landscape-mobile-typing-area::-webkit-scrollbar,
          .landscape-mobile-sidebar::-webkit-scrollbar {
            width: 0.5vw !important;
          }
          .landscape-mobile-typing-area::-webkit-scrollbar-thumb,
          .landscape-mobile-sidebar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3) !important;
            border-radius: 0.25vw !important;
          }
        }
      `}</style>
      <div className={`max-w-7xl mx-auto mt-30 md:mt-15 ${isMobile && isLandscape ? "landscape-mobile-container" : ""}`}>
        {!isMobile ? (
          <DesktopView {...commonProps} />
        ) : isLandscape ? (
          <LandscapeView {...commonProps} />
        ) : (
          <PortraitView {...commonProps} />
        )}
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