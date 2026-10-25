"use client";
import { useRef, useCallback } from 'react';
import { HindiTypingConverter, normalizeDevanagariWithCursor } from '@/lib/hindiTyping';

/**
 * React Hook for Hindi Typing
 * Provides Hindi typing conversion functionality with proper cursor management
 *
 * @param {string} layout - 'remington' or 'inscript'
 * @param {boolean} enabled - Whether Hindi typing is enabled
 * @param {boolean} allowBackspace - If false, backspace is not handled (matches "Backspace OFF" in tests)
 * @returns {object} - Hook return object with handlers and utilities
 */
export function useHindiTyping(layout = 'remington', enabled = false, allowBackspace = true) {
  const converterRef = useRef(null);

  // Initialize converter
  if (!converterRef.current) {
    converterRef.current = new HindiTypingConverter(layout);
  }

  // Update layout when it changes
  if (converterRef.current.layout !== layout.toLowerCase()) {
    converterRef.current.setLayout(layout.toLowerCase());
  }

  /**
   * Handle keydown event for Hindi conversion
   * Properly manages cursor position and text replacement
   * Includes Alt code support
   *
   * @param {KeyboardEvent} event - Keyboard event
   * @param {string} currentValue - Current textarea/input value
   * @param {function} setValue - State setter for value
   * @returns {boolean} - True if event was handled, false otherwise
   */
  const handleKeyDown = useCallback((event, currentValue, setValue) => {
    if (!enabled) {
      return false; // Let browser handle normally
    }

    const converter = converterRef.current;
    const textarea = event.target;

    // Get current cursor positions
    const selectionStart = textarea.selectionStart || 0;
    const selectionEnd = textarea.selectionEnd || selectionStart;

    // Handle Alt code detection (on keydown)
    const isAltCode = converter.handleKeyDown(event);
    if (isAltCode) {
      // Alt code is being buffered, wait for keyup
      return true;
    }

    // When backspace is OFF, do not handle Backspace so the app can revert in onChange
    if (event.key === 'Backspace' && !allowBackspace) {
      return false;
    }

    // Handle backspace with Unicode cluster awareness
    if (event.key === 'Backspace' && !event.ctrlKey && !event.metaKey) {
      const backspaceResult = converter.handleBackspace(currentValue, selectionStart, selectionEnd);
      if (backspaceResult) {
        event.preventDefault();

        const newValue =
          currentValue.substring(0, backspaceResult.deleteStart) +
          currentValue.substring(backspaceResult.deleteStart + backspaceResult.deleteLength);

        setValue(newValue);
        textarea.value = newValue;

        // Set cursor position (rAF for stable cursor)
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = backspaceResult.newCursorPos;
        });

        return true;
      }
      return false;
    }
    
    // Handle regular keypress conversion
    const result = converter.handleKeyPress(
      event, 
      currentValue, 
      selectionStart, 
      selectionEnd
    );

    if (result !== null) {
      // Silent layout keys are deliberately consumed without changing text.
      if (result.char === '') {
        return true;
      }

      // Calculate replacement positions
      const replaceStart = result.replaceStart !== undefined 
        ? result.replaceStart 
        : Math.max(0, selectionStart - (result.replaceLength || 0));
      const replaceEnd = replaceStart + (result.replaceLength || 0);
      
      // Replace text and insert Hindi character
      let newValue =
        currentValue.substring(0, replaceStart) +
        result.char +
        currentValue.substring(replaceEnd);

      const cursorOffset = result.cursorOffset !== undefined
        ? result.cursorOffset
        : result.char.length;
      let newCursorPos = replaceStart + cursorOffset;

      // Attach short i-matra and join halant + next letter before React paints
      const fixed = normalizeDevanagariWithCursor(newValue, newCursorPos);
      newValue = fixed.text;
      newCursorPos = fixed.cursor;

      // Update state
      setValue(newValue);

      // Update textarea value directly for immediate synchronization
      textarea.value = newValue;
      
      // Set cursor position after inserted character (rAF for stable cursor)
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      });
      
      return true; // Event was handled
    }

    return false; // Let browser handle normally
  }, [enabled, allowBackspace]);
  
  /**
   * Handle keyup event for Alt code processing
   * @param {KeyboardEvent} event - Keyboard event
   * @param {string} currentValue - Current textarea/input value
   * @param {function} setValue - State setter for value
   * @returns {boolean} - True if Alt code was processed
   */
  const handleKeyUp = useCallback((event, currentValue, setValue) => {
    if (!enabled) {
      return false;
    }
    
    const converter = converterRef.current;
    const textarea = event.target;
    const selectionStart = textarea.selectionStart || 0;
    const selectionEnd = textarea.selectionEnd || selectionStart;
    
    // Check for Alt code completion
    const altCodeResult = converter.handleKeyUp(event);
    if (altCodeResult && altCodeResult.char) {
      // Process Alt code result
      const replaceStart = selectionStart;
      const replaceEnd = selectionEnd;
      
      let newValue =
        currentValue.substring(0, replaceStart) +
        altCodeResult.char +
        currentValue.substring(replaceEnd);
      let newCursorPos = replaceStart + altCodeResult.char.length;
      const fixed = normalizeDevanagariWithCursor(newValue, newCursorPos);
      newValue = fixed.text;
      newCursorPos = fixed.cursor;

      setValue(newValue);
      textarea.value = newValue;
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      });
      
      return true;
    }
    
    return false;
  }, [enabled]);

  /**
   * Handle input change (mobile fallback when keydown/key is "Unidentified" or missing).
   * Call from onChange when Hindi is enabled: if return is not null, use it as the new value instead.
   * @param {string} newValue - Value after input event
   * @param {string} prevValue - Value before (current state)
   * @returns {string|{value:string,cursor:number}|null} - Value/cursor to use, or null to keep newValue
   */
  const handleInputChange = useCallback((newValue, prevValue) => {
    if (!enabled || !converterRef.current) return null;
    if (newValue === prevValue) return null;

    // Mobile backspace: value shortened (often keydown Backspace doesn't fire on mobile)
    if (newValue.length < prevValue.length) {
      if (!allowBackspace) {
        return null; // Let app revert in onChange when backspace is OFF
      }
      // Deletion at end (common case): apply one-cluster delete like desktop backspace
      if (prevValue.startsWith(newValue)) {
        const backspaceResult = converterRef.current.handleBackspace(
          prevValue,
          prevValue.length,
          prevValue.length
        );
        if (backspaceResult) {
          const value = prevValue.substring(0, backspaceResult.deleteStart) +
            prevValue.substring(backspaceResult.deleteStart + backspaceResult.deleteLength);
          return { value, cursor: backspaceResult.newCursorPos };
        }
      }
      return null;
    }

    // Append at end (typical mobile typing)
    if (newValue.startsWith(prevValue)) {
      const inserted = newValue.slice(prevValue.length);
      const converted = converterRef.current.convertText(inserted);
      const combined = converted !== inserted ? prevValue + converted : newValue;
      const fixed = normalizeDevanagariWithCursor(combined, combined.length);
      if (fixed.text !== newValue) {
        return { value: fixed.text, cursor: fixed.cursor };
      }
    }
    const fixedAll = normalizeDevanagariWithCursor(newValue, newValue.length);
    if (fixedAll.text !== newValue) {
      return { value: fixedAll.text, cursor: fixedAll.cursor };
    }
    return null;
  }, [enabled, allowBackspace]);

  /**
   * Convert text to Hindi (for batch conversion)
   * @param {string} text - Text to convert
   * @returns {string} - Converted text
   */
  const convertText = useCallback((text) => {
    if (!enabled) return text;
    return converterRef.current.convertText(text);
  }, [enabled]);

  /**
   * Clear internal buffer
   */
  const clearBuffer = useCallback(() => {
    converterRef.current.clearBuffer();
  }, []);

  /**
   * Switch layout instantly
   * @param {string} newLayout - 'remington' or 'inscript'
   */
  const switchLayout = useCallback((newLayout) => {
    converterRef.current.setLayout(newLayout);
  }, []);

  return {
    handleKeyDown,
    handleKeyUp,
    handleInputChange,
    convertText,
    clearBuffer,
    switchLayout,
    isEnabled: enabled,
    layout: layout.toLowerCase()
  };
}
