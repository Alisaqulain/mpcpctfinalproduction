/**
 * Hindi IME Engine - Usage Examples
 * 
 * This file demonstrates how to use the professional Hindi typing IME engine
 * in various scenarios including React components, vanilla JS, and text areas.
 */

import { HindiTypingConverter, convertToHindi, getClusterBoundaries } from './hindiTyping';

// ============================================================================
// Example 1: Basic Usage in React Component
// ============================================================================

/*
import { useHindiTyping } from '@/hooks/useHindiTyping';

function HindiTypingComponent() {
  const [text, setText] = useState('');
  const [layout, setLayout] = useState('remington');
  const hindiTyping = useHindiTyping(layout, true);

  return (
    <div>
      <div>
        <button onClick={() => setLayout('remington')}>Remington</button>
        <button onClick={() => setLayout('inscript')}>InScript</button>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          hindiTyping.handleKeyDown(e, text, setText);
        }}
        placeholder="Type in Hindi..."
      />
    </div>
  );
}
*/

// ============================================================================
// Example 2: Direct Converter Usage (Vanilla JavaScript)
// ============================================================================

function setupHindiTyping(textarea, layout = 'remington') {
  const converter = new HindiTypingConverter(layout);
  
  textarea.addEventListener('keydown', (event) => {
    const currentText = textarea.value;
    const selectionStart = textarea.selectionStart || 0;
    const selectionEnd = textarea.selectionEnd || selectionStart;
    
    // Handle backspace
    if (event.key === 'Backspace' && !event.ctrlKey && !event.metaKey) {
      const result = converter.handleBackspace(currentText, selectionStart, selectionEnd);
      if (result) {
        event.preventDefault();
        const newValue = 
          currentText.substring(0, result.deleteStart) + 
          currentText.substring(result.deleteStart + result.deleteLength);
        textarea.value = newValue;
        textarea.selectionStart = textarea.selectionEnd = result.newCursorPos;
        return;
      }
    }
    
    // Handle regular keypress
    const result = converter.handleKeyPress(event, currentText, selectionStart, selectionEnd);
    
    if (result && result.char) {
      const replaceStart = result.replaceStart || selectionStart;
      const replaceLength = result.replaceLength || 0;
      const newValue = 
        currentText.substring(0, replaceStart) + 
        result.char + 
        currentText.substring(replaceStart + replaceLength);
      
      textarea.value = newValue;
      const newCursorPos = replaceStart + (result.cursorOffset || result.char.length);
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    }
  });
  
  // Switch layout function
  return {
    switchLayout: (newLayout) => converter.setLayout(newLayout),
    clearBuffer: () => converter.clearBuffer()
  };
}

// ============================================================================
// Example 3: Remington Layout Features
// ============================================================================

function demonstrateRemingtonFeatures() {
  const converter = new HindiTypingConverter('remington');
  
  // Normal key = full consonant
  // Type: "k" → "क"
  // Type: "d" → "द"
  
  // Shift + key = half consonant (halant)
  // Type: Shift+"k" → "क्"
  // Type: Shift+"d" → "द्"
  
  // Multi-key sequences
  // Type: "kh" → "ख"
  // Type: "aa" → "आ"
  // Type: "gya" → "ज्ञ"
  // Type: "ksh" → "क्ष"
  
  // Automatic conjunct formation
  // Type: "k" + Shift+"k" + "sh" → "क्" + "ष" → "क्ष"
  // Type: "j" + Shift+"j" + "ny" → "ज्" + "ञ" → "ज्ञ"
  
  // Matra handling
  // Type: "k" + "a" → "क" + "ा" → "का"
  // Type: "k" + "i" → "क" + "ि" → "कि"
  // Type: "k" + "u" → "क" + "ु" → "कु"
  // Type: "k" + "e" → "क" + "े" → "के"
  // Type: "k" + "o" → "क" + "ो" → "को"
  // Type: "k" + "ai" → "क" + "ै" → "कै"
  // Type: "k" + "au" → "क" + "ौ" → "कौ"
  
  console.log('Remington features demonstrated');
}

// ============================================================================
// Example 4: InScript Layout Features
// ============================================================================

function demonstrateInScriptFeatures() {
  const converter = new HindiTypingConverter('inscript');
  
  // Direct key mapping
  // Press "q" → "ञ"
  // Press "w" → "ठ"
  // Press "e" → "े"
  // Press "a" → "अ"
  // Press "k" → "क"
  
  // Shift for alternate characters
  // Press Shift+"q" → "ञ" (if mapped)
  // Press "," → "्" (halant)
  
  console.log('InScript features demonstrated');
}

// ============================================================================
// Example 5: Batch Text Conversion
// ============================================================================

function convertTextExample() {
  // Convert entire text at once
  const englishText = "namaste duniya";
  const hindiText = convertToHindi(englishText, 'remington');
  console.log(`${englishText} → ${hindiText}`);
  // Output: "namaste duniya → नमस्ते दुनिया"
}

// ============================================================================
// Example 6: Switching Between Layouts
// ============================================================================

function switchLayoutExample() {
  const converter = new HindiTypingConverter('remington');
  
  // Switch to InScript
  converter.setLayout('inscript');
  
  // Switch back to Remington
  converter.setLayout('remington');
  
  // Layouts work independently with their own buffers
}

// ============================================================================
// Example 7: Unicode Cluster Handling
// ============================================================================

function clusterHandlingExample() {
  const text = "कक्षा"; // "class" in Hindi
  
  // Get cluster boundaries
  const cluster1 = getClusterBoundaries(text, 0); // "क"
  const cluster2 = getClusterBoundaries(text, 1); // "क्ष"
  const cluster3 = getClusterBoundaries(text, 2); // "ा"
  
  console.log('Cluster boundaries:', cluster1, cluster2, cluster3);
  
  // Backspace properly deletes entire clusters, not individual code units
}

// ============================================================================
// Example 8: Typing in Middle of Text
// ============================================================================

function typingInMiddleExample() {
  // The IME engine properly handles typing when cursor is in the middle
  // It maintains cursor position and correctly replaces text
  
  // Example: Text = "नमस्ते"
  // Cursor at position 2 (after "न")
  // Type "k" → "क" is inserted at cursor position
  // Cursor moves to position 3 (after "क")
}

// ============================================================================
// Example 9: Complete React Component with All Features
// ============================================================================

/*
import React, { useState } from 'react';
import { useHindiTyping } from '@/hooks/useHindiTyping';

export default function AdvancedHindiTyping() {
  const [text, setText] = useState('');
  const [layout, setLayout] = useState('remington');
  const [enabled, setEnabled] = useState(true);
  
  const hindiTyping = useHindiTyping(layout, enabled);
  
  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    hindiTyping.switchLayout(newLayout);
  };
  
  return (
    <div className="p-4">
      <div className="mb-4 space-x-2">
        <button
          onClick={() => handleLayoutChange('remington')}
          className={`px-4 py-2 rounded ${
            layout === 'remington' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Remington
        </button>
        <button
          onClick={() => handleLayoutChange('inscript')}
          className={`px-4 py-2 rounded ${
            layout === 'inscript' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          InScript
        </button>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`px-4 py-2 rounded ${
            enabled ? 'bg-green-500 text-white' : 'bg-gray-200'
          }`}
        >
          {enabled ? 'Hindi ON' : 'Hindi OFF'}
        </button>
      </div>
      
      <div className="mb-2 text-sm text-gray-600">
        {layout === 'remington' 
          ? 'Remington: Type phonetically (k→क, kh→ख, Shift+k→क्)'
          : 'InScript: Use fixed keyboard layout'}
      </div>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          const handled = hindiTyping.handleKeyDown(e, text, setText);
          if (!handled && e.key === 'Backspace') {
            // Handle regular backspace if not handled by IME
            setText(text.slice(0, -1));
          }
        }}
        className="w-full h-64 p-4 border rounded-lg font-mono text-lg"
        placeholder="Start typing in Hindi..."
      />
      
      <div className="mt-4 text-sm text-gray-500">
        <div>Remington Tips:</div>
        <ul className="list-disc list-inside ml-4">
          <li>Normal key = full consonant (d → द)</li>
          <li>Shift + key = half consonant (Shift+d → द्)</li>
          <li>Multi-key sequences: kh, gya, ksh, aa, etc.</li>
          <li>Matras attach automatically: ka → का, ki → कि</li>
        </ul>
      </div>
    </div>
  );
}
*/

// ============================================================================
// Example 10: Testing Common Words
// ============================================================================

function testCommonWords() {
  const converter = new HindiTypingConverter('remington');
  
  const testCases = [
    'namaste',      // नमस्ते
    'duniya',       // दुनिया
    'bharat',       // भारत
    'hindi',        // हिन्दी
    'kya',          // क्या
    'kaise',        // कैसे
    'kab',          // कब
    'kahan',        // कहाँ
    'kyon',         // क्यों
    'main',         // मैं
    'tum',          // तुम
    'aap',          // आप
  ];
  
  testCases.forEach(word => {
    const converted = converter.convertText(word);
    console.log(`${word} → ${converted}`);
  });
}

// Export examples
export {
  setupHindiTyping,
  demonstrateRemingtonFeatures,
  demonstrateInScriptFeatures,
  convertTextExample,
  switchLayoutExample,
  clusterHandlingExample,
  typingInMiddleExample,
  testCommonWords
};
