# TypingArea – mobile keyboard testing

## What was fixed

- **Input source**: Typing is driven by a **controlled input** `value={typedText}` and `onChange={handleInputChange}`. No keydown-only logic.
- **Hidden input**: One input, visually hidden (opacity 0, 1px size so it stays focusable on mobile/WebView). Clicking the typing area focuses it so the soft keyboard opens.
- **No blocking**: No `preventDefault` on touch, no `pointer-events: none` on the input, input not inside a disabled container.

## How to test

1. **Mobile Chrome (or Safari)** – Open Learning → Character. Tap the typing area; soft keyboard should open and keys should register.
2. **Expo Go** – Load app, open same typing screen, tap and type; keys should register.
3. **Android WebView** – Dev build loading site in WebView; tap to focus, type; input should work.
4. **Desktop** – Physical keyboard; focus and type; value-driven behavior unchanged.

## If it still fails

- Confirm the focused element is the hidden input (e.g. log `document.activeElement` on tap).
- Ensure WebView does not block programmatic focus.
