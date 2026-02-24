"use client";
import React from "react";

const KEYBOARD_LAYOUT = {
  English: [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"]
  ],
  Hindi: {
    "Remington Gail": [
      ["ौ", "ै", "ा", "ी", "ू", "ब", "ह", "ग", "द", "ज", "ड", "़"],
      ["ो", "े", "्", "ि", "ु", "प", "र", "क", "त", "च", "ट"],
      ["्", "ं", "म", "न", "व", "ल", "स", ",", "।"]
    ],
    "Inscript": [
      ["ौ", "ै", "ा", "ी", "ू", "ब", "ह", "ग", "द", "ज", "ड"],
      ["ो", "े", "्", "ि", "ु", "प", "र", "क", "त", "च", "ट"],
      ["्", "ं", "म", "न", "व", "ल", "स"]
    ]
  }
};

const ROW_TYPES = {
  home: ["a", "s", "d", "f", "j", "k", "l", ";"],
  upper: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  lower: ["z", "x", "c", "v", "b", "n", "m"]
};

export default function VirtualKeyboard({ 
  language, 
  scriptType, 
  activeKey, 
  rowType,
  highlightRow = false 
}) {
  const getKeyboardLayout = () => {
    if (language === "English") {
      return KEYBOARD_LAYOUT.English;
    } else if (language === "Hindi" && scriptType) {
      return KEYBOARD_LAYOUT.Hindi[scriptType] || KEYBOARD_LAYOUT.Hindi["Inscript"];
    }
    return KEYBOARD_LAYOUT.English;
  };

  const layout = getKeyboardLayout();
  const rowKeys = rowType ? ROW_TYPES[rowType] : [];

  const isKeyInRow = (key) => {
    if (!rowType) return false;
    return rowKeys.some(rk => rk.toLowerCase() === key.toLowerCase());
  };

  const isKeyActive = (key) => {
    return activeKey && key.toLowerCase() === activeKey.toLowerCase();
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="flex flex-col items-center gap-2">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((key, keyIndex) => {
              const isActive = isKeyActive(key);
              const inRow = highlightRow && isKeyInRow(key);
              
              return (
                <div
                  key={keyIndex}
                  className={`
                    w-10 h-10 md:w-12 md:h-12 flex items-center justify-center
                    border-2 rounded font-semibold text-sm md:text-base
                    transition-all
                    ${
                      isActive
                        ? "bg-[#290c52] text-white border-[#290c52] scale-110 shadow-lg"
                        : inRow
                        ? "bg-yellow-200 border-yellow-400"
                        : "bg-white border-gray-300"
                    }
                  `}
                >
                  {key}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}






