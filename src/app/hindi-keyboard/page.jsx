"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";

export default function App() {
  const [hand, setHand] = useState(true);
  const [sound, setSound] = useState(true);
  const [keyboard, setKeyboard] = useState(true);
  const [pressedKey, setPressedKey] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [timer, setTimer] = useState(180);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef(null);

  const highlightedKeys = ["अ", "स", "ड", "फ", "Space", "ज", "क", "ल", ";", "Space"];
  const [keyStatus, setKeyStatus] = useState(Array(highlightedKeys.length).fill(null));

  const correctCount = currentIndex;
  const wrongCount = keyStatus.filter(status => status === "wrong").length;
  const totalCount = highlightedKeys.length;
  const wpm = elapsedTime > 0 ? Math.round((correctCount / elapsedTime) * 60) : 0;

  const fingerMap = {
    "अ": "pinky",
    "स": "ring",
    "ड": "middle",
    "फ": "index-left",
    "Space": "thumb",
    "ज": "index-right",
    "क": "middle-right",
    "ल": "ring-right",
    ";": "pinky-right"
  };

  const keys = [
    ["ञ", "१", "२", "३", "४", "५", "६", "७", "८", "९", "०", "-", "ृ", "Backspace"],
    ["Tab", "ौ", "ै", "ा", "ी", "ू", "ब", "ह", "ग", "द", "ज", "ड", "़", "\\"],
    ["Caps", "ो", "े", "्", "ि", "ु", "प", "र", "क", "त", "च", "ट", "Enter"],
    ["Shift", "ं", "म", "न", "व", "ल", "स", "य", "श", "ष", "।", "Shift"],
    ["Ctrl", "Win", "Alt", "Space", "Alt", "Win", "Menu", "Ctrl"]
  ];

  useEffect(() => {
    const checkIfMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobile(isMobile);
      if (isMobile && inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (isMobile && inputRef.current) {
      const handleBlur = () => {
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      };
      
      inputRef.current.addEventListener('blur', handleBlur);
      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('blur', handleBlur);
        }
      };
    }
  }, [isMobile]);

  const getKeyWidth = (key) => {
    switch (key) {
      case "Backspace": return isMobile ? "w-[80px]" : "w-[145px]";
      case "Tab": return isMobile ? "w-[60px]" : "w-[110px]";
      case "Caps": return isMobile ? "w-[70px]" : "w-[90px]";
      case "Enter": return isMobile ? "w-[80px]" : "w-[145px]";
      case "Shift": return isMobile ? "w-[90px]" : "w-[142px]";
      case "Ctrl":
      case "Alt":
      case "Win":
      case "Menu": return isMobile ? "w-[40px]" : "w-[60px]";
      case "\\": return isMobile ? "w-[50px]" : "w-[80px]";
      case "Space": return "flex-1";
      default: return isMobile ? "w-[30px]" : "w-[45px]";
    }
  };

  const normalizeKey = (key) => {
    if (key === " ") return "Space";
    if (key === "Control") return "Ctrl";
    if (key === "AltGraph") return "Alt";
    if (key === "OS" || key === "Meta") return "Win";
    if (key === "ContextMenu") return "Menu";
    if (key.length === 1) return key;
    return key;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev <= 0 ? 0 : prev - 1));
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (currentIndex >= highlightedKeys.length) return;
    const normalizedKey = normalizeKey(e.key);

    if (e.key === "Backspace") setBackspaceCount(prev => prev + 1);
    if (e.key === ' ' || highlightedKeys.includes(normalizedKey)) e.preventDefault();

    setPressedKey(normalizedKey);
    const expectedKey = highlightedKeys[currentIndex];
    const isCorrect = normalizedKey === expectedKey;
    const newKeyStatus = [...keyStatus];
    newKeyStatus[currentIndex] = isCorrect ? 'correct' : 'wrong';
    setKeyStatus(newKeyStatus);

    if (isCorrect) setCurrentIndex(prev => prev + 1);

    const totalAttempts = currentIndex + (isCorrect ? 1 : 0) + wrongCount;
    setAccuracy(Math.round(((currentIndex + (isCorrect ? 1 : 0)) / totalAttempts) * 100));

    if (sound) {
      const audio = new Audio(isCorrect ? '/correct.mp3' : '/wrong.mp3');
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [currentIndex, keyStatus, wrongCount, sound]);

  const handleKeyUp = useCallback(() => setPressedKey(""), []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyPress, handleKeyUp]);

  const resetStats = () => {
    setCurrentIndex(0);
    setAccuracy(100);
    setKeyStatus(Array(highlightedKeys.length).fill(null));
    setTimer(180);
    setElapsedTime(0);
    setBackspaceCount(0);
    setPressedKey("");
    if (isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatClock = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      className={`min-h-screen p-4 flex flex-col md:flex-row gap-6 ${
        isDarkMode ? "bg-gradient-to-br from-black to-gray-900 text-white" : "bg-white text-black"
      }`}
      tabIndex={0}
    >
      {/* Hidden input for mobile keyboard */}
      <input
        type="text"
        ref={inputRef}
        className="absolute opacity-0 h-0 w-0"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* Mobile-only elements */}
      <style jsx>{`
        @media (max-width: 767px) {
          .mobile-scale {
            transform: scale(0.9);
            transform-origin: top center;
            width: 100%;
          }
          .mobile-stack {
            flex-direction: column;
          }
          .mobile-small-text {
            font-size: 0.8rem;
          }
          .mobile-tight-gap {
            gap: 0.5rem;
          }
          .mobile-small-key {
            width: ${isMobile ? '40px' : '60px'} !important;
            height: ${isMobile ? '40px' : '60px'} !important;
            font-size: ${isMobile ? '1rem' : '1.2rem'} !important;
          }
          .mobile-space-key {
            width: ${isMobile ? '80px' : '120px'} !important;
            height: ${isMobile ? '30px' : '40px'} !important;
          }
          .hand-image {
            display: none !important;
          }
          .mobile-keyboard {
            padding: 8px !important;
          }
          .mobile-key {
            height: ${isMobile ? '36px' : '48px'} !important;
            font-size: ${isMobile ? '0.7rem' : '0.9rem'} !important;
          }
        }
      `}</style>

      {/* Theme Toggle Button */}
      <div className={`absolute ${isMobile ? 'top-82 right-0' : 'top-75 right-14'} z-50 cursor-pointer`}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`px-3 py-1 rounded shadow text-sm ${
            isDarkMode ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          Toggle Theme
        </button>
      </div>

      {/* Left Section */}
      <div className="flex-1 flex flex-col items-center gap-6 mobile-stack">
        <div className="flex gap-2 flex-wrap justify-center mobile-tight-gap">
          {highlightedKeys.map((key, index) => (
            <div
              key={index}
              className={`${
                key === "Space" ? "w-28 h-10 mt-2 mobile-space-key" : "w-16 h-14 mobile-small-key"
              } rounded flex items-center justify-center text-xl font-semibold mobile-small-text
                ${index === currentIndex ? "border-yellow-400" : ""}
                ${key === "ज" ? "md:ml-10" : ""}
                ${keyStatus[index] === 'correct' ? "bg-green-600 border-green-600" :
                  keyStatus[index] === 'wrong' ? "bg-red-600 border-red-600" :
                  isDarkMode ? "bg-black text-white border-white" : "bg-white text-black border-black"} 
                border`}
            >
              {key === "Space" ? "Space" : key}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-2 mobile-tight-gap mobile-small-text">
          {/* Hand Toggle */}
          <label className="flex items-center gap-0 md:gap-2">
            Hand
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
          <label className="flex items-center gap-0 md:gap-2">
            Sound
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
          <label className="flex items-center gap-0 md:gap-2">
            Keyboard
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
            className="ml-[0] md:ml-4 px-1 md:px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white mobile-small-text"
          >
            Reset
          </button>
        </div>

        {/* Keyboard */}
        {keyboard && (
          <div className={`relative mt-4 p-4 border border-gray-600 rounded-3xl shadow-md ${
            isDarkMode ? "bg-black" : "bg-gray-200"
          } mobile-scale mobile-keyboard`}>
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex mb-2">
                {row.map((key, keyIndex) => {
                  const isPressed = pressedKey === key;
                  const isCurrentKey = highlightedKeys[currentIndex] === key;
                  return (
                    <div
                      key={keyIndex}
                      className={`mobile-key h-12 ${getKeyWidth(key)} mx-0.5 rounded text-sm flex items-center justify-center 
                        border 
                        ${
                          key === "Backspace" ? "text-red-500" :
                          key === "Enter" ? "text-green-500" :
                          key === "Shift" ? "text-blue-500" :
                          key === "Ctrl" ? "text-yellow-400" :
                          key === "Space" ? "text-pink-400" :
                          key === "Caps" ? "text-green-500" :
                          key === "Tab" ? "text-blue-800" :
                          isDarkMode ? "text-white border-gray-600" : "text-black border-gray-400"
                        }
                        ${
                          isPressed ? "bg-white text-black" :
                          isCurrentKey ? "bg-yellow-400" :
                          isDarkMode ? "bg-gray-800" : "bg-white"
                        }`}
                    >
                      {key === "Space" ? "Space" : key}
                    </div>
                  );
                })}
              </div>
            ))}
            {hand && !isMobile && (
              <div className="absolute bottom-0 top-35 right-50 w-120 h-auto pointer-events-none hand-image">
                <img src="/hand.png" alt="Hand" className="w-full h-auto opacity-80" />
                {currentIndex < highlightedKeys.length && (
                  <div
                    className={`absolute w-8 h-8 rounded-full ${
                      keyStatus[currentIndex] === "wrong"
                        ? "bg-red-500"
                        : keyStatus[currentIndex] === "correct"
                        ? "bg-green-500"
                        : "bg-yellow-400"
                    } ${getFingerPosition(fingerMap[highlightedKeys[currentIndex]] || "thumb")}`}
                  ></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className={`flex flex-col items-center space-y-1 ${isMobile ? 'mt-4' : 'mt-15'} mobile-stack`}>
        <div className="flex flex-col items-center">
          <img
            src="/lo.jpg"
            alt="User"
            className={`${isMobile ? 'w-20 h-16' : 'w-30 h-25'} rounded-md border-2 border-white mobile-scale`}
          />
          <p className="font-semibold text-xs md:text-sm mt-1">Anas Ansari</p>
        </div>
        
        <div className={`w-24 h-9 rounded-lg overflow-hidden text-center mt-2 shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)] mobile-scale ${
          isMobile ? 'mx-auto' : 'mx-auto'
        }`}>
          <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
          <div className="bg-white text-black text-sm font-bold">{formatClock(elapsedTime)}</div>
        </div>
        
        <div className={`grid grid-cols-2 gap-y-6 mt-4 gap-x-4 md:gap-x-4 w-full text-center mobile-tight-gap ${
          isMobile ? 'px-4' : ''
        }`}>
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
        {!isMobile && (
          <div className="hidden lg:block mt-5 mobile-scale">
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