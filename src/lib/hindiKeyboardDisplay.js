/**
 * On-screen Hindi keyboard labels (QWERTY rows) for practice UI.
 * Typing conversion lives in hindiTyping.js — keep layouts in sync with CPCT charts.
 */

export const HINDI_KEYBOARD_ROWS = {
  "Remington Gail": [
    ["़", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ";", "ृ", "Backspace"],
    ["Tab", "ु", "ू", "म", "त", "ज", "ल", "न", "प", "व", "च", "ख", ",", "\\"],
    ["Caps", "ं", "े", "क", "ि", "ह", "ी", "र", "ा", "स", "य", "श्", "Enter"],
    ["Shift", "्र", "ग", "ब", "अ", "इ", "द", "उ", "ए", "ण्", "ध्", "Shift"],
    ["Ctrl", "Win", "Alt", "Space", "Alt", "Win", "Menu", "Ctrl"],
  ],
  Inscript: [
    ["ो", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "ृ", "Backspace"],
    ["Tab", "ौ", "ै", "ा", "ी", "ू", "ब", "ह", "ग", "द", "ज", "ड", "़", "ॉ"],
    ["Caps", "ो", "े", "्", "ि", "ु", "प", "र", "क", "त", "च", "ट", "Enter"],
    ["Shift", "ं", "म", "न", "व", "ल", "स", ",", ".", "य", "Shift"],
    ["Ctrl", "Win", "Alt", "Space", "Alt", "Win", "Menu", "Ctrl"],
  ],
};

export function getHindiKeyboardRows(scriptType = "Remington Gail") {
  return (
    HINDI_KEYBOARD_ROWS[scriptType] ||
    HINDI_KEYBOARD_ROWS["Remington Gail"]
  );
}
