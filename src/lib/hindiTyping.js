/**
 * CPCTMaster-style Hindi Typing Conversion Library
 * Supports Remington (phonetic) and InScript (fixed layout) Hindi typing
 * 
 * Converts English/Roman keypresses to Hindi Unicode in real-time
 * without requiring keyboard changes.
 */

/**
 * Complete Remington Gail (Phonetic) Hindi Mapping
 * Maps Roman characters to Hindi based on phonetic similarity
 * This is the standard Remington phonetic mapping used in CPCT
 */
const REMINGTON_MAP = {
  // Basic vowels (swar)
  'a': 'अ', 'aa': 'आ', 'A': 'आ', 'i': 'इ', 'ee': 'ई', 'I': 'ई',
  'u': 'उ', 'oo': 'ऊ', 'U': 'ऊ', 'e': 'ए', 'E': 'ए',
  'ai': 'ऐ', 'o': 'ओ', 'O': 'ओ', 'au': 'औ',
  'ri': 'ऋ', 'Ri': 'ऋ', 'lri': 'ऌ', 'Lri': 'ऌ',
  
  // Consonants (vyanjan) - Velar
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
  'K': 'क', 'Kh': 'ख', 'G': 'ग', 'Gh': 'घ', 'Ng': 'ङ',
  
  // Palatal
  'c': 'च', 'ch': 'छ', 'C': 'च', 'Ch': 'छ',
  'j': 'ज', 'jh': 'झ', 'J': 'ज', 'Jh': 'झ',
  'ny': 'ञ', 'Ny': 'ञ',
  
  // Retroflex
  'T': 'ट', 'Th': 'ठ', 'D': 'ड', 'Dh': 'ढ', 'N': 'ण',
  
  // Dental
  't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
  'T': 'त', 'Th': 'थ', 'D': 'द', 'Dh': 'ध', 'N': 'न',
  
  // Labial
  'p': 'प', 'ph': 'फ', 'P': 'प', 'Ph': 'फ',
  'f': 'फ', 'F': 'फ', // 'f' maps to 'फ' (pha) in Remington
  'b': 'ब', 'bh': 'भ', 'B': 'ब', 'Bh': 'भ',
  'm': 'म', 'M': 'म',
  
  // Semivowels and others
  'y': 'य', 'Y': 'य', 'r': 'र', 'R': 'र',
  'l': 'ल', 'L': 'ल', 'v': 'व', 'V': 'व', 'w': 'व', 'W': 'व',
  'sh': 'श', 'Sh': 'श', 's': 'स', 'S': 'स',
  'h': 'ह', 'H': 'ह',
  
  // Special consonants
  'q': 'क', 'Q': 'क', 'x': 'क्ष', 'X': 'क्ष',
  'z': 'ज', 'Z': 'ज',
  
  // Matras (vowel signs) - these attach to consonants
  // Note: These are handled contextually in the converter
  
  // Special characters
  '.': '।', '|': '॥',
  
  // Numbers
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

/**
 * Complete InScript Hindi Keyboard Mapping
 * Standard InScript layout - fixed key positions
 */
const INSCRIPT_MAP = {
  // Top row (QWERTY)
  'q': 'ञ', 'Q': 'ञ',
  'w': 'ठ', 'W': 'ठ',
  'e': 'े', 'E': 'े',
  'r': 'ृ', 'R': 'ृ',
  't': 'त', 'T': 'त',
  'y': 'य', 'Y': 'य',
  'u': 'ू', 'U': 'ू',
  'i': 'ि', 'I': 'ि',
  'o': 'ो', 'O': 'ो',
  'p': 'प', 'P': 'प',
  
  // Second row (ASDF)
  'a': 'अ', 'A': 'अ',
  's': 'स', 'S': 'स',
  'd': 'द', 'D': 'द',
  'f': 'ध', 'F': 'ध',
  'g': 'ग', 'G': 'ग',
  'h': 'ह', 'H': 'ह',
  'j': 'ज', 'J': 'ज',
  'k': 'क', 'K': 'क',
  'l': 'ल', 'L': 'ल',
  
  // Third row (ZXCV)
  'z': 'ज़', 'Z': 'ज़',
  'x': 'क्ष', 'X': 'क्ष',
  'c': 'च', 'C': 'च',
  'v': 'व', 'V': 'व',
  'b': 'ब', 'B': 'ब',
  'n': 'न', 'N': 'न',
  'm': 'म', 'M': 'म',
  
  // Special keys
  '[': '्र', '{': '्र',
  ']': 'ज्ञ', '}': 'ज्ञ',
  ';': 'ः', ':': 'ः',
  "'": 'ँ', '"': 'ँ',
  ',': '्', '<': '्',
  '.': '।', '>': '।',
  '/': '?', '?': '?',
  '~': 'ँ', '`': 'ँ',
  
  // Numbers
  '1': '१', '2': '२', '3': '३', '4': '४', '5': '५',
  '6': '६', '7': '७', '8': '८', '9': '९', '0': '०',
};

/**
 * Remington Converter with real-time phonetic conversion
 * Handles multi-character sequences by checking end of current text
 */
class RemingtonConverter {
  /**
   * Convert a keypress to Hindi character
   * Checks the end of current text for valid Remington sequences
   */
  convertKey(key, currentText = '') {
    const lowerKey = key.toLowerCase();
    
    // Get the last few characters from current text + new key
    // Check sequences of length 3, 2, then 1
    const checkText = (currentText.slice(-2) + lowerKey).toLowerCase();
    
    // Try 3-character sequence first
    if (checkText.length >= 3) {
      const threeChar = checkText.slice(-3);
      if (REMINGTON_MAP[threeChar]) {
        return {
          char: REMINGTON_MAP[threeChar],
          replaceLength: 3 // Replace last 3 chars (2 from text + 1 new)
        };
      }
    }
    
    // Try 2-character sequence
    if (checkText.length >= 2) {
      const twoChar = checkText.slice(-2);
      if (REMINGTON_MAP[twoChar]) {
        return {
          char: REMINGTON_MAP[twoChar],
          replaceLength: 2 // Replace last 2 chars (1 from text + 1 new)
        };
      }
    }
    
    // Try single character
    if (REMINGTON_MAP[lowerKey]) {
      return {
        char: REMINGTON_MAP[lowerKey],
        replaceLength: 1 // Replace just the new char
      };
    }
    
    // No match - return null to let it pass through
    return null;
  }

  /**
   * Clear function (for compatibility, not needed with new approach)
   */
  clearBuffer() {
    // No-op - we don't use buffer anymore
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
      
      // Try 3-char, then 2-char, then 1-char
      if (threeChar && REMINGTON_MAP[threeChar.toLowerCase()]) {
        result += REMINGTON_MAP[threeChar.toLowerCase()];
        i += 3;
      } else if (twoChar && REMINGTON_MAP[twoChar.toLowerCase()]) {
        result += REMINGTON_MAP[twoChar.toLowerCase()];
        i += 2;
      } else if (REMINGTON_MAP[char]) {
        result += REMINGTON_MAP[char];
        i += 1;
      } else {
        // No mapping - keep original (spaces, punctuation, etc.)
        result += char;
        i += 1;
      }
    }
    
    return result;
  }
}

/**
 * InScript Converter
 * Direct key-to-character mapping
 */
class InScriptConverter {
  /**
   * Convert a keypress to Hindi character
   */
  convertKey(key, shift = false) {
    const lookupKey = shift ? key.toUpperCase() : key;
    
    if (INSCRIPT_MAP[lookupKey]) {
      return INSCRIPT_MAP[lookupKey];
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
 * Main Hindi Typing Converter
 * Handles both Remington and InScript layouts with real-time conversion
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
   * @param {KeyboardEvent} event - Keyboard event
   * @param {string} currentText - Current text in input
   * @returns {object|null} - {char: string, replaceLength: number} or null
   */
  handleKeyPress(event, currentText = '') {
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

    // Convert based on layout
    if (this.layout === 'inscript') {
      const hindiChar = this.inscript.convertKey(key, shift);
      if (hindiChar !== key) {
        event.preventDefault();
        return {
          char: hindiChar,
          replaceLength: 1
        };
      }
      return null;
    } else {
      // Remington (phonetic)
      const result = this.remington.convertKey(key, currentText);
      if (result) {
        event.preventDefault();
        return result;
      }
      // No conversion - let it pass through
      return null;
    }
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
