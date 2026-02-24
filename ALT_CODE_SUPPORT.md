# Alt Code Support for Hindi Typing

Both **Remington** and **InScript** layouts now support Alt codes for typing special Hindi characters and symbols.

## How Alt Codes Work

Alt codes allow you to type characters that may not be directly available on the keyboard by using:
**Alt + Numeric Keypad Code**

### Usage

1. **Hold down the Alt key**
2. **Type the numeric code** using the numeric keypad (Num Lock must be ON)
3. **Release the Alt key**
4. The character appears in your text

## Supported Alt Codes

### Common Symbols
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 33 | ! | Exclamation mark |
| Alt + 36 | $ | Dollar sign |
| Alt + 37 | % | Percent sign |
| Alt + 43 | + | Plus sign |
| Alt + 47 | / | Slash |
| Alt + 61 | = | Equals sign |
| Alt + 63 | ? | Question mark |

### Devanagari Digits
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 2305 | ० | Devanagari digit zero |
| Alt + 2416 | ० | Devanagari digit zero (alternate) |

### Devanagari Signs and Marks
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 2306 | ः | Visarga |
| Alt + 2307 | ँ | Chandrabindu |
| Alt + 2315 | ं | Anusvara |
| Alt + 2379 | ् | Halant/Virama |

### Devanagari Vowels (Swar)
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 2309 | अ | A |
| Alt + 2310 | आ | Aa |
| Alt + 2311 | इ | I |
| Alt + 2312 | ई | Ii |
| Alt + 2313 | उ | U |
| Alt + 2314 | ऊ | Uu |
| Alt + 2315 | ऋ | Ri |
| Alt + 2319 | ए | E |
| Alt + 2320 | ऐ | Ai |
| Alt + 2321 | ओ | O |
| Alt + 2322 | औ | Au |

### Devanagari Matras (Vowel Signs)
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 2366 | ा | Aa matra |
| Alt + 2367 | ि | I matra |
| Alt + 2368 | ी | Ii matra |
| Alt + 2369 | ु | U matra |
| Alt + 2370 | ू | Uu matra |
| Alt + 2371 | ृ | Ri matra |
| Alt + 2374 | े | E matra |
| Alt + 2375 | ै | Ai matra |
| Alt + 2377 | ो | O matra |
| Alt + 2378 | ौ | Au matra |

### Devanagari Consonants (Vyanjan)
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 2325 | क | Ka |
| Alt + 2326 | ख | Kha |
| Alt + 2327 | ग | Ga |
| Alt + 2328 | घ | Gha |
| Alt + 2329 | ङ | Nga |
| Alt + 2330 | च | Cha |
| Alt + 2331 | छ | Chha |
| Alt + 2332 | ज | Ja |
| Alt + 2333 | झ | Jha |
| Alt + 2334 | ञ | Nya |
| Alt + 2335 | ट | Ta (retroflex) |
| Alt + 2336 | ठ | Tha (retroflex) |
| Alt + 2337 | ड | Da (retroflex) |
| Alt + 2338 | ढ | Dha (retroflex) |
| Alt + 2339 | ण | Na (retroflex) |
| Alt + 2340 | त | Ta |
| Alt + 2341 | थ | Tha |
| Alt + 2342 | द | Da |
| Alt + 2343 | ध | Dha |
| Alt + 2344 | न | Na |
| Alt + 2345 | प | Pa |
| Alt + 2346 | फ | Pha |
| Alt + 2347 | ब | Ba |
| Alt + 2348 | भ | Bha |
| Alt + 2349 | म | Ma |
| Alt + 2350 | य | Ya |
| Alt + 2351 | र | Ra |
| Alt + 2352 | ल | La |
| Alt + 2354 | ळ | Lla |
| Alt + 2355 | व | Va |
| Alt + 2357 | श | Sha |
| Alt + 2358 | ष | Sha (retroflex) |
| Alt + 2359 | स | Sa |
| Alt + 2360 | ह | Ha |

### Special Characters and Conjuncts
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 2380 | त्र | TRA conjunct |
| Alt + 2381 | क्ष | KSHA conjunct |
| Alt + 2382 | श्र | SHRA conjunct |
| Alt + 2384 | ॐ | Om sign |
| Alt + 2395 | ज्ञ | JNYA (gya) conjunct |
| Alt + 2404 | । | Danda (full stop) |
| Alt + 2405 | ॥ | Double danda |
| Alt + 2406 | ° | Degree sign |

### Nukta Characters
| Alt Code | Character | Description |
|----------|-----------|-------------|
| Alt + 2329 | ड़ | DDA with nukta |
| Alt + 2330 | ढ़ | DDHA with nukta |
| Alt + 2332 | ज़ | ZA (ja with nukta) |
| Alt + 2398 | फ़ | FA (pha with nukta) |

## Examples

### Typing Special Characters

**Example 1: Typing Om sign**
```
Hold Alt → Type 2384 → Release Alt → ॐ
```

**Example 2: Typing Danda**
```
Hold Alt → Type 2404 → Release Alt → ।
```

**Example 3: Typing Conjunct ज्ञ**
```
Hold Alt → Type 2395 → Release Alt → ज्ञ
```

**Example 4: Typing Question Mark**
```
Hold Alt → Type 63 → Release Alt → ?
```

## Implementation Details

### For Developers

The Alt code support is implemented in `HindiTypingConverter` class:

```javascript
import { HindiTypingConverter } from '@/lib/hindiTyping';

const converter = new HindiTypingConverter('remington');

// Alt codes work automatically when Alt + numeric keypad is used
// The converter tracks Alt key state and buffers numeric input
```

### React Hook Usage

```jsx
import { useHindiTyping } from '@/hooks/useHindiTyping';

function MyComponent() {
  const [text, setText] = useState('');
  const hindiTyping = useHindiTyping('remington', true);

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => hindiTyping.handleKeyDown(e, text, setText)}
      onKeyUp={(e) => hindiTyping.handleKeyUp(e, text, setText)}
    />
  );
}
```

**Important**: You need to handle both `onKeyDown` and `onKeyUp` events for Alt code support to work properly.

## Notes

1. **Numeric Keypad Required**: Alt codes require the numeric keypad (Num Lock must be ON). Regular number keys won't work.

2. **Alt Key Release**: The character is inserted when you release the Alt key, not while typing the numbers.

3. **Both Layouts**: Alt codes work identically for both Remington and InScript layouts.

4. **Unicode Range**: The converter supports Unicode characters in the Devanagari range (U+0900 to U+097F) and common ASCII characters.

5. **Buffer Management**: The converter automatically buffers numeric input while Alt is held and processes it when Alt is released.

## Troubleshooting

### Alt codes not working?
- Make sure Num Lock is ON
- Use the numeric keypad, not the number row
- Ensure both `onKeyDown` and `onKeyUp` handlers are connected
- Check that Hindi typing is enabled

### Wrong character appears?
- Verify the Alt code number is correct
- Some codes may have multiple mappings (e.g., 2305 and 2416 both map to ०)
- Check Unicode range (2304-2431 for Devanagari)

### Character appears immediately?
- This is normal - the converter processes Alt codes when Alt is released
- The numeric input is buffered while Alt is held down

## References

- Based on Remington code standards
- Compatible with InScript layout Alt codes
- Supports Unicode Devanagari range (U+0900-U+097F)
- Follows standard Windows Alt code behavior
