"use client";

import React, { useId } from "react";

/**
 * Modern volume icon — Lucide-style shape with glossy blue speaker (reference colors)
 * and dark navy sound waves. variant="onDark" for purple exam headers.
 */
export default function ExamSoundIcon({
  active = true,
  variant = "light",
  className = "",
  ...props
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `examSoundGrad-${uid}`;
  const onDark = variant === "onDark";

  const speakerFill = onDark ? "#4da6ff" : `url(#${gradId})`;
  const speakerStroke = onDark ? "#4da6ff" : "#004a99";
  const waveColor = onDark ? "#FFFFFF" : "#1a1a1a";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {!onDark && (
        <defs>
          <linearGradient id={gradId} x1="3" y1="5" x2="3" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4da6ff" />
            <stop offset="0.5" stopColor="#2088DC" />
            <stop offset="1" stopColor="#004a99" />
          </linearGradient>
        </defs>
      )}

      <path
        d="M11 5.082A.712.712 0 0 0 9.702 4.5L6.3 7.902A1.43 1.43 0 0 1 5.25 8.25H3a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h2.25c.398 0 .78.158 1.05.439l3.402 3.402A.712.712 0 0 0 11 18.918V5.082Z"
        fill={speakerFill}
        stroke={speakerStroke}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />

      {active ? (
        <>
          <path
            d="M15.54 8.46a5 5 0 0 1 0 7.07"
            stroke={waveColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18.36 5.64a9 9 0 0 1 0 12.72"
            stroke={waveColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path d="m16 9 5 5" stroke={waveColor} strokeWidth="2" strokeLinecap="round" />
          <path d="m21 9-5 5" stroke={waveColor} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
