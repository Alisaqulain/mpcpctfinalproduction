"use client";
import { useRef, useCallback } from 'react';
import { HindiTypingConverter } from '@/lib/hindiTyping';

/**
 * React Hook for Hindi Typing
 * Provides Hindi typing conversion functionality with proper cursor management
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
        
        // Set cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = backspaceResult.newCursorPos;
        }, 0);
        
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

    if (result !== null && result.char) {
      // Calculate replacement positions
      const replaceStart = result.replaceStart !== undefined 
        ? result.replaceStart 
        : Math.max(0, selectionStart - (result.replaceLength || 0));
      const replaceEnd = replaceStart + (result.replaceLength || 0);
      
      // Replace text and insert Hindi character
      const newValue = 
        currentValue.substring(0, replaceStart) + 
        result.char + 
        currentValue.substring(replaceEnd);
      
      // Update state
      setValue(newValue);
      
      // Update textarea value directly for immediate synchronization
      textarea.value = newValue;
      
      // Calculate new cursor position
      const cursorOffset = result.cursorOffset !== undefined 
        ? result.cursorOffset 
        : result.char.length;
      const newCursorPos = replaceStart + cursorOffset;
      
      // Set cursor position after inserted character
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
      
      return true; // Event was handled
    }

    return false; // Let browser handle normally
  }, [enabled]);
  
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
      
      const newValue = 
        currentValue.substring(0, replaceStart) + 
        altCodeResult.char + 
        currentValue.substring(replaceEnd);
      
      setValue(newValue);
      textarea.value = newValue;
      
      const newCursorPos = replaceStart + altCodeResult.char.length;
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
      
      return true;
    }
    
    return false;
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
    convertText,
    clearBuffer,
    switchLayout,
    isEnabled: enabled,
    layout: layout.toLowerCase()
  };
}
