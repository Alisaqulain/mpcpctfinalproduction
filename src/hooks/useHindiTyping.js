"use client";
import { useRef, useCallback } from 'react';
import { HindiTypingConverter } from '@/lib/hindiTyping';

/**
 * React Hook for Hindi Typing
 * Provides Hindi typing conversion functionality
 * 
 * @param {string} layout - 'remington' or 'inscript'
 * @param {boolean} enabled - Whether Hindi typing is enabled
 * @returns {object} - Hook return object with handlers and utilities
 */
export function useHindiTyping(layout = 'remington', enabled = false) {
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
    const result = converter.handleKeyPress(event, currentValue);

    if (result !== null && result.char) {
      // We need to insert/replace with the Hindi character
      const textarea = event.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Calculate how many characters to replace from the end
      const replaceLength = result.replaceLength || 1;
      const replaceStart = Math.max(0, start - (replaceLength - 1));
      
      // Replace characters and insert Hindi
      const newValue = 
        currentValue.substring(0, replaceStart) + 
        result.char + 
        currentValue.substring(end);
      
      // Update state
      setValue(newValue);
      
      // Also update textarea value directly for immediate synchronization
      // This ensures the controlled component stays in sync
      textarea.value = newValue;
      
      // Set cursor position after inserted character
      setTimeout(() => {
        const newCursorPos = replaceStart + result.char.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
      
      return true; // Event was handled
    }

    return false; // Let browser handle normally
  }, [enabled]);

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

  return {
    handleKeyDown,
    convertText,
    clearBuffer,
    isEnabled: enabled,
    layout: layout.toLowerCase()
  };
}

