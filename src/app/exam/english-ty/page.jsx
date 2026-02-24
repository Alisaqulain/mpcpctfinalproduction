"use client";
import React, { useState, useRef, useEffect } from "react";

export default function EnglishTypingPage() {
  const fullText = `One Lorem ipsumur dolor sitae amet consectetur adipisicing eliture Auture commodi beatae laboriosam voluptatem molestiae fuga error velit autem quam labore sunt ipsa provident eaque Doloribus tenetur explicabo alias architecto minus Maxime adipisci ipsa at iure ut sapiente odit dolor dolore expedita`;
  const words = fullText.split(" ");

  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [errors, setErrors] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const wordRefs = useRef([]);
  const tickRef = useRef(null);

  const elapsedSeconds = 15 * 60 - timeLeft;
  const wpm = elapsedSeconds > 0 ? Math.floor((correctWords / elapsedSeconds) * 60) : 0;

  // ✅ Initialize Audio only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      tickRef.current = new Audio("/tick.wav");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        if (isSoundOn && tickRef.current) {
          try {
            tickRef.current.currentTime = 0;
            tickRef.current.play();
          } catch (err) {
            console.warn("Tick sound failed", err);
          }
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSoundOn]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hh}:${mm}:${ss}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    const lastChar = value.slice(-1);
    setTypedText(value);

    if (lastChar === " ") {
      const inputWord = value.trim().split(" ").at(-1);
      const correctWord = words[currentIndex] || "";

      if (inputWord === correctWord) {
        setCorrectWords((c) => c + 1);
      } else {
        setErrors((e) => e + 1);
      }

      setCurrentIndex((i) => {
        const nextIndex = i + 1;
        const nextWordEl = wordRefs.current[nextIndex];
        if (nextWordEl && containerRef.current) {
          nextWordEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start",
          });
        }
        return nextIndex;
      });
    }

    setKeystrokes((k) => k + 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      setBackspaces((b) => b + 1);
    }
  };

  const getWordClass = (word, i) => {
    const typedWords = typedText.trim().split(" ");
    if (i < currentIndex) {
      return typedWords[i] === word ? "text-green-600" : "text-red-600";
    }
    if (i === currentIndex) {
      return "bg-blue-700 text-white p-1 rounded";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-white p-2">
      <div className="bg-[#290c52] text-yellow-400 p-2 text-lg font-bold">CPCTMASTER 2025</div>

      <div className="bg-white flex flex-col sm:flex-row items-center justify-between p-2 border-b">
        <div className="bg-white-50 border-gray-300 px-4 py-4 flex gap-2 text-xs flex-wrap justify-center sm:justify-start">
          <button className="text-[12px] text-[#000] px-2 py-3 border-1 border-gray-300 rounded">CPCT Actual</button>
          <button className="border px-2 py-2 rounded text-[#fff] font-semibold border-gray-300 bg-[#290c52]">English Typing</button>
          <button className="border px-3 py-1 rounded border-gray-300">हिंदी टाइपिंग</button>
        </div>

        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <button
            onClick={() => setIsSoundOn((prev) => !prev)}
            className={`flex items-center px-2 py-1 rounded text-sm font-semibold ${
              isSoundOn ? "bg-blue-200 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {isSoundOn ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>

          <div className="flex items-center space-x-2">
            <span>Time -</span>
            <div className="bg-blue-400 px-2 py-1 rounded text-sm font-semibold">
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")} : {String(timeLeft % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 bg-white p-4 order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-[#290c52] text-white p-2 rounded">
            <div>English Typing</div>
            <div className="flex items-center mt-2 sm:mt-0">
              <span className="mr-2">Keyboard:</span>
              <select className="text-black rounded border border-gray-300 bg-[#fff]">
                <option>English</option>
              </select>
            </div>
          </div>

          <div ref={containerRef} className="border p-2 mt-5 overflow-y-auto h-48 rounded border-gray-300 leading-relaxed text-[18px] md:text-[21px] space-y-1">
            {Array.from({ length: Math.ceil(words.length / 10) }).map((_, rowIndex) => {
              const rowWords = words.slice(rowIndex * 10, rowIndex * 10 + 12);
              return (
                <div key={rowIndex} className="border-b-2 border-gray-200 pb-2 mb-2 font-serif">
                  {rowWords.map((word, i) => {
                    const actualIndex = rowIndex * 10 + i;
                    return (
                      <span
                        key={actualIndex}
                        ref={(el) => (wordRefs.current[actualIndex] = el)}
                        className={`mr-3 ${getWordClass(word, actualIndex)}`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <textarea
            ref={inputRef}
            value={typedText}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 p-2 mt-4 rounded h-[150px] text-lg md:text-xl"
            placeholder="Type Here ..."
          ></textarea>
        </div>

        <div className="w-full lg:w-60 bg-blue-50 p-4 border-l h-auto lg:h-[520px] order-1 lg:order-2">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full mb-2 overflow-hidden">
              <img src="/lo.jpg" alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="text-gray-700 font-semibold">Anas</div>
            <span className="border w-full border-black mt-2"></span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-4 text-sm">
            {[{ label: "Correct Word", value: correctWords, color: "text-green-700" },
              { label: "Wrong Word", value: errors, color: "text-red-600" },
              { label: "Total Word Count", value: words.length, color: "text-gray-800" },
              { label: "Keystrokes Count", value: keystrokes, color: "text-blue-600" },
              { label: "Backspace Count", value: backspaces, color: "text-orange-600" },
              { label: "Pending Word", value: words.length - currentIndex, color: "text-purple-700" }].map((item, i) => (
              <div
                key={i}
                className="w-full h-9 mt-2 rounded-lg overflow-hidden mx-auto shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]"
              >
                <div className="bg-black text-center text-white text-[9px] font-semibold py-[1px]">{item.label}</div>
                <div className={`bg-white text-center ${item.color || "text-black"} text-[12px] font-bold`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="ml-12 pt-5 rounded-full mt-2">
              <div className="relative w-24 h-24 bg-black rounded-full border-4 border-gray-700 flex items-center justify-center">
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
                      <text
                        key={i}
                        x={x}
                        y={y}
                        fontSize="10"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {(i + 1) * 10}
                      </text>
                    );
                  })}
                </svg>
                <span className="absolute bottom-5 text-red-500 font-bold text-xs">{wpm}</span>
              </div>
            </div>
          </div>

          <button className="bg-green-800 text-white w-full mt-4 lg:mt-6 p-2 rounded">
            <a href="/exam/english-result">Submit Section</a>
          </button>
        </div>
      </div>
    </div>
  );
}
