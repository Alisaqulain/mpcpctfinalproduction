# Professional Hindi IME Engine

A production-ready Input Method Editor (IME) for Hindi typing that supports both **Remington (phonetic)** and **InScript (fixed layout)** keyboards, designed for CPCT exams, government typing tests, and professional Hindi input.

## ✨ Features

### ✅ Remington Layout (Phonetic)
- **Normal key** → Full consonant (e.g., `d` → `द`)
- **Shift + key** → Half consonant with halant (e.g., `Shift+d` → `द्`)
- **Multi-key sequences** → `kh` → `ख`, `gya` → `ज्ञ`, `ksh` → `क्ष`, `aa` → `आ`
- **Automatic conjunct formation** → `क्` + `ष` → `क्ष`, `ज्` + `ञ` → `ज्ञ`
- **Smart matra handling** → `ka` → `का`, `ki` → `कि`, `ku` → `कु`, `ke` → `के`, `ko` → `को`, `kai` → `कै`, `kau` → `कौ`

### ✅ InScript Layout (Fixed Keyboard)
- **Direct key mapping** → Physical key positions map to Hindi characters
- **Shift support** → Alternate characters with Shift key
- **Standard InScript layout** → Compatible with government typing tests

### ✅ General Features
- **Smart buffer management** → Handles multi-character sequences efficiently
- **Proper cursor handling** → Uses `selectionStart` and `selectionEnd` for accurate positioning
- **Works in middle of text** → Insertion and replacement work correctly at any cursor position
- **Unicode cluster-aware backspace** → Deletes complete Hindi characters, not individual code units
- **No broken characters** → Prevents invalid Unicode sequences
- **Performance optimized** → Fast real-time conversion
- **Instant layout switching** → Switch between Remington and InScript seamlessly

## 📦 Installation

The IME engine is already included in your project. Import it as:

```javascript
import { HindiTypingConverter, convertToHindi } from '@/lib/hindiTyping';
import { useHindiTyping } from '@/hooks/useHindiTyping';
```

## 🚀 Quick Start

### React Component Example

```jsx
import { useState } from 'react';
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
```

### Vanilla JavaScript Example

```javascript
import { HindiTypingConverter } from '@/lib/hindiTyping';

const textarea = document.getElementById('hindi-input');
const converter = new HindiTypingConverter('remington');

textarea.addEventListener('keydown', (event) => {
  const currentText = textarea.value;
  const selectionStart = textarea.selectionStart || 0;
  const selectionEnd = textarea.selectionEnd || selectionStart;
  
  // Handle backspace
  if (event.key === 'Backspace' && !event.ctrlKey) {
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
```

## 📚 API Reference

### `HindiTypingConverter` Class

#### Constructor
```javascript
const converter = new HindiTypingConverter(layout = 'remington');
```
- `layout`: `'remington'` or `'inscript'`

#### Methods

##### `handleKeyPress(event, currentText, selectionStart, selectionEnd)`
Handles a keyboard event and converts to Hindi.

**Parameters:**
- `event`: KeyboardEvent object
- `currentText`: Current text content
- `selectionStart`: Cursor start position (optional, defaults to text length)
- `selectionEnd`: Cursor end position (optional, defaults to selectionStart)

**Returns:**
- `null` if no conversion needed
- `{ char, replaceStart, replaceLength, cursorOffset }` if conversion occurred

##### `handleBackspace(currentText, selectionStart, selectionEnd)`
Handles backspace with Unicode cluster awareness.

**Returns:**
- `null` if nothing to delete
- `{ deleteStart, deleteLength, newCursorPos }` for deletion

##### `setLayout(layout)`
Switch between Remington and InScript layouts.

##### `convertText(text)`
Convert entire text at once (batch conversion).

##### `clearBuffer()`
Clear internal buffer (useful when switching contexts).

### `useHindiTyping` Hook

```javascript
const hindiTyping = useHindiTyping(layout, enabled);
```

**Parameters:**
- `layout`: `'remington'` or `'inscript'`
- `enabled`: `true` or `false`

**Returns:**
- `handleKeyDown(event, currentValue, setValue)`: Handle keydown event
- `convertText(text)`: Convert text to Hindi
- `clearBuffer()`: Clear buffer
- `switchLayout(newLayout)`: Switch layout instantly
- `isEnabled`: Current enabled state
- `layout`: Current layout

## 🎯 Remington Layout Guide

### Basic Consonants
- `k` → `क`, `kh` → `ख`, `g` → `ग`, `gh` → `घ`
- `c` → `च`, `ch` → `छ`, `j` → `ज`, `jh` → `झ`
- `T` → `ट`, `Th` → `ठ`, `D` → `ड`, `Dh` → `ढ`
- `t` → `त`, `th` → `थ`, `d` → `द`, `dh` → `ध`
- `p` → `प`, `ph` → `फ`, `b` → `ब`, `bh` → `भ`
- `y` → `य`, `r` → `र`, `l` → `ल`, `v` → `व`
- `sh` → `श`, `s` → `स`, `h` → `ह`

### Vowels
- `a` → `अ`, `aa` → `आ`, `i` → `इ`, `ee` → `ई`
- `u` → `उ`, `oo` → `ऊ`, `e` → `ए`, `ai` → `ऐ`
- `o` → `ओ`, `au` → `औ`, `ri` → `ऋ`

### Half Consonants (Halant)
Press **Shift + consonant key** to get half form:
- `Shift+k` → `क्`
- `Shift+d` → `द्`
- `Shift+j` → `ज्`

### Conjuncts (Sanyukt Akshar)
Conjuncts form automatically:
- Type `k` + `Shift+k` + `sh` → `क्ष`
- Type `j` + `Shift+j` + `ny` → `ज्ञ`
- Type `t` + `Shift+t` + `r` → `त्र`
- Type `sh` + `Shift+sh` + `r` → `श्र`

### Matras (Vowel Signs)
Matras attach automatically to consonants:
- `ka` → `का` (क + ा)
- `ki` → `कि` (क + ि)
- `ku` → `कु` (क + ु)
- `ke` → `के` (क + े)
- `ko` → `को` (क + ो)
- `kai` → `कै` (क + ै)
- `kau` → `कौ` (क + ौ)

### Common Words Examples
- `namaste` → `नमस्ते`
- `duniya` → `दुनिया`
- `bharat` → `भारत`
- `hindi` → `हिन्दी`
- `kya` → `क्या`
- `kaise` → `कैसे`

## ⌨️ InScript Layout Guide

InScript uses fixed key positions. Press the physical key to get the mapped Hindi character:

### Top Row (QWERTY)
- `q` → `ञ`, `w` → `ठ`, `e` → `े`, `r` → `ृ`
- `t` → `त`, `y` → `य`, `u` → `ू`, `i` → `ि`
- `o` → `ो`, `p` → `प`

### Second Row (ASDF)
- `a` → `अ`, `s` → `स`, `d` → `द`, `f` → `ध`
- `g` → `ग`, `h` → `ह`, `j` → `ज`, `k` → `क`, `l` → `ल`

### Third Row (ZXCV)
- `z` → `ज़`, `x` → `क्ष`, `c` → `च`, `v` → `व`
- `b` → `ब`, `n` → `न`, `m` → `म`

### Special Keys
- `,` → `्` (halant), `.` → `।` (danda)
- `[` → `्र`, `]` → `ज्ञ`
- `;` → `ः`, `'` → `ँ`

## 🔧 Advanced Usage

### Typing in Middle of Text
The IME engine correctly handles insertion at any cursor position:

```javascript
// Text: "नमस्ते"
// Cursor at position 2 (after "न")
// Type "k" → "क" is inserted
// Result: "नकमस्ते"
// Cursor moves to position 3
```

### Unicode Cluster Handling
Backspace deletes complete Hindi characters (Unicode clusters), not individual code units:

```javascript
// Text: "क्ष" (3 code units: क + ् + ष)
// Press Backspace → Entire "क्ष" is deleted
// Not just one code unit
```

### Layout Switching
Switch layouts instantly without losing functionality:

```javascript
const converter = new HindiTypingConverter('remington');
// ... type in Remington ...

converter.setLayout('inscript');
// ... now type in InScript ...

converter.setLayout('remington');
// ... back to Remington ...
```

## 🐛 Troubleshooting

### Cursor jumping issues
- Ensure you're passing `selectionStart` and `selectionEnd` to `handleKeyPress`
- Use `setTimeout` for cursor positioning if needed

### Characters not converting
- Check that Hindi typing is enabled
- Verify the layout is set correctly
- Ensure you're using the correct key sequences

### Broken characters
- Clear buffer when switching contexts: `converter.clearBuffer()`
- Ensure proper Unicode handling in your text area

## 📝 Notes

- The IME engine is designed for real-time typing, not batch conversion
- For batch conversion, use `convertText()` method
- Buffer is automatically managed for multi-character sequences
- Layouts work independently with separate buffers

## 🎓 CPCT Exam Compatibility

This IME engine is designed to match CPCT (Computer Proficiency Certification Test) standards:
- ✅ Remington Gail phonetic layout
- ✅ InScript fixed layout
- ✅ Proper halant handling
- ✅ Conjunct formation
- ✅ Matra attachment
- ✅ Unicode compliance

## 📄 License

Part of the CPCTMaster project.
