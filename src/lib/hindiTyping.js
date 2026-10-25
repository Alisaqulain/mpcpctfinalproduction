/**
 * Professional Hindi IME Engine
 * CPCTMaster-style Hindi Typing Conversion Library
 * Supports Remington Gail and InScript fixed keyboard layouts
 *
 * SINGLE SOURCE: This Remington layout is used everywhere Hindi Remington is enabled:
 * - Admin (HindiTextarea for CPCT/lesson/exercise Hindi content)
 * - Learning (TypingArea with Hindi)
 * - Skill test (typing page)
 * - Exam (ExamTypingInterface)
 * - Mobile keyboard (same conversion via handleInputChange when keydown is Unidentified)
 *
 * Features:
 * - Exact physical-key conversion for both layouts
 * - Shift-row and number-row mappings
 * - Unicode cluster-aware backspace
 * - Smart cursor management
 * - Works in middle of text
 */

/**
 * Complete Remington Gail Hindi Mapping.
 * Every physical key maps independently; Unicode shaping forms the visible syllable.
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
  
};

/**
 * Remington Gail Shift mappings (key = character produced when shift is held)
 * Shift+A and Shift+G = no mapping (user requested nothing on them).
 */
const REMINGTON_SHIFT_CONSONANT_MAP = {
  // Home row shift (CPCT Remington Gail — half forms use halant ्)
  'A': 'ा', 'S': 'ै', 'D': 'क्', 'F': 'थ्', 'G': 'ळ', 'H': 'भ्', 'J': 'श्र', 'K': 'ज्ञ', 'L': 'स्',
  ':': 'रु', '"': 'ष्', '|': ')',   // Shift+; = रु, Shift+' = ष्, Shift+\ = )
  
  // Upper row shift
  'Q': 'फ', 'W': 'ॅ', 'E': 'म्', 'R': 'त्', 'T': 'ज्', 'Y': 'ल्', 'U': 'न्', 'I': 'प्', 'O': 'व्', 'P': 'च्',
  '{': 'क्ष्', '}': 'द्व',
  
  // Lower row shift
  'Z': 'र्', 'X': 'ग्', 'C': 'ब्', 'V': 'ट', 'B': 'ठ', 'N': 'छ', 'M': 'ड',
  '<': 'ढ', '>': 'झ', '?': 'घ',
  
  // Number row shift (key = shifted character: ~!@#$%^&*()_+)
  '~': 'द्य', '!': '।', '@': '/', '#': 'ः', '$': '*', '%': '-', '^': "'", '&': "'",
  '*': 'द्ध', '(': 'त्र', ')': 'ऋ', '_': '.', '+': '्',
};

/**
 * Complete InScript Hindi Keyboard Mapping (CPCT / standard physical layout)
 * Unshifted keys — matches CPCT Inscript chart (Nadeem / Mangal-style practice layout).
 */
const INSCRIPT_MAP = {
  // Top row (QWERTY)
  'q': 'ौ', 'w': 'ै', 'e': 'ा', 'r': 'ी', 't': 'ू',
  'y': 'ब', 'u': 'ह', 'i': 'ग', 'o': 'द', 'p': 'ज',
  '[': 'ड', ']': '़', '\\': 'ॉ',

  // Home row (ASDF)
  'a': 'ो', 's': 'े', 'd': '्', 'f': 'ि', 'g': 'ु',
  'h': 'प', 'j': 'र', 'k': 'क', 'l': 'त',
  ';': 'च', "'": 'ट',

  // Bottom row (ZXCV) — z has no output
  'x': 'ं', 'c': 'म', 'v': 'न', 'b': 'व',
  'n': 'ल', 'm': 'स',
  ',': ',', '.': '.', '/': 'य',

  // Number row (0–9 pass through when not listed)
  '`': 'ो',
  '-': '-',
  '=': 'ृ',
};

/**
 * InScript Shift mappings
 */
const INSCRIPT_SHIFT_MAP = {
  // Top row
  'Q': 'औ', 'W': 'ऐ', 'E': 'आ', 'R': 'ई', 'T': 'ऊ',
  'Y': 'भ', 'U': 'ङ', 'I': 'घ', 'O': 'ध', 'P': 'झ',
  '{': 'ड', '}': 'ञ',

  // Home row
  'A': 'ओ', 'S': 'ए', 'D': 'अ', 'F': 'इ', 'G': 'उ',
  'H': 'फ', 'K': 'ख', 'L': 'थ',
  ':': 'च', '"': 'ट',

  // Bottom row — Z, V, B have no output
  'X': 'ँ', 'C': 'ण', 'N': 'ळ', 'M': 'श',
  '<': ',', '>': '.', '?': 'य',

  // Shift + number row
  '~': 'ओ',
  '@': 'ॅ', '#': '्र', '$': 'र्', '%': 'ज्ञ', '^': 'त्र', '&': 'क्ष', '*': 'श्र',
  '(': '(', ')': ')',
  '_': 'ः', '+': 'ऋ',
};

/** Keys that produce no character in InScript (still consume the keypress). */
const INSCRIPT_SILENT_KEYS = new Set(['z', 'Z', 'V', 'B', 'J']);

function isDevanagariConsonant(code) {
  return code >= 0x0915 && code <= 0x0939;
}

/** अ + a following matra is one vowel (आ, ई, उ, …). ि is handled separately. */
const A_WITH_MATRA = {
  '\u093E': '\u0906', // ा आ
  '\u0940': '\u0908', // ी ई
  '\u0941': '\u0909', // ु उ
  '\u0942': '\u090A', // ू ऊ
  '\u0943': '\u090B', // ृ ऋ
  '\u0944': '\u0960', // ॄ ॠ
  '\u0945': '\u090D', // ॅ ऍ
  '\u0947': '\u090F', // े ए
  '\u0948': '\u0910', // ै ऐ
  '\u0949': '\u0911', // ॉ ऑ
  '\u094B': '\u0913', // ो ओ
  '\u094C': '\u0914', // ौ औ
};

function composeAWithMatra(text, skipRightI = false) {
  if (!text.includes('\u0905')) return text;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const nextSign = text[i + 1];
    const next = A_WITH_MATRA[nextSign];
    // ी after अ is ई, except a short-i that is only parked on the right
    // until its consonant is finished (अीध् must not become ईध्).
    const parkedOnHalf =
      nextSign === '\u0940' &&
      (skipRightI || isDevanagariConsonant(text.charCodeAt(i + 2) || 0));
    if (text[i] === '\u0905' && next && !parkedOnHalf) {
      out += next;
      i++;
      continue;
    }
    out += text[i];
  }
  return out;
}

/** How far a consonant cluster extends, including a trailing halant. */
function readConsonantCluster(s, j) {
  const start = j;
  let openHalant = false;
  while (j < s.length && isDevanagariConsonant(s.charCodeAt(j))) {
    j++;
    if (s.charCodeAt(j) === 0x093C) j++;
    if (s.charCodeAt(j) === 0x094D) {
      if (isDevanagariConsonant(s.charCodeAt(j + 1) || 0)) {
        j++;
        continue;
      }
      openHalant = true;
      j++;
      break;
    }
    break;
  }
  return { start, end: j, openHalant };
}

/**
 * Remington types several full letters as half-letter + ा (ध् + ा = ध).
 * A short ि that already moved onto that half letter is kept: ध्ि + ा = धि.
 */
function completeHalantWithAa(text) {
  if (!text.includes('\u094D')) return text;
  return text.replace(/([\u0915-\u0939]\u093C?)\u094D(\u093F?)\u093E/g, '$1$2');
}

/**
 * Put Hindi into Unicode order so the font can shape it.
 * Remington lessons and Remington typing put ि before the consonant
 * (typewriter order). Unicode needs the consonant first, then ि,
 * otherwise the short i-matra stays on a dotted circle.
 * Spaces typed between a halant and the next consonant are removed
 * so half-letters join (क्त, ज्ञ).
 */
export function normalizeDevanagariOrder(text, keepIAfterVowel = false) {
  if (!text) return text;

  let s = text;
  if (s.includes('\u094D')) {
    s = s.replace(
      /([\u0915-\u0939]\u093C?)[ \t\n\r]+(\u094D)[ \t\n\r]*([\u0915-\u0939])/g,
      '$1$2$3'
    );
    s = s.replace(/(\u094D)[ \t\n\r]+([\u0915-\u0939])/g, '$1$2');
  }

  // ध् + ा is one letter ध, before ि is attached to it.
  s = completeHalantWithAa(s);

  // V+F parks ि as ी on the right of अ. Once the consonant is finished,
  // that ी is the short ि and belongs on the consonant (अधि, not अीध).
  if (keepIAfterVowel && s.includes('\u0940')) {
    let restored = '';
    for (let i = 0; i < s.length; i++) {
      if (
        s[i] === '\u0905' &&
        s[i + 1] === '\u0940' &&
        isDevanagariConsonant(s.charCodeAt(i + 2) || 0)
      ) {
        const cluster = readConsonantCluster(s, i + 2);
        if (!cluster.openHalant) {
          restored += '\u0905\u093F';
          i++;
          continue;
        }
      }
      restored += s[i];
    }
    s = restored;
  }

  if (!s.includes('\u093F')) return composeAWithMatra(s);

  let out = '';
  let parkedShortI = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== '\u093F') {
      out += ch;
      continue;
    }

    const prev = i > 0 ? s.charCodeAt(i - 1) : 0;
    const alreadyOnLetter = isDevanagariConsonant(prev) || prev === 0x093C;
    const afterVowel = keepIAfterVowel && prev >= 0x0904 && prev <= 0x0914;
    if (alreadyOnLetter) {
      out += ch;
      continue;
    }

    let j = i + 1;
    if (!isDevanagariConsonant(s.charCodeAt(j) || 0)) {
      // V then F, with no consonant yet: show the matra on the right of अ.
      if (keepIAfterVowel && prev === 0x0905) {
        out += '\u0940';
        parkedShortI = true;
        continue;
      }
      if (afterVowel) {
        out += ch;
        continue;
      }
      out += ch;
      continue;
    }

    const cluster = readConsonantCluster(s, j);
    // Half letter is not finished (ध्). Keep the matra on अ until ा completes it.
    if (keepIAfterVowel && prev === 0x0905 && cluster.openHalant) {
      out += '\u0940';
      parkedShortI = true;
      continue;
    }

    out += s.slice(cluster.start, cluster.end) + '\u093F';
    i = cluster.end - 1;
  }

  return composeAWithMatra(out, parkedShortI);
}

/** Same as normalizeDevanagariOrder, keeping the caret with the typed syllable. */
export function normalizeDevanagariWithCursor(text, cursor) {
  const value = text || '';
  const safeCursor = Math.max(0, Math.min(cursor || 0, value.length));
  const normalized = normalizeDevanagariOrder(value, true);
  if (safeCursor >= value.length) {
    return { text: normalized, cursor: normalized.length };
  }
  const left = normalizeDevanagariOrder(value.slice(0, safeCursor), true);
  return { text: normalized, cursor: Math.min(left.length, normalized.length) };
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
    this.buffer = '';
  }

  /**
   * Convert a keypress to Hindi character
   * Handles halant, matras, and conjunct formation
   * Based on Mangal Font Remington Layout
   */
  convertKey(key, currentText = '', cursorPos = 0, shiftKey = false) {
    const shiftedKey = key.length === 1 && /[a-z]/i.test(key)
      ? key.toUpperCase()
      : key;
    const mapped = shiftKey
      ? REMINGTON_SHIFT_CONSONANT_MAP[shiftedKey]
      : REMINGTON_MAP[key.toLowerCase()];

    if (mapped === undefined) return null;

    return {
      char: mapped,
      cursorOffset: mapped.length
    };
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

    return Array.from(text, (char) => {
      const shifted = (
        (/[A-Z]/.test(char)) ||
        Object.prototype.hasOwnProperty.call(REMINGTON_SHIFT_CONSONANT_MAP, char)
      );
      const result = this.convertKey(char, '', 0, shifted);
      return result ? result.char : char;
    }).join('');
  }
}

/**
 * InScript Converter
 * Direct key-to-character mapping with Shift support
 */
class InScriptConverter {
  /**
   * Convert a keypress to Hindi character.
   * @returns {string|null|undefined} Hindi char, null = silent key, undefined = pass through
   */
  convertKey(key, shift = false) {
    if (INSCRIPT_SILENT_KEYS.has(key)) {
      return null;
    }

    const resolve = (map, k) => {
      if (Object.prototype.hasOwnProperty.call(map, k)) {
        return map[k];
      }
      if (k.length === 1 && /[a-z]/i.test(k)) {
        const alt = k === k.toLowerCase() ? k.toUpperCase() : k.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(map, alt)) {
          return map[alt];
        }
      }
      return undefined;
    };

    if (shift) {
      const shifted = resolve(INSCRIPT_SHIFT_MAP, key);
      if (shifted !== undefined) {
        return shifted;
      }
      const upper = key.length === 1 ? key.toUpperCase() : key;
      const shiftedUpper = resolve(INSCRIPT_SHIFT_MAP, upper);
      if (shiftedUpper !== undefined) {
        return shiftedUpper;
      }
    }

    const normal = resolve(INSCRIPT_MAP, key.toLowerCase());
    if (normal !== undefined) {
      return normal;
    }

    return undefined;
  }

  /**
   * Convert full text
   */
  convertText(text) {
    let result = '';
    for (const char of text) {
      const shifted = (
        /[A-Z]/.test(char) ||
        Object.prototype.hasOwnProperty.call(INSCRIPT_SHIFT_MAP, char)
      );
      const hindiChar = this.convertKey(char, shifted);
      if (hindiChar === null) continue;
      result += hindiChar !== undefined ? hindiChar : char;
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
      if (hindiChar === null) {
        event.preventDefault();
        return {
          char: '',
          replaceStart: cursorPos,
          replaceLength: 0,
          cursorOffset: 0
        };
      }
      if (hindiChar !== undefined) {
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
