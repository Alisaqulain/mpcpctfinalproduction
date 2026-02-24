/**
 * Professional Hindi IME Engine
 * CPCTMaster-style Hindi Typing Conversion Library
 * Supports Remington (phonetic) and InScript (fixed layout) Hindi typing
 *
 * SINGLE SOURCE: This Remington layout is used everywhere Hindi Remington is enabled:
 * - Admin (HindiTextarea for CPCT/lesson/exercise Hindi content)
 * - Learning (TypingArea with Hindi)
 * - Skill test (typing page)
 * - Exam (ExamTypingInterface)
 * - Mobile keyboard (same conversion via handleInputChange when keydown is Unidentified)
 *
 * Features:
 * - Real-time phonetic conversion (Remington)
 * - Fixed keyboard layout (InScript)
 * - Halant support (Shift + consonant = half consonant)
 * - Automatic conjunct formation
 * - Proper matra handling
 * - Unicode cluster-aware backspace
 * - Smart cursor management
 * - Works in middle of text
 */

/**
 * Complete Remington Gail (Phonetic) Hindi Mapping
 * Matches Gyanians.com / standard Remington Gail chart exactly.
 * Shift + consonant = halant (half form); Shift+A and Shift+G = no output (per user).
 */
const REMINGTON_MAP = {
  // Home row (no shift)
  'a': 'ं',      // anusvara
  's': 'े',      // e matra
  'd': 'क',
  'f': 'ि',      // i matra
  'g': 'ह',
  'h': 'ी',      // ii matra
  'j': 'र',
  'k': 'ा',      // aa matra
  'l': 'स',
  ';': 'य',
  "'": 'श्',     // apostrophe = श्
  '\\': '(',     // backslash = opening paren
  
  // Upper row (QWERTY)
  'q': 'ु',
  'w': 'ू',
  'e': 'म',
  'r': 'त',
  't': 'ज',
  'y': 'ल',
  'u': 'न',
  'i': 'प',
  'o': 'व',
  'p': 'च',
  '[': 'ख',
  ']': ',',
  
  // Lower row
  'z': '्र',
  'x': 'ग',
  'c': 'ब',
  'v': 'अ',
  'b': 'इ',
  'n': 'द',
  'm': 'उ',
  ',': 'ए',
  '.': 'ण्',
  '/': 'ध्',
  
  // Number row (normal)
  '`': '़',      // grave = nukta
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
  '-': ';',      // minus = semicolon
  '=': 'ृ',      // equals = ri matra
  
  // Multi-character sequences (phonetic typing)
  'aa': 'आ', 'ee': 'ई', 'oo': 'ऊ', 'ai': 'ऐ', 'au': 'औ',
  'kh': 'ख', 'gh': 'घ', 'ch': 'छ', 'jh': 'झ', 'th': 'थ', 'dh': 'ध',
  'ph': 'फ', 'bh': 'भ', 'sh': 'श', 'gya': 'ज्ञ', 'ksh': 'क्ष',
  'tr': 'त्र', 'shra': 'श्र',
};

/**
 * Remington Matra (Vowel Signs) - for attach-to-consonant logic when buffer matches
 */
const REMINGTON_MATRA_MAP = {
  'ि': 'ि', 'ी': 'ी', 'ा': 'ा', 'े': 'े', 'ै': 'ै', 'ु': 'ु', 'ू': 'ू', 'ृ': 'ृ', '्र': '्र',
};

/**
 * Remington Gail Shift mappings (key = character produced when shift is held)
 * Shift+A and Shift+G = no mapping (user requested nothing on them).
 */
const REMINGTON_SHIFT_CONSONANT_MAP = {
  // Home row shift (no A, no G)
  'S': 'ै', 'D': 'क्', 'F': 'थ', 'H': 'भ्', 'J': 'श्र', 'K': 'ज्ञ', 'L': 'स्',
  ':': 'रु', '"': 'ष्', '|': ')',   // Shift+; = रु, Shift+' = ष्, Shift+\ = )
  
  // Upper row shift
  'Q': 'फ', 'W': 'ॅ', 'E': 'म्', 'R': 'त्', 'T': 'ज्', 'Y': 'ल्', 'U': 'न्', 'I': 'प्', 'O': 'व्', 'P': 'च्',
  '{': 'क्ष', '}': 'द्व',
  
  // Lower row shift
  'Z': 'र्', 'X': 'ग्', 'C': 'ब्', 'V': 'ट', 'B': 'ठ', 'N': 'छ', 'M': 'ड',
  '<': 'ढ', '>': 'झ', '?': 'घ',
  
  // Number row shift (key = shifted character: ~!@#$%^&*()_+)
  '~': 'द्य', '!': '।', '@': '/', '#': 'ः', '$': '*', '%': '-', '^': "'", '&': "'",
  '*': 'द्ध', '(': 'त्र', ')': 'ऋ', '_': '.', '+': '्',
};

/**
 * Consonant to Halant (Half Form) Mapping
 * Maps consonants to their half forms with halant
 */
const CONSONANT_HALANT_MAP = {
  'क': 'क्', 'ख': 'ख्', 'ग': 'ग्', 'घ': 'घ्', 'ङ': 'ङ्',
  'च': 'च्', 'छ': 'छ्', 'ज': 'ज्', 'झ': 'झ्', 'ञ': 'ञ्',
  'ट': 'ट्', 'ठ': 'ठ्', 'ड': 'ड्', 'ढ': 'ढ्', 'ण': 'ण्',
  'त': 'त्', 'थ': 'थ्', 'द': 'द्', 'ध': 'ध्', 'न': 'न्',
  'प': 'प्', 'फ': 'फ्', 'ब': 'ब्', 'भ': 'भ्', 'म': 'म्',
  'य': 'य्', 'र': 'र्', 'ल': 'ल्', 'व': 'व्',
  'श': 'श्', 'ष': 'ष्', 'स': 'स्', 'ह': 'ह्',
  'क्ष': 'क्ष्', 'ज्ञ': 'ज्ञ्', 'त्र': 'त्र्', 'श्र': 'श्र्',
};

/**
 * Common Conjunct Formations
 * Maps consonant + halant + consonant to conjunct
 * Important for Remington: Shift+D (क्) + R (त) = क्त
 */
const CONJUNCT_MAP = {
  'क्+ष': 'क्ष',
  'ज्+ञ': 'ज्ञ',
  'त्+र': 'त्र',
  'श्+र': 'श्र',
  'क्+त': 'क्त',    // Shift+D + R = क्त
  'क्+य': 'क्य',
  'क्+र': 'क्र',
  'क्+ल': 'क्ल',
  'क्+व': 'क्व',
  'ग्+य': 'ग्य',
  'ग्+र': 'ग्र',
  'ग्+न': 'ग्न',
  'च्+छ': 'च्छ',
  'च्+च': 'च्च',
  'ज्+ज': 'ज्ज',
  'ज्+ञ': 'ज्ञ',
  'ज्+य': 'ज्य',
  'त्+त': 'त्त',
  'त्+य': 'त्य',
  'त्+र': 'त्र',
  'त्+म': 'त्म',
  'द्+य': 'द्य',
  'द्+ध': 'द्ध',
  'द्+र': 'द्र',
  'द्+व': 'द्व',
  'न्+त': 'न्त',
  'न्+द': 'न्द',
  'न्+य': 'न्य',
  'प्+त': 'प्त',
  'प्+र': 'प्र',
  'ब्+द': 'ब्द',
  'म्+प': 'म्प',
  'म्+ब': 'म्ब',
  'य्+य': 'य्य',
  'र्+य': 'र्य',
  'ल्+ल': 'ल्ल',
  'ल्+य': 'ल्य',
  'व्+य': 'व्य',
  'श्+र': 'श्र',
  'श्+च': 'श्च',
  'स्+त': 'स्त',
  'स्+थ': 'स्थ',
  'स्+न': 'स्न',
  'स्+म': 'स्म',
  'ह्+म': 'ह्म',
  'ह्+य': 'ह्य',
  'ह्+र': 'ह्र',
};

/**
 * Complete InScript Hindi Keyboard Mapping
 * Standard InScript layout - fixed key positions
 * Based on official Devanagari - InScript Layout (KBDINDEV.DLL)
 */
const INSCRIPT_MAP = {
  // Top row (QWERTY) - Normal keys
  'q': 'औ', 'w': 'ऐ', 'e': 'आ', 'r': 'ई', 't': 'ऊ',
  'y': 'ब', 'u': 'ह', 'i': 'ग', 'o': 'द', 'p': 'ज',
  '[': 'ड', ']': 'ञ', '\\': '?',
  
  // Second row (ASDF) - Normal keys
  'a': 'अ', 's': 'स', 'd': 'द', 'f': 'ध', 'g': 'ग',
  'h': 'ह', 'j': 'ज', 'k': 'क', 'l': 'ल',
  ';': 'त', "'": 'च',
  
  // Third row (ZXCV) - Normal keys
  'z': 'ज़', 'x': 'क्ष', 'c': 'च', 'v': 'व',
  'b': 'ब', 'n': 'न', 'm': 'म',
  ',': '्', '.': '।', '/': '?',
  
  // Numbers row
  '1': '१', '2': '२', '3': '३', '4': '४', '5': '५',
  '6': '६', '7': '७', '8': '८', '9': '९', '0': '०',
  '-': 'ऋ', '=': 'ृ',
  
  // Special characters
  '`': 'य', '~': 'य',
};

/**
 * InScript Shift mappings for alternate characters
 * Shift + key produces different character
 */
const INSCRIPT_SHIFT_MAP = {
  // Top row (QWERTY) - Shift keys
  'Q': 'ौ', 'W': 'ै', 'E': 'ा', 'R': 'ी', 'T': 'ू',
  'Y': 'भ', 'U': 'घ', 'I': 'ग़', 'O': 'ध', 'P': 'झ',
  '{': '्र', '}': 'ञ', '|': '|',
  
  // Second row (ASDF) - Shift keys
  'A': 'ओ', 'S': 'श', 'D': '्', // Shift+D = halant (्)
  'F': 'ढ', 'G': 'घ', 'H': 'प', 'J': 'र',
  'K': 'क़', 'L': 'थ', ':': 'छ', '"': 'ठ',
  
  // Third row (ZXCV) - Shift keys
  'Z': 'ट', 'X': 'ष', 'C': 'व', 'V': 'ब',
  'B': 'न', 'N': 'म', 'M': 'श',
  '<': '्र', '>': 'ज्ञ', '?': '?',
  
  // Numbers row - Shift keys
  '!': '१', '@': '२', '#': '३', '$': '४', '%': '५',
  '^': '६', '&': '७', '*': '८', '(': '९', ')': '०',
  '_': 'ऋ', '+': 'ृ',
  
  // Special keys
  '~': 'य',
};

// Conjunct keys (direct mapping)
const INSCRIPT_CONJUNCT_KEYS = {
  '5': 'ज्ञ',    // Number 5 = ज्ञ
  '6': 'त्र',    // Number 6 = त्र
  '7': 'क्ष',    // Number 7 = क्ष
  '8': 'श्र',    // Number 8 = श्र
};

/**
 * Utility: Check if character is a Hindi consonant
 */
function isHindiConsonant(char) {
  return /[\u0915-\u0939]/.test(char);
}

/**
 * Utility: Check if character is a Hindi vowel sign (matra)
 */
function isHindiMatra(char) {
  return /[\u093E-\u094C\u0955-\u0957]/.test(char);
}

/**
 * Utility: Check if character is halant (्)
 */
function isHalant(char) {
  return char === '\u094D';
}

/**
 * Utility: Get last consonant before cursor
 * Returns {consonant, position} or null
 */
function getLastConsonant(text, cursorPos) {
  let pos = cursorPos - 1;
  while (pos >= 0) {
    const char = text[pos];
    if (isHindiConsonant(char)) {
      return { consonant: char, position: pos };
    }
    if (!isHindiMatra(char) && !isHalant(char) && char !== ' ') {
      break;
    }
    pos--;
  }
  return null;
}

/**
 * Utility: Check if we can form a conjunct
 * Returns conjunct character or null
 */
function tryFormConjunct(lastConsonant, newConsonant) {
  const halantForm = CONSONANT_HALANT_MAP[lastConsonant];
  if (!halantForm) return null;
  
  const key = halantForm + '+' + newConsonant;
  return CONJUNCT_MAP[key] || null;
}

/**
 * Utility: Get Unicode cluster length at position
 * Hindi characters can be multi-code-unit clusters
 */
function getClusterLength(text, startPos) {
  if (startPos >= text.length) return 0;
  
  let len = 1;
  let pos = startPos + 1;
  
  // Check for combining marks (matras, halant, etc.)
  while (pos < text.length) {
    const char = text[pos];
    const code = char.charCodeAt(0);
    
    // Hindi combining marks: U+0900-U+097F
    if (code >= 0x0900 && code <= 0x097F) {
      len++;
      pos++;
    } else if (code === 0x200D || code === 0x200C) {
      // Zero-width joiner/non-joiner
      len++;
      pos++;
    } else {
      break;
    }
  }
  
  return len;
}

/**
 * Devanagari base: consonant or independent vowel (starts a grapheme cluster).
 * Combining marks (matra, halant, nukta) follow a base and must not start a new cluster.
 */
function isDevanagariBase(code) {
  return (
    (code >= 0x0904 && code <= 0x0914) || /* independent vowels */
    (code >= 0x0915 && code <= 0x0939)    /* consonants */
  );
}

/**
 * Utility: Get previous cluster start position (one Devanagari grapheme cluster only).
 * Stops at a base character (consonant/independent vowel) so we don't delete the whole word.
 */
function getPreviousClusterStart(text, cursorPos) {
  if (cursorPos <= 0) return 0;
  
  let pos = cursorPos - 1;
  
  // Walk backward until we hit a cluster start (base) or non-Devanagari
  while (pos > 0) {
    const code = text.charCodeAt(pos - 1);
    if (isDevanagariBase(code)) {
      break; // this base starts the cluster we're deleting
    }
    if ((code >= 0x0900 && code <= 0x097F) || code === 0x200D || code === 0x200C) {
      pos--;
    } else {
      break;
    }
  }
  
  return pos;
}

/**
 * Remington Converter with advanced IME features
 */
class RemingtonConverter {
  constructor() {
    this.buffer = ''; // Buffer for multi-character sequences
    this.maxBufferLength = 4; // Maximum sequence length (e.g., "gyaa")
  }

  /**
   * Convert a keypress to Hindi character
   * Handles halant, matras, and conjunct formation
   * Based on Mangal Font Remington Layout
   */
  convertKey(key, currentText = '', cursorPos = 0, shiftKey = false) {
    const lowerKey = key.toLowerCase();
    const upperKey = key.toUpperCase();
    
    // Handle Shift: Remington Gail - Shift+A and Shift+G = no output
    if (shiftKey) {
      if (upperKey === 'A' || upperKey === 'G') {
        return null; // User: "A aur G mene chod diya h us pr kuch nhi dena"
      }
      if (REMINGTON_SHIFT_CONSONANT_MAP[upperKey]) {
        const shiftChar = REMINGTON_SHIFT_CONSONANT_MAP[upperKey];
        return {
          char: shiftChar,
          replaceLength: 0,
          cursorOffset: shiftChar.length
        };
      }
      // Fallback: halant form only for keys that have a shift mapping
      const consonant = REMINGTON_MAP[lowerKey];
      if (consonant && isHindiConsonant(consonant)) {
        const halantForm = CONSONANT_HALANT_MAP[consonant];
        if (halantForm) {
          return {
            char: halantForm,
            replaceLength: 0,
            cursorOffset: halantForm.length
          };
        }
      }
    }
    
    // Get text before cursor for context
    const textBefore = currentText.substring(0, cursorPos);
    const textAfter = currentText.substring(cursorPos);
    
    // Build buffer from last few characters + new key
    const bufferText = (textBefore.slice(-this.maxBufferLength) + lowerKey).toLowerCase();
    
    // Try sequences: 4-char, 3-char, 2-char, 1-char
    for (let len = Math.min(4, bufferText.length); len >= 1; len--) {
      const sequence = bufferText.slice(-len);
      const mapped = REMINGTON_MAP[sequence];
      
      if (mapped) {
        // Check if we can form a conjunct
        if (isHindiConsonant(mapped) && textBefore.length > 0) {
          const lastConsonantInfo = getLastConsonant(textBefore, textBefore.length);
          if (lastConsonantInfo) {
            const conjunct = tryFormConjunct(lastConsonantInfo.consonant, mapped);
            if (conjunct) {
              // Replace last consonant with conjunct
              const replaceStart = lastConsonantInfo.position;
              const replaceLength = textBefore.length - replaceStart;
              return {
                char: conjunct,
                replaceStart: replaceStart,
                replaceLength: replaceLength,
                cursorOffset: conjunct.length
              };
            }
          }
        }
        
        // Check if last character is halant and new char is consonant
        if (isHindiConsonant(mapped) && textBefore.length > 0) {
          const lastChar = textBefore[textBefore.length - 1];
          if (isHalant(lastChar)) {
            // Try to form conjunct
            const prevConsonantInfo = getLastConsonant(textBefore.slice(0, -1), textBefore.length - 1);
            if (prevConsonantInfo) {
              const conjunct = tryFormConjunct(prevConsonantInfo.consonant, mapped);
              if (conjunct) {
                const replaceStart = prevConsonantInfo.position;
                const replaceLength = textBefore.length - replaceStart;
                return {
                  char: conjunct,
                  replaceStart: replaceStart,
                  replaceLength: replaceLength,
                  cursorOffset: conjunct.length
                };
              }
            }
          }
        }
        
        // Check if last character is consonant and new char is matra
        if (isHindiMatra(mapped) && textBefore.length > 0) {
          const lastConsonantInfo = getLastConsonant(textBefore, textBefore.length);
          if (lastConsonantInfo) {
            // Attach matra to consonant
            const replaceStart = lastConsonantInfo.position;
            const replaceLength = textBefore.length - replaceStart;
            const consonant = textBefore.substring(replaceStart, textBefore.length);
            return {
              char: consonant + mapped,
              replaceStart: replaceStart,
              replaceLength: replaceLength,
              cursorOffset: (consonant + mapped).length
            };
          }
        }
        
        // Regular mapping
        const replaceLength = Math.min(len, textBefore.length);
        const replaceStart = Math.max(0, textBefore.length - (len - 1));
        return {
          char: mapped,
          replaceStart: replaceStart,
          replaceLength: replaceLength,
          cursorOffset: mapped.length
        };
      }
    }
    
    // No match - check if it's a matra that should attach
    const matra = REMINGTON_MATRA_MAP[lowerKey] || REMINGTON_MATRA_MAP[key];
    if (matra && textBefore.length > 0) {
      const lastConsonantInfo = getLastConsonant(textBefore, textBefore.length);
      if (lastConsonantInfo) {
        const replaceStart = lastConsonantInfo.position;
        const replaceLength = textBefore.length - replaceStart;
        const consonant = textBefore.substring(replaceStart, textBefore.length);
        return {
          char: consonant + matra,
          replaceStart: replaceStart,
          replaceLength: replaceLength,
          cursorOffset: (consonant + matra).length
        };
      }
    }
    
    // No conversion
    return null;
  }

  /**
   * Clear buffer
   */
  clearBuffer() {
    this.buffer = '';
  }

  /**
   * Convert full text (for batch conversion)
   */
  convertText(text) {
    if (!text) return '';
    
    let result = '';
    let i = 0;
    
    while (i < text.length) {
      const char = text[i];
      const nextChar = i + 1 < text.length ? text[i + 1] : '';
      const twoChar = char + nextChar;
      const threeChar = i + 2 < text.length ? text[i] + text[i + 1] + text[i + 2] : '';
      const fourChar = i + 3 < text.length ? text[i] + text[i + 1] + text[i + 2] + text[i + 3] : '';
      
      // Try 4-char, then 3-char, then 2-char, then 1-char
      if (fourChar && REMINGTON_MAP[fourChar.toLowerCase()]) {
        result += REMINGTON_MAP[fourChar.toLowerCase()];
        i += 4;
      } else if (threeChar && REMINGTON_MAP[threeChar.toLowerCase()]) {
        result += REMINGTON_MAP[threeChar.toLowerCase()];
        i += 3;
      } else if (twoChar && REMINGTON_MAP[twoChar.toLowerCase()]) {
        result += REMINGTON_MAP[twoChar.toLowerCase()];
        i += 2;
      } else if (REMINGTON_MAP[char]) {
        result += REMINGTON_MAP[char];
        i += 1;
      } else {
        // No mapping - keep original
        result += char;
        i += 1;
      }
    }
    
    return result;
  }
}

/**
 * InScript Converter
 * Direct key-to-character mapping with Shift support
 */
class InScriptConverter {
  /**
   * Convert a keypress to Hindi character
   */
  convertKey(key, shift = false) {
    const lookupKey = shift ? key.toUpperCase() : key;
    
    // Check shift map first
    if (shift && INSCRIPT_SHIFT_MAP[lookupKey]) {
      return INSCRIPT_SHIFT_MAP[lookupKey];
    }
    
    // Check regular map
    if (INSCRIPT_MAP[lookupKey]) {
      return INSCRIPT_MAP[lookupKey];
    }
    
    // Check if lowercase version exists
    if (INSCRIPT_MAP[key.toLowerCase()]) {
      return INSCRIPT_MAP[key.toLowerCase()];
    }
    
    // No mapping - return original
    return key;
  }

  /**
   * Convert full text
   */
  convertText(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const hindiChar = this.convertKey(char, false);
      result += hindiChar;
    }
    return result;
  }
}

/**
 * Alt Code Mappings for Hindi Characters
 * Alt + numeric keypad code → Hindi character
 * Based on Remington/InScript Alt code standards
 * Supports both Remington and InScript layouts
 */
const ALT_CODE_MAP = {
  // Common symbols (from image)
  '33': '!',      // Alt + 33 → !
  '36': '$',      // Alt + 36 → $
  '37': '%',      // Alt + 37 → %
  '43': '+',      // Alt + 43 → +
  '47': '/',      // Alt + 47 → /
  '61': '=',      // Alt + 61 → =
  '63': '?',      // Alt + 63 → ?
  
  // Devanagari digits
  '2305': '०',    // Alt + 2305 → ० (Devanagari Digit Zero)
  '2416': '०',    // Alt + 2416 → ० (alternate)
  '2406': '°',    // Alt + 2406 → ° (Degree Sign)
  
  // Devanagari characters and signs (from image)
  '2315': 'ं',    // Alt + 2315 → अं (Anusvara)
  '2329': 'ड़',   // Alt + 2329 → ड़ (DDA with dot below)
  '2334': 'ज',    // Alt + 2334 → ज (JA)
  '2365': 'ळ',    // Alt + 2365 → ळ (LLA)
  '2384': 'ॐ',    // Alt + 2384 → ॐ (Om Sign)
  '2395': 'ज्ञ',  // Alt + 2395 → ज्ञ (JNYA)
  '2398': 'फ़',   // Alt + 2398 → फ़ (FA with dot below)
  '2404': '।',    // Alt + 2404 → । (Danda)
  '2405': '॥',    // Alt + 2405 → ॥ (Double Danda)
  
  // Additional Devanagari characters
  '2306': 'ः',    // Visarga
  '2307': 'ँ',    // Chandrabindu
  '2308': 'ं',    // Anusvara (alternate)
  '2309': 'ः',    // Visarga (alternate)
  
  // Devanagari vowels (swar)
  '2309': 'अ',    // A
  '2310': 'आ',    // Aa
  '2311': 'इ',    // I
  '2312': 'ई',    // Ii
  '2313': 'उ',    // U
  '2314': 'ऊ',    // Uu
  '2315': 'ऋ',    // Ri
  '2316': 'ॠ',    // Rii
  '2317': 'ऌ',    // Li
  '2318': 'ॡ',    // Lii
  '2319': 'ए',    // E
  '2320': 'ऐ',    // Ai
  '2321': 'ओ',    // O
  '2322': 'औ',    // Au
  
  // Devanagari matras (vowel signs)
  '2366': 'ा',    // Aa matra
  '2367': 'ि',    // I matra
  '2368': 'ी',    // Ii matra
  '2369': 'ु',    // U matra
  '2370': 'ू',    // Uu matra
  '2371': 'ृ',    // Ri matra
  '2372': 'ॄ',    // Rii matra
  '2373': 'ॅ',    // E matra (short)
  '2374': 'े',    // E matra
  '2375': 'ै',    // Ai matra
  '2376': 'ॉ',    // O matra (short)
  '2377': 'ो',    // O matra
  '2378': 'ौ',    // Au matra
  '2379': '्',    // Halant/Virama
  
  // Devanagari consonants (vyanjan) - common ones
  '2325': 'क',    // Ka
  '2326': 'ख',    // Kha
  '2327': 'ग',    // Ga
  '2328': 'घ',    // Gha
  '2329': 'ङ',    // Nga
  '2330': 'च',    // Cha
  '2331': 'छ',    // Chha
  '2332': 'ज',    // Ja
  '2333': 'झ',    // Jha
  '2334': 'ञ',    // Nya
  '2335': 'ट',    // Ta (retroflex)
  '2336': 'ठ',    // Tha (retroflex)
  '2337': 'ड',    // Da (retroflex)
  '2338': 'ढ',    // Dha (retroflex)
  '2339': 'ण',    // Na (retroflex)
  '2340': 'त',    // Ta
  '2341': 'थ',    // Tha
  '2342': 'द',    // Da
  '2343': 'ध',    // Dha
  '2344': 'न',    // Na
  '2345': 'प',    // Pa
  '2346': 'फ',    // Pha
  '2347': 'ब',    // Ba
  '2348': 'भ',    // Bha
  '2349': 'म',    // Ma
  '2350': 'य',    // Ya
  '2351': 'र',    // Ra
  '2352': 'ल',    // La
  '2354': 'ळ',    // Lla
  '2355': 'व',    // Va
  '2357': 'श',    // Sha
  '2358': 'ष',    // Sha (retroflex)
  '2359': 'स',    // Sa
  '2360': 'ह',    // Ha
  
  // Common conjuncts
  '2395': 'ज्ञ',  // JNYA (gya)
  '2381': 'क्ष',  // KSHA
  '2380': 'त्र',  // TRA
  '2382': 'श्र',  // SHRA
  
  // Nukta characters
  '2329': 'ड़',   // DDA with nukta
  '2330': 'ढ़',   // DDHA with nukta
  '2332': 'ज़',   // ZA (ja with nukta)
  '2346': 'फ़',   // FA (pha with nukta)
};

/**
 * Main Hindi Typing Converter - Professional IME Engine
 * Handles both Remington and InScript layouts with advanced features
 * Includes Alt code support for both layouts
 */
export class HindiTypingConverter {
  constructor(layout = 'remington') {
    this.layout = layout.toLowerCase();
    this.remington = new RemingtonConverter();
    this.inscript = new InScriptConverter();
    this.altCodeBuffer = '';  // Buffer for Alt code numeric input
    this.altKeyPressed = false; // Track Alt key state
  }

  /**
   * Set the typing layout
   */
  setLayout(layout) {
    this.layout = layout.toLowerCase();
    this.remington.clearBuffer();
  }

  /**
   * Handle Alt code input (Alt + numeric keypad)
   * @param {string} code - Numeric code string
   * @returns {string|null} - Hindi character or null
   */
  handleAltCode(code) {
    if (!code || code.length === 0) return null;
    
    // Check direct mapping first
    if (ALT_CODE_MAP[code]) {
      return ALT_CODE_MAP[code];
    }
    
    // Try to convert numeric code to Unicode character directly
    const codeNum = parseInt(code, 10);
    if (!isNaN(codeNum) && codeNum >= 0) {
      // Check Devanagari Unicode range: U+0900 to U+097F (2304-2431)
      if (codeNum >= 2304 && codeNum <= 2431) {
        try {
          return String.fromCharCode(codeNum);
        } catch (e) {
          return null;
        }
      }
      // Also support common ASCII codes
      if (codeNum >= 32 && codeNum <= 126) {
        try {
          return String.fromCharCode(codeNum);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Handle keydown event for Alt code detection
   * Should be called on keydown, not keypress
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if Alt code is being processed
   */
  handleKeyDown(event) {
    const key = event.key;
    const alt = event.altKey;
    const ctrl = event.ctrlKey;
    
    // Track Alt key press
    if (key === 'Alt' || key === 'AltLeft' || key === 'AltRight') {
      this.altKeyPressed = true;
      this.altCodeBuffer = '';
      return false; // Don't prevent default for Alt key itself
    }
    
    // Handle Alt code input (Alt + numeric keypad)
    if (this.altKeyPressed && alt && !ctrl) {
      // Check if it's a numeric keypad key
      const numericKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const numpadKeys = ['Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 
                          'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9'];
      
      let digit = null;
      if (numericKeys.includes(key)) {
        digit = key;
      } else if (numpadKeys.includes(key)) {
        digit = key.replace('Numpad', '');
      }
      
      if (digit !== null) {
        event.preventDefault();
        this.altCodeBuffer += digit;
        return true; // Alt code is being processed
      } else if (key !== 'Alt' && key !== 'AltLeft' && key !== 'AltRight') {
        // Non-numeric key pressed while Alt is held - clear buffer
        this.altCodeBuffer = '';
        this.altKeyPressed = false;
      }
    }
    
    return false;
  }
  
  /**
   * Handle keyup event to process Alt code when Alt is released
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {object|null} - Conversion result or null
   */
  handleKeyUp(event) {
    const key = event.key;
    const alt = event.altKey;
    
    // Check if Alt key was released
    if ((key === 'Alt' || key === 'AltLeft' || key === 'AltRight') && !alt) {
      // Alt was released, process any buffered code
      if (this.altCodeBuffer.length > 0) {
        const altChar = this.handleAltCode(this.altCodeBuffer);
        const buffer = this.altCodeBuffer;
        this.altCodeBuffer = '';
        this.altKeyPressed = false;
        
        if (altChar) {
          return {
            char: altChar,
            altCode: buffer,
            isAltCode: true
          };
        }
      }
      this.altKeyPressed = false;
      this.altCodeBuffer = '';
    }
    
    return null;
  }

  /**
   * Handle keypress event and convert to Hindi
   * Returns detailed conversion result with cursor information
   * 
   * @param {KeyboardEvent} event - Keyboard event
   * @param {string} currentText - Current text in input
   * @param {number} selectionStart - Cursor start position
   * @param {number} selectionEnd - Cursor end position
   * @returns {object|null} - Conversion result or null
   */
  handleKeyPress(event, currentText = '', selectionStart = 0, selectionEnd = 0) {
    let key = event.key;
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Mobile/IME fallback: when key is "Unidentified", try to derive from event.code (e.g. KeyS -> s)
    if (key === 'Unidentified' && event.code) {
      const code = event.code;
      if (code.startsWith('Key') && code.length === 4) {
        const letter = code.charAt(3);
        key = shift ? letter.toUpperCase() : letter.toLowerCase();
      } else if (code.startsWith('Digit') && code.length === 6) {
        key = code.charAt(5);
      }
    }
    if (key === 'Unidentified' || key.length !== 1) {
      return null; // Cannot convert
    }
    
    // Skip Alt code processing in keypress (handled in keydown/keyup)
    if (alt && this.altCodeBuffer.length > 0) {
      // Alt code is being buffered, skip normal processing
      return null;
    }
    
    // Handle special keys (don't convert)
    if (key === 'Backspace' || key === 'Delete' || key === 'Enter' || 
        key === 'Tab' || key === 'Escape' || 
        key === 'ArrowLeft' || key === 'ArrowRight' || 
        key === 'ArrowUp' || key === 'ArrowDown' ||
        key === 'Home' || key === 'End' || 
        key === 'PageUp' || key === 'PageDown' ||
        key === 'Control' || key === 'Alt' || key === 'Meta') {
      return null; // Let browser handle these
    }

    // Space always passes through; other keys (punctuation, numbers) go to Remington for mapping
    if (key === ' ') {
      return null;
    }

    // Use selection positions if provided, otherwise fallback to text length
    const cursorPos = selectionStart !== undefined ? selectionStart : currentText.length;
    const cursorEnd = selectionEnd !== undefined ? selectionEnd : cursorPos;

    // Convert based on layout
    if (this.layout === 'inscript') {
      const hindiChar = this.inscript.convertKey(key, shift);
      if (hindiChar !== key) {
        event.preventDefault();
        return {
          char: hindiChar,
          replaceStart: cursorPos,
          replaceLength: cursorEnd - cursorPos,
          cursorOffset: hindiChar.length
        };
      }
      return null;
    } else {
      // Remington (phonetic)
      const result = this.remington.convertKey(key, currentText, cursorPos, shift);
      if (result) {
        event.preventDefault();
        return {
          char: result.char,
          replaceStart: result.replaceStart !== undefined ? result.replaceStart : cursorPos,
          replaceLength: result.replaceLength !== undefined ? result.replaceLength : (cursorEnd - cursorPos),
          cursorOffset: result.cursorOffset !== undefined ? result.cursorOffset : result.char.length
        };
      }
      // No conversion - let it pass through
      return null;
    }
  }

  /**
   * Handle backspace with Unicode cluster awareness
   * Returns deletion information for proper handling
   */
  handleBackspace(currentText, selectionStart, selectionEnd) {
    if (selectionStart !== selectionEnd) {
      // Selection exists - delete selection
      return {
        deleteStart: selectionStart,
        deleteLength: selectionEnd - selectionStart,
        newCursorPos: selectionStart
      };
    }
    
    if (selectionStart <= 0) {
      return null; // Nothing to delete
    }
    
    // Delete previous Unicode cluster
    const clusterStart = getPreviousClusterStart(currentText, selectionStart);
    return {
      deleteStart: clusterStart,
      deleteLength: selectionStart - clusterStart,
      newCursorPos: clusterStart
    };
  }

  /**
   * Convert full text (for batch conversion)
   */
  convertText(text) {
    if (this.layout === 'inscript') {
      return this.inscript.convertText(text);
    } else {
      return this.remington.convertText(text);
    }
  }

  /**
   * Clear internal buffer
   */
  clearBuffer() {
    this.remington.clearBuffer();
    this.altCodeBuffer = '';
    this.altKeyPressed = false;
  }
  
  /**
   * Process buffered Alt code (called after timeout)
   * @returns {string|null} - Hindi character or null
   */
  processAltCodeBuffer() {
    if (this.altCodeBuffer.length > 0) {
      const altChar = this.handleAltCode(this.altCodeBuffer);
      this.altCodeBuffer = '';
      this.altKeyPressed = false;
      return altChar;
    }
    return null;
  }
}

// Export singleton instance
export const hindiTypingConverter = new HindiTypingConverter('remington');

// Export utility functions
export function convertToHindi(text, layout = 'remington') {
  const converter = new HindiTypingConverter(layout);
  return converter.convertText(text);
}

export function isHindiCharacter(char) {
  return /[\u0900-\u097F]/.test(char);
}

export function isEnglishCharacter(char) {
  return /[a-zA-Z]/.test(char);
}

/**
 * Get Unicode cluster boundaries for proper cursor movement
 */
export function getClusterBoundaries(text, position) {
  const start = getPreviousClusterStart(text, position);
  const length = getClusterLength(text, start);
  return { start, end: start + length };
}
