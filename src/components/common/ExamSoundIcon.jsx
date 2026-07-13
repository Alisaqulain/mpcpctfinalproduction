"use client";

import React, { useId } from "react";

/**
 * Custom speaker icon matching the exam UI reference (blue gradient body + navy waves).
 */
export default function ExamSoundIcon({ active = true, className = "", ...props }) {
  const uid = useId().replace(/:/g, "");
  const bodyGrad = `examSpeakerBody-${uid}`;
  const highlightGrad = `examSpeakerHighlight-${uid}`;
  const backGrad = `examSpeakerBack-${uid}`;

  return (
    <svg
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={bodyGrad} x1="4" y1="4" x2="4" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A8DDF5" />
          <stop offset="0.28" stopColor="#6DB8E8" />
          <stop offset="0.55" stopColor="#3D96D4" />
          <stop offset="1" stopColor="#1E6FA8" />
        </linearGradient>
        <linearGradient id={highlightGrad} x1="6" y1="6" x2="15" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C8EBFA" />
          <stop offset="0.45" stopColor="#8ECFF0" />
          <stop offset="1" stopColor="#5AADD9" />
        </linearGradient>
        <linearGradient id={backGrad} x1="1" y1="8" x2="1" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7EC4EA" />
          <stop offset="1" stopColor="#2E7FB8" />
        </linearGradient>
      </defs>

      <rect x="1.5" y="8.5" width="4.5" height="7" rx="0.4" fill={`url(#${backGrad})`} />

      <path
        d="M6 6.75 L6 17.25 L14.75 19.85 L14.75 4.15 Z"
        fill={`url(#${bodyGrad})`}
      />

      <path
        d="M6.2 7.1 L6.2 11.2 L14.2 12.8 L14.2 8.7 Z"
        fill={`url(#${highlightGrad})`}
        opacity="0.95"
      />

      <rect x="14.35" y="4.15" width="1.35" height="15.7" fill="#1A3F66" />

      {active ? (
        <>
          <path
            d="M18.2 9.1 C20.1 10.95 20.1 13.05 18.2 14.9"
            stroke="#152238"
            strokeWidth="2.15"
            strokeLinecap="round"
          />
          <path
            d="M21.2 7.05 C24.55 10.35 24.55 13.65 21.2 16.95"
            stroke="#152238"
            strokeWidth="2.15"
            strokeLinecap="round"
          />
          <path
            d="M24.2 4.95 C29.15 10.05 29.15 13.95 24.2 19.05"
            stroke="#152238"
            strokeWidth="2.15"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M18.5 8.2 L27.8 17.5"
            stroke="#152238"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M27.8 8.2 L18.5 17.5"
            stroke="#152238"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
