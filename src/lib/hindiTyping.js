/**
 * Professional Hindi IME Engine
 * CPCTMaster-style Hindi Typing Conversion Library
 * Supports Remington (phonetic) and InScript (fixed layout) Hindi typing
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
 * Maps Roman characters to Hindi based on phonetic similarity
 * Based on Mangal Font Remington Layout
 * 
 * Key feature: Shift + consonant = halant (half consonant)
 * Example: Shift+d → क्, then type 'r' → forms 'क्त'
 */
const REMINGTON_MAP = {
  // Basic vowels (swar) - standalone
  'a': 'अ', 'aa': 'आ', 'A': 'आ', 
  'i': 'इ', 'ee': 'ई', 'I': 'ई',
  'u': 'उ', 'oo': 'ऊ', 'U': 'ऊ', 
  'e': 'ए', 'E': 'ए',
  'ai': 'ऐ', 'o': 'ओ', 'O': 'ओ', 'au': 'औ',
  'ri': 'ऋ', 'Ri': 'ऋ', 'lri': 'ऌ', 'Lri': 'ऌ',
  
  // Consonants (vyanjan) - Based on Remington layout
  // Home row mappings (ASDF...)
  'd': 'क',      // D = क
  'f': 'ि',      // F = इ matra
  'g': 'ह',      // G = ह
  'h': '़',      // H = nukta
  'j': 'र',      // J = र
  'k': 'ा',      // K = आ matra
  'l': 'स',      // L = स
  ';': 'य',      // ; = य
  "'": 'श',      // ' = श
  
  // Top row mappings (QWERTY...)
  'q': 'ौ',      // Q = औ matra (also ृ, ऒ)
  'w': 'ॉ',      // W = ऑ matra (also ॊ, ॅ)
  'e': 'म',      // E = म
  'r': 'त',      // R = त
  't': 'ज',      // T = ज
  'y': 'ल',      // Y = ल
  'u': 'न',      // U = न
  'i': 'प',      // I = प
  'o': 'व',      // O = व
  'p': 'च',      // P = च
  '[': 'ख',      // [ = ख
  ']': ',',      // ] = comma
  
  // Bottom row mappings (ZXCV...)
  'z': 'ड्',     // Z = ड् (retroflex da with halant)
  'x': 'ग',      // X = ग
  'c': 'ब',      // C = ब
  'v': 'अ',      // V = अ
  'b': 'इ',      // B = इ
  'n': 'द',      // N = द
  'm': 'उ',      // M = उ
  ',': 'ए',      // , = ए
  '.': 'ण',      // . = ण
  '/': 'ध',      // / = ध
  
  // Shift mappings for consonants (half forms with halant)
  // These are handled separately in convertKey method
  
  // Multi-character sequences
  'kh': 'ख', 'Kh': 'ख',
  'gh': 'घ', 'Gh': 'घ',
  'ch': 'छ', 'Ch': 'छ',
  'jh': 'झ', 'Jh': 'झ',
  'th': 'थ', 'Th': 'थ',
  'dh': 'ध', 'Dh': 'ध',
  'ph': 'फ', 'Ph': 'फ',
  'bh': 'भ', 'Bh': 'भ',
  'sh': 'श', 'Sh': 'श',
  'ny': 'ञ', 'Ny': 'ञ',
  
  // Retroflex consonants
  'T': 'ट', 'Th': 'ठ', 'D': 'ड', 'Dh': 'ढ', 'N': 'ण',
  
  // Special consonants and conjuncts
  'gya': 'ज्ञ', 'Gya': 'ज्ञ',
  'ksh': 'क्ष', 'Ksh': 'क्ष',
  'tr': 'त्र', 'Tr': 'त्र',
  'shra': 'श्र', 'Shra': 'श्र',
  
  // Special characters
  '-': 'ः',      // - = visarga
  '=': 'ऋ',      // = = ऋ
  '.': '।',      // . = danda
  '|': '॥',      // | = double danda
  
  // Numbers
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

/**
 * Remington Matra (Vowel Signs) Mapping
 * These attach to consonants
 * Based on Mangal Font Remington Layout
 */
const REMINGTON_MATRA_MAP = {
  'a': '',      // No matra (inherent 'a')
  'aa': 'ा', 'A': 'ा',  // Shift+A = ौ (double au matra)
  'i': 'ि', 'I': 'ि',   // F = इ matra, Shift+F = थ
  'ee': 'ी', 'ee': 'ी',
  'u': 'ु', 'U': 'ु',   // M = उ
  'oo': 'ू', 'oo': 'ू',
  'e': 'े', 'E': 'े',   // S = ए matra, Shift+S = ै
  'ai': 'ै',
  'o': 'ो', 'O': 'ो',   // A = ओ matra
  'au': 'ौ',            // Q = ौ matra, Shift+Q = फ
  'ri': 'ृ', 'Ri': 'ृ',
  'lri': 'ॢ', 'Lri': 'ॢ',
};

/**
 * Remington Shift mappings for consonants (half forms with halant)
 * Shift + consonant key = halant form
 * Based on Mangal Font Remington Layout
 */
const REMINGTON_SHIFT_CONSONANT_MAP = {
  // Home row - Shift gives halant
  'D': 'क्',    // Shift+D = क्
  'E': 'म्',    // Shift+E = म्
  'R': 'त्',    // Shift+R = त्
  'T': 'ज्',    // Shift+T = ज्
  'Y': 'ल्',    // Shift+Y = ल्
  'U': 'न्',    // Shift+U = न्
  'I': 'प्',    // Shift+I = प्
  'O': 'व्',    // Shift+O = व्
  'P': 'च्',    // Shift+P = च्
  
  // Bottom row - Shift gives halant or alternate
  'Z': 'र्',    // Shift+Z = र्
  'X': 'ग्',    // Shift+X = ग्
  'C': 'ब्',    // Shift+C = ब्
  'V': 'ट',     // Shift+V = ट
  'B': 'ठ',     // Shift+B = ठ
  'N': 'छ',     // Shift+N = छ
  'M': 'ड',     // Shift+M = ड
  '<': 'ढ',     // Shift+, = ढ
  '>': 'झ',     // Shift+. = झ
  '?': 'घ',     // Shift+/ = घ
  
  // Top row - Shift gives alternate characters
  'Q': 'फ',     // Shift+Q = फ (also ऍ)
  'W': 'ॊ',     // Shift+W = ॊ (also ॅ)
  '[': 'क्ष',   // Shift+[ = क्ष
  ']': 'द',     // Shift+] = द
  
  // Home row - Shift gives alternate
  'A': 'ौ',     // Shift+A = ौ (double au matra)
  'S': 'ै',     // Shift+S = ै (double e matra)
  'F': 'थ',     // Shift+F = थ
  'G': 'ळ',     // Shift+G = ळ
  'H': 'भ',     // Shift+H = भ
  'J': 'श्र',   // Shift+J = श्र
  'K': 'ज्ञ',   // Shift+K = ज्ञ
  'L': 'रु',    // Shift+L = रु
  ':': 'ष',     // Shift+; = ष
  '"': 'घ',     // Shift+' = घ
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
 * Utility: Get previous cluster start position
 */
function getPreviousClusterStart(text, cursorPos) {
  if (cursorPos <= 0) return 0;
  
  let pos = cursorPos - 1;
  
  // Move back through combining marks
  while (pos > 0) {
    const char = text[pos - 1];
    const code = char.charCodeAt(0);
    
    if (code >= 0x0900 && code <= 0x097F) {
      pos--;
    } else if (code === 0x200D || code === 0x200C) {
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
    
    // Handle Shift + consonant = halant (half consonant)
    // Based on Remington layout: Shift+D = क्, Shift+R = त्, etc.
    if (shiftKey) {
      // Check Remington shift mappings first
      if (REMINGTON_SHIFT_CONSONANT_MAP[upperKey]) {
        const shiftChar = REMINGTON_SHIFT_CONSONANT_MAP[upperKey];
        return {
          char: shiftChar,
          replaceLength: 0,
          cursorOffset: shiftChar.length
        };
      }
      
      // Fallback: try to get halant form from consonant map
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
 * Main Hindi Typing Converter - Professional IME Engine
 * Handles both Remington and InScript layouts with advanced features
 */
export class HindiTypingConverter {
  constructor(layout = 'remington') {
    this.layout = layout.toLowerCase();
    this.remington = new RemingtonConverter();
    this.inscript = new InScriptConverter();
  }

  /**
   * Set the typing layout
   */
  setLayout(layout) {
    this.layout = layout.toLowerCase();
    this.remington.clearBuffer();
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
    const key = event.key;
    const shift = event.shiftKey;
    
    // Handle special keys (don't convert)
    if (key === 'Backspace' || key === 'Delete' || key === 'Enter' || 
        key === 'Tab' || key === 'Escape' || 
        key === 'ArrowLeft' || key === 'ArrowRight' || 
        key === 'ArrowUp' || key === 'ArrowDown' ||
        key === 'Home' || key === 'End' || 
        key === 'PageUp' || key === 'PageDown' ||
        key === 'Control' || key === 'Alt' || key === 'Meta' ||
        key.length > 1) {
      return null; // Let browser handle these
    }

    // Handle space and punctuation - allow through
    if (key === ' ' || /[.,!?;:'"()\[\]{}\-_=+@#$%^&*\/\\|]/.test(key)) {
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
