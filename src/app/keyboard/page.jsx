"use client";
import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sun, Moon, RotateCw } from "lucide-react";
import { getLearningData, getLessonContent } from "@/lib/learningData";

function KeyboardApp() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");
  const language = searchParams.get("language") || "english";
  const subLanguage = searchParams.get("subLanguage") || "";

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
  const [leftHandImage, setLeftHandImage] = useState("/images/left-resting-hand.webp");
  const [rightHandImage, setRightHandImage] = useState("/images/right-resting-hand.webp");
  const inputRef = useRef(null);
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

  // Function to organize keys into rows: 4 alphabets + 1 space + 4 alphabets + 1 space
  const organizeKeysIntoRows = (keys) => {
    const rows = [];
    const nonSpaceKeys = keys.filter(k => k !== "Space");
    
    // If we have 4 or fewer keys, don't add any spaces - just return them as-is
    if (nonSpaceKeys.length <= 4) {
      return [nonSpaceKeys];
    }
    
    // Organize into rows: 4 alphabets + space + 4 alphabets + space
    for (let i = 0; i < nonSpaceKeys.length; i += 8) {
      const rowKeys = [];
      
      // First 4 alphabets
      for (let j = 0; j < 4 && i + j < nonSpaceKeys.length; j++) {
        rowKeys.push(nonSpaceKeys[i + j]);
      }
      
      // Check if there are more keys after the first 4
      const remainingKeys = nonSpaceKeys.length - (i + 4);
      
      // Only add first space if we have more than 4 keys total in this row
      if (remainingKeys > 0 && rowKeys.length === 4) {
        rowKeys.push("Space");
      }
      
      // Next 4 alphabets
      let hasSecondGroup = false;
      for (let j = 4; j < 8 && i + j < nonSpaceKeys.length; j++) {
        rowKeys.push(nonSpaceKeys[i + j]);
        hasSecondGroup = true;
      }
      
      // Only add second space if we have keys in the second group AND there might be more rows
      // (Don't add trailing space at the end)
      if (hasSecondGroup && (i + 8) < nonSpaceKeys.length) {
        rowKeys.push("Space");
      }
      
      rows.push(rowKeys);
    }
    
    return rows;
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
      const isMobile = window.innerWidth < 768;
      setIsMobile(isMobile);
      if (isMobile && inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    const checkOrientation = () => {
      if (window.innerWidth < 768) {
        const isLandscapeMode = window.innerWidth > window.innerHeight;
        setIsLandscape(isLandscapeMode);
        setShowRotatePrompt(isLandscapeMode);
      } else {
        setIsLandscape(false);
        setShowRotatePrompt(false);
      }
    };
    
    checkIfMobile();
    checkOrientation();
    
    // Also check after a short delay to ensure orientation is detected
    const timeoutId = setTimeout(() => {
      checkOrientation();
    }, 100);
    
    const handleResize = () => {
      checkIfMobile();
      checkOrientation();
    };
    
    const handleOrientationChange = () => {
      // Small delay to ensure orientation change is complete
      setTimeout(() => {
        checkOrientation();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
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

  const handleKeyPress = useCallback((e) => {
    const normalizedKey = normalizeKey(e.key);
    
    // Update hand images for any key press
    updateHandImages(normalizedKey);
    setPressedKey(normalizedKey);

    // Only process typing practice if we're still in the exercise
    if (currentIndex < highlightedKeys.length) {
      if (e.key === "Backspace") {
        setBackspaceCount(prev => prev + 1);
      }

      if (e.key === ' ' || highlightedKeys.includes(normalizedKey)) {
        e.preventDefault();
      }
      
      const expectedKey = highlightedKeys[currentIndex];
      const isCorrect = normalizedKey === expectedKey;
      const newKeyStatus = [...keyStatus];
      newKeyStatus[currentIndex] = isCorrect ? 'correct' : 'wrong';
      setKeyStatus(newKeyStatus);
      
      // Track key difficulties (wrong attempts)
      if (!isCorrect && expectedKey) {
        setKeyDifficulties(prev => ({
          ...prev,
          [expectedKey]: (prev[expectedKey] || 0) + 1
        }));
      }
      
      // Set start time on first key press
      if (!startTime && currentIndex === 0) {
        setStartTime(Date.now());
      }
      
      if (isCorrect) {
        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          // Check if completed
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
    }
  }, [currentIndex, keyStatus, wrongCount, sound, updateHandImages]);

  const handleKeyUp = useCallback(() => {
    setPressedKey("");
    // Reset both hand images to resting position when key is released
    setLeftHandImage(keyToHandImage["resting"].left);
    setRightHandImage(keyToHandImage["resting"].right);
  }, []);

  useEffect(() => {
    // Add single set of key listeners
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyPress, handleKeyUp]);


  const resetStats = () => {
    setCurrentIndex(0);
    setCurrentRowIndex(0);
    setIsRowAnimating(false);
    setAccuracy(100);
    setKeyStatus(Array(highlightedKeys.length).fill(null));
    setTimer(180);
    setElapsedTime(0);
    setBackspaceCount(0);
    setPressedKey("");
    setIsCompleted(false);
    setStartTime(null);
    setEndTime(null);
    setKeyDifficulties({});
    setLeftHandImage(keyToHandImage["resting"].left);
    setRightHandImage(keyToHandImage["resting"].right);
    if (isMobile && inputRef.current) {
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

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-y-auto ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
      style={{
        minHeight: '100dvh', // Dynamic viewport height for mobile
      }}
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

      <div
        className={`p-4 flex flex-col md:flex-row gap-6 w-full min-h-full ${
          isDarkMode ? "text-white" : "text-black"
        }`}
        style={{
          minHeight: '100dvh',
        }}
        tabIndex={0}
      >

      {/* Mobile-only elements */}
      <style jsx>{`
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
        
        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }
        
        .animate-slide-in-right-key {
          animation: slideInRightKey 0.4s ease-out forwards;
        }
        
        .animate-rotate-arrows {
          animation: rotateArrows 3s linear infinite;
        }
        
        @media (max-width: 767px) {
          .mobile-scale {
            transform: scale(0.8);
            transform-origin: top center;
            width: 125%;
            margin-left: 1%;
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
            width: 30px !important;
            height: 30px !important;
            font-size: 0.7rem !important;
          }
          .mobile-space-key {
            width: 60px !important;
            height: 30px !important;
          }
          /* Ensure typing prompt stays in one row on mobile */
          .typing-prompt-mobile {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .typing-prompt-mobile::-webkit-scrollbar {
            display: none;
          }
          /* Rotation prompt visibility */
          .rotate-prompt-mobile {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          @media (max-width: 767px) and (orientation: landscape) {
            .rotate-prompt-mobile {
              display: flex !important;
              visibility: visible !important;
              opacity: 1 !important;
              position: fixed !important;
              z-index: 9999 !important;
            }
          }
          /* Hide hand overlay on all mobile views */
          .hand-overlay {
            display: none !important;
          }
        }

        
        
        @media (max-width: 767px) and (orientation: landscape),
               (max-height: 500px) and (orientation: landscape) {
          html, body {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            position: fixed;
          }
          /* Hide top mobile stats container in landscape */
          .mobile-stats-container {
            display: none !important;
          }
          /* Right section cards in landscape mobile - single column with 5 cards */
          .landscape-mobile-stats {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            max-width: 120px !important;
            gap: 0.5rem !important;
          }
          .landscape-mobile-stats > div {
            width: 100% !important;
            min-width: 100% !important;
          }
          /* Hide user profile image in landscape mobile view */
          .user-profile-section,
          .user-profile-image,
          .user-profile-name {
            display: none !important;
          }
          /* Force keyboard container to be smaller and fixed */
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
          /* Remove border radius from keyboard keys */
          .keyboard-container.mobile-scale .flex > div {
            border-radius: 0 !important;
          }
          /* Hide hand images in landscape mobile view */
          .keyboard-container.mobile-scale .hand-overlay {
            display: none !important;
          }
          /* Hide user profile in landscape mobile view */
          .user-profile-landscape {
            display: none !important;
          }
          /* Single column layout for stats in landscape mobile */
          .stats-grid-landscape {
            grid-template-columns: 1fr !important;
          }
          .mobile-small-key {
            width: 30px !important;
            height: 30px !important;
            font-size: 0.8rem !important;
          }
          .mobile-space-key {
            width: 90px !important;
            height: 20px !important;
            font-size: 0.8rem !important;
          }
          /* Keyboard keys in landscape - use specific class selector */
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
          /* Override all width classes with attribute selector - default keys */
          .keyboard-container.mobile-scale .flex > div[class*="w-"] {
            width: 28px !important;
            min-width: 58px !important;
            max-width: 28px !important;
          }
          /* Special keys - Backspace and Enter (170px) */
          .keyboard-container.mobile-scale .flex > div[class*="170px"] {
            width: 60px !important;
            min-width: 82px !important;
            max-width: 60px !important;
          }
          /* Shift button (175px) */
          .keyboard-container.mobile-scale .flex > div[class*="175px"] {
            width: 65px !important;
            min-width: 105px !important;
            max-width: 65px !important;
          }
          /* Tab button (130px) */
          .keyboard-container.mobile-scale .flex > div[class*="130px"] {
            width: 50px !important;
            min-width: 82px !important;
            max-width: 50px !important;
          }
          /* Caps button (118px) */
          .keyboard-container.mobile-scale .flex > div[class*="118px"] {
            width: 48px !important;
            min-width: 82px !important;
            max-width: 48px !important;
          }
          /* Ctrl, Alt, Win, Menu buttons (70px) */
          .keyboard-container.mobile-scale .flex > div[class*="100px"] {
            width: 35px !important;
            min-width: 35px !important;
            max-width: 35px !important;
          }
          /* Backslash button (95px) */
          .keyboard-container.mobile-scale .flex > div[class*="95px"] {
            width: 40px !important;
            min-width: 40px !important;
            max-width: 40px !important;
          }
          /* Default letter keys (55px) */
          .keyboard-container.mobile-scale .flex > div[class*="55px"] {
            width: 28px !important;
            min-width: 40px !important;
            max-width: 28px !important;
          }
          /* Space key */
          .keyboard-container.mobile-scale .flex > div[class*="flex-1"] {
            flex: 1 1 auto !important;
            min-width: 80px !important;
            width: auto !important;
            max-width: 270px !important;
          }
          /* Row spacing */
          .keyboard-container.mobile-scale .flex {
            margin-bottom: 2px !important;
            gap: 2px !important;
          }
          
          /* Fix keyboard container positioning in landscape */
          .keyboard-container {
            position: relative !important;
            max-height: 50vh !important;
            overflow-y: auto !important;
            
          }
          /* Right section absolute positioning in mobile landscape */
          .right-section-stats {
            position: absolute !important;
            // right: 0px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 100 !important;
            bottom: -400px !important;
          }
        }
        
        * Increase typing prompt keys size in mobile landscape */
          .typing-prompt-container > div {
            width: 48px !important;
            height: 48px !important;
            min-width: 48px !important;
            min-height: 48px !important;
            font-size: 1.1rem !important;
          }
          .typing-prompt-container > div[class*="w-16"] {
            width: 50px !important;
            min-width: 70px !important;
          }
        }

        /* Desktop landscape view - fix keyboard */
        @media (min-width: 768px) and (orientation: landscape) {
          .keyboard-container {
            max-width: 70% !important;
            margin: 0 auto !important;
            padding: 8px !important;
          }
        }
        
        /* All landscape views - decrease keyboard width */
        @media (orientation: landscape) {
          .keyboard-container {
            max-width: 95% !important;
            width: 90% !important;
          }
        }
      `}</style>

      {/* Theme Toggle Button */}
      <div className="absolute top-16 md:top-5 right-5 md:right-5 z-50 cursor-pointer">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full shadow text-sm cursor-pointer ${
            isDarkMode ? "bg-white text-black" : "bg-black text-white"
          }`}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Mobile Statistics Section - Top (Portrait only, hidden in landscape) */}
      {isMobile && !isLandscape && (
        <div className="md:hidden w-full flex items-center justify-center gap-4 mb-4 px-4">
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
      )}

      {/* Left Section */}
      <div className="flex-1 flex flex-col items-center gap-6 mobile-stack">
        {/* Typing Prompt Buttons - All in one row (mobile only) */}
        <div 
          className={`flex ${isMobile ? "flex-nowrap typing-prompt-mobile" : "flex-wrap"} justify-center items-center gap-1 md:gap-2 relative ${
            isMobile ? "overflow-x-auto mt-2 px-2" : "mobile-tight-gap"
          } typing-prompt-container`}
          style={isMobile ? { scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' } : {}}
        >
          {isMobile ? (
            // Mobile: Show all keys in one row (use actual highlightedKeys, not organized rows)
            highlightedKeys.filter(k => k !== undefined && k !== null).map((key, index) => {
              const isCurrentKey = index === currentIndex;
              const keyStatusForThisKey = keyStatus[index];
              const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
              
              return (
                <div
                  key={index}
                  className={`
                    ${key === "Space" ? "w-16 h-8" : "w-8 h-8"}
                    rounded flex items-center justify-center text-sm font-semibold
                    transition-all duration-150 flex-shrink-0
                    ${
                      isCurrentKey && key === "Space"
                        ? "bg-blue-600 border-blue-400 border-2 text-white"
                        : isCurrentKey
                        ? "bg-blue-600 border-blue-400 border-2 text-white"
                        : isPressed && key === "Space"
                        ? "bg-red-600 text-white border-red-400 border-2 scale-95"
                        : isPressed
                        ? "bg-red-600 text-white border-red-400 border-2 scale-95"
                        : keyStatusForThisKey === "correct"
                        ? "bg-green-300 border-green-600 text-green-800"
                        : keyStatusForThisKey === "wrong"
                        ? "bg-red-600 border-red-600 text-white"
                        : "bg-white text-black border-gray-300"
                    }
                    border
                  `}
                >
                  {key === "Space" ? "Space" : key.toLowerCase()}
                </div>
              );
            })
          ) : (
            // Desktop: Use row-based layout
            (() => {
              const currentRowKeys = getCurrentRowKeys();
              const rows = organizeKeysIntoRows(highlightedKeys);
              const nonSpaceKeys = highlightedKeys.filter(k => k !== "Space");
              
              const nonSpaceStartIndex = currentRowIndex * 8;
              
              const getOriginalIndex = (displayKeyIdx) => {
                if (currentRowKeys[displayKeyIdx] === "Space") {
                  return -1;
                }
                
                let keyPosition;
                if (displayKeyIdx < 4) {
                  keyPosition = displayKeyIdx;
                } else if (displayKeyIdx > 4 && displayKeyIdx < 9) {
                  keyPosition = displayKeyIdx - 1;
                } else {
                  return -1;
                }
                
                const nonSpaceKeyIndex = nonSpaceStartIndex + keyPosition;
                if (nonSpaceKeyIndex >= nonSpaceKeys.length) return -1;
                
                let nonSpaceCount = 0;
                for (let i = 0; i < highlightedKeys.length; i++) {
                  if (highlightedKeys[i] !== "Space") {
                    if (nonSpaceCount === nonSpaceKeyIndex) {
                      return i;
                    }
                    nonSpaceCount++;
                  }
                }
                return -1;
              };
              
              return currentRowKeys.map((key, displayIdx) => {
                const originalIndex = getOriginalIndex(displayIdx);
                const isCurrentKey = originalIndex === currentIndex;
                const keyStatusForThisKey = originalIndex >= 0 ? keyStatus[originalIndex] : null;
                const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
                const hasGapAfterSpace = displayIdx === 5 && currentRowKeys[4] === "Space";
                
                let marginClass = "";
                if (displayIdx === 0) {
                  marginClass = "";
                } else if (hasGapAfterSpace) {
                  marginClass = "md:ml-8 ml-6";
                } else {
                  marginClass = "md:ml-2 ml-1.5";
                }
                
                return (
                  <div
                    key={`${currentRowIndex}-${displayIdx}`}
                    className={`
                      ${key === "Space" ? "w-28 h-10 md:w-35 md:h-11 mt-2 mobile-space-key" : "w-16 h-14 mobile-small-key"}
                      rounded flex items-center justify-center text-xl font-semibold mobile-small-text
                      ${marginClass}
                      transition-all duration-150
                      ${isRowAnimating ? 'animate-slide-in-right-key' : ''}
                      ${
                        isCurrentKey && key === "Space"
                          ? "bg-blue-600 border-blue-400 border-2 text-white"
                          : isCurrentKey
                          ? "bg-blue-600 border-blue-400 border-2 text-white"
                          : isPressed && key === "Space"
                          ? "bg-red-600 text-white border-red-400 border-2 scale-95"
                          : isPressed
                          ? "bg-red-600 text-white border-red-400 border-2 scale-95"
                          : keyStatusForThisKey === "correct"
                          ? "bg-green-300 border-green-600 text-green-800"
                          : keyStatusForThisKey === "wrong"
                          ? "bg-red-600 border-red-600 text-white"
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
              });
            })()
          )}
        </div>

        <div
  className={`
    hidden
    md:hidden
    lg:flex
    flex items-center
    ${isMobile ? "justify-center gap-3" : "gap-4"}
    mt-2
    mobile-tight-gap mobile-small-text
  `}
>          {/* Hand Toggle */}
          <label className="flex items-center gap-1 md:gap-2">
            <span className={isMobile ? "text-sm" : ""}>Hand</span>
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
          <label className="flex items-center gap-1 md:gap-2">
            <span className={isMobile ? "text-sm" : ""}>Sound</span>
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
          <label className="flex items-center gap-1 md:gap-2">
            <span className={isMobile ? "text-sm" : ""}>Keyboard</span>
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

          {/* Reset Button - Hidden on Mobile */}
          {!isMobile && (
            <button
              onClick={resetStats}
              className="ml-4 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-white mobile-small-text"
            >
              Reset
            </button>
          )}
        </div>

        {/* Rotation Prompt for Mobile Landscape - Side of Keyboard */}
        {isMobile && !isLandscape && (
          <div className="rotate-prompt-mobile fixed bottom-84 left-1/2 -translate-x-1/2 z-[100] bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 shadow-lg border border-gray-700" style={{ pointerEvents: 'none' }}>
            {/* Phone Icon with Rotation Arrows */}
            <div className="relative flex items-center justify-center w-20 h-20">
              {/* Rotation Arrows */}
              <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0 animate-rotate-arrows">
                {/* Left Arrow - Counter-clockwise */}
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
                {/* Right Arrow - Clockwise */}
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
              
              {/* Phone Icon in Portrait */}
              <div className="relative w-9 h-14 bg-blue-500 rounded-md border-2 border-blue-400 flex flex-col items-center justify-between py-1.5">
                {/* Camera/Sensor */}
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                {/* Screen */}
                <div className="flex-1 w-5 bg-blue-400 rounded my-1"></div>
                {/* Button/Notch */}
                <div className="w-2.5 h-0.5 bg-blue-300 rounded"></div>
              </div>
            </div>
            
            {/* Horizontal Text */}
            <div className="flex flex-row items-center text-white font-semibold text-sm gap-1">
              <span>Rotate</span>
              <span>Your</span>
              <span>Phone</span>
            </div>
          </div>
        )}

        {/* Keyboard */}
        {keyboard && (
          <div className={`relative mt-4 ${isMobile ? "p-2 w-full max-w-full" : "p-5"} border border-gray-600 rounded-3xl shadow-md keyboard-container ${
            isDarkMode ? "bg-[#403B3A]" : "bg-gray-200"
          } ${isMobile ? "" : "mobile-scale"}`}>
            
            {/* Dual Hand Image Overlay - positioned on top of keyboard */}
            {hand && (leftHandImage || rightHandImage) && !isMobile && (
              <div className="absolute inset-0 pointer-events-none z-10 hand-overlay">
                {/* Left Hand - positioned to align with A,S,D,F keys */}
                <div className="absolute left-[-70px] top-70 transform -translate-y-1/2 -translate-x-12">
                  <img 
                    src={leftHandImage} 
                    alt="Left hand finger position" 
                    className="w-130 h-600 object-contain opacity-85 transition-all duration-200 ease-in-out transform scale-110"
                  />
                </div>
                
                {/* Right Hand - positioned to align with J,K,L,; keys */}
                <div className="absolute right-13 top-70 transform -translate-y-1/2 translate-x-12">
                  <img 
                    src={rightHandImage} 
                    alt="Right hand finger position" 
                    className="w-130 h-600 object-contain opacity-85 transition-all duration-200 ease-in-out transform scale-110"
                  />
                </div>
                
                {/* Pressed Key Indicator */}
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
              <div key={rowIndex} className={`flex ${isMobile ? "mb-1" : "mb-2.5"}`}>
                {row.map((key, keyIndex) => {
                  // Check if space key is pressed (handle both "Space" and " " normalization)
                  const isPressed = pressedKey === key || (key === "Space" && (pressedKey === "Space" || pressedKey === " "));
                  const isCurrentKey = highlightedKeys[currentIndex] === key;
                  return (
                    <div
                      key={keyIndex}
                      className={`${isMobile ? "h-8 text-xs" : "h-14 text-base"} ${getKeyWidth(key)} ${isMobile ? "mx-0.5" : "mx-1"} rounded flex items-center justify-center 
                        border transition-all duration-150 ${
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

      {/* Right Section - Hidden on Mobile Portrait, Visible on Mobile Landscape */}
      <div className={`${isMobile && isLandscape ? "flex" : "hidden md:flex"} flex-col items-center ${isMobile && isLandscape ? "gap-2" : "space-y-1"} ${isMobile && isLandscape ? "mt-2" : "md:mt-25 mt-15"} mobile-stack mobile-small-text right-section-stats`}>
        {!isMobile || !isLandscape ? (
          <div className="flex flex-col items-center user-profile-section user-profile-landscape mb-4">
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
        ) : null}
        
        {isMobile && isLandscape ? (
          // Landscape Mobile: Single column layout with all 5 cards
          <div className="flex flex-col gap-2 w-full max-w-[120px] items-center landscape-mobile-stats md:mr-0 mr-20 lg:mr-0">
            {/* Time Card */}
            <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
              <div className="bg-white text-black text-sm font-bold">{formatClock(elapsedTime)}</div>
            </div>
            {/* Correct Card */}
            <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Correct</div>
              <div className="bg-white text-green-600 text-sm font-bold">{correctCount}</div>
            </div>
            {/* Wrong Card */}
            <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Wrong</div>
              <div className="bg-white text-red-500 text-sm font-bold">{wrongCount}</div>
            </div>
            {/* Total Card */}
            <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Total</div>
              <div className="bg-white text-[#290c52] text-sm font-bold">{totalCount}</div>
            </div>
            {/* Backspace Card */}
            <div className="w-full h-9 rounded-lg overflow-hidden text-center shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)]">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Backspace</div>
              <div className="bg-white text-blue-500 text-sm font-bold">{backspaceCount}</div>
            </div>
          </div>
        ) : (
          // Desktop: Original layout
          <>
            <div className="w-24 h-9 rounded-lg overflow-hidden text-center mt-2 shadow-[0_1px_8px_white,0_2px_6px_silver,0_4px_10px_rgba(0,0,0,0.7)] mobile-scale">
              <div className="bg-black text-white text-[10px] font-semibold py-[1px]">Time</div>
              <div className="bg-white text-black text-sm font-bold">{formatClock(elapsedTime)}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 mt-4 gap-x-4 md:gap-x-4 w-full text-center mobile-tight-gap mobile-scale stats-grid-landscape">
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
          </>
        )}

        {/* Speedometer */}
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
      </div>
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