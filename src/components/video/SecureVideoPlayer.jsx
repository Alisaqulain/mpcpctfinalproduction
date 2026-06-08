"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const POSITIONS = [
  "top-4 left-4",
  "top-4 right-4",
  "bottom-16 left-4",
  "bottom-16 right-4",
  "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
];

export default function SecureVideoPlayer({
  videoId,
  streamPath,
  watermark,
  courseId,
  onTimeUpdate,
}) {
  const videoRef = useRef(null);
  const [posIdx, setPosIdx] = useState(0);

  const logEvent = useCallback(
    async (action, lastPosition) => {
      try {
        await fetch("/api/videos/access-log", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, action, lastPosition, courseId }),
        });
      } catch {
        /* ignore */
      }
    },
    [videoId, courseId]
  );

  useEffect(() => {
    const t = setInterval(() => setPosIdx((i) => (i + 1) % POSITIONS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    logEvent("view", 0);
  }, [logEvent]);

  const wmText = [watermark?.name, watermark?.phone || watermark?.email]
    .filter(Boolean)
    .join(" · ");

  const src = streamPath || `/api/videos/${videoId}/stream`;

  return (
    <div className="relative bg-black" onContextMenu={(e) => e.preventDefault()}>
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        className="w-full h-auto"
        onPlay={() => logEvent("play", videoRef.current?.currentTime || 0)}
        onPause={() => logEvent("pause", videoRef.current?.currentTime || 0)}
        onSeeked={() => logEvent("seek", videoRef.current?.currentTime || 0)}
        onEnded={() => logEvent("complete", videoRef.current?.duration || 0)}
        onTimeUpdate={() => onTimeUpdate?.(videoRef.current?.currentTime || 0)}
      />
      {wmText ? (
        <div
          className={`pointer-events-none absolute z-10 px-2 py-1 rounded text-white/70 text-xs font-semibold bg-black/30 ${POSITIONS[posIdx]}`}
          aria-hidden
        >
          {wmText}
        </div>
      ) : null}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-amber-200 text-[11px] px-3 py-2 text-center">
        Screen recording or sharing is not allowed.
      </div>
    </div>
  );
}
