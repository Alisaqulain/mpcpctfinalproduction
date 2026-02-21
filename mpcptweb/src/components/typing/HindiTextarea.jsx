"use client";
import React, { useCallback } from "react";
import { useHindiTyping } from "@/hooks/useHindiTyping";

/**
 * Controlled textarea with roman-to-Hindi conversion (Remington or Inscript).
 * Use in admin and anywhere Hindi content is entered with conversion.
 */
export default function HindiTextarea({ layout = "remington", value, onChange, ...rest }) {
  const hindiTyping = useHindiTyping(layout, true);

  const setValue = useCallback(
    (newValue) => {
      onChange({ target: { value: newValue } });
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (hindiTyping.isEnabled) {
        const handled = hindiTyping.handleKeyDown(e, value, setValue);
        if (handled) return;
      }
    },
    [hindiTyping, value, setValue]
  );

  const handleKeyUp = useCallback(
    (e) => {
      if (hindiTyping.isEnabled) {
        hindiTyping.handleKeyUp(e, value, setValue);
      }
    },
    [hindiTyping, value, setValue]
  );

  const handleChange = useCallback(
    (e) => {
      let newValue = e.target.value;
      if (hindiTyping.isEnabled && hindiTyping.handleInputChange) {
        const converted = hindiTyping.handleInputChange(newValue, value);
        if (converted !== null) {
          const val = typeof converted === 'object' && 'value' in converted ? converted.value : converted;
          const cursor = typeof converted === 'object' && 'cursor' in converted ? converted.cursor : val.length;
          newValue = val;
          e.target.value = val;
          e.target.setSelectionRange(cursor, cursor);
        }
      }
      onChange({ target: { value: newValue } });
    },
    [hindiTyping, value, onChange]
  );

  return (
    <textarea
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      lang="hi"
      inputMode="text"
      {...rest}
    />
  );
}
