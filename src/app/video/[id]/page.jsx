"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

function formatTs(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function VideoWatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showDoubt, setShowDoubt] = useState(false);
  const [doubtMessage, setDoubtMessage] = useState("");
  const [doubtTs, setDoubtTs] = useState(0);
  const [posting, setPosting] = useState(false);
  const [createdDoubtId, setCreatedDoubtId] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/videos/${id}`, { credentials: "include" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        if (!cancelled) setVideo(j.video);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const streamUrl = useMemo(() => {
    if (!video?.publicId) return null;
    return `/api/videos/stream/${video.publicId}`;
  }, [video?.publicId]);

  const openDoubt = () => {
    const t = videoRef.current?.currentTime || 0;
    setDoubtTs(t);
    setShowDoubt(true);
  };

  const submitDoubt = async () => {
    if (!doubtMessage.trim()) return;
    setPosting(true);
    setCreatedDoubtId(null);
    try {
      const r = await fetch("/api/doubts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: id,
          timestampSeconds: Math.floor(doubtTs || 0),
          message: doubtMessage.trim(),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to post doubt");
      setCreatedDoubtId(j.doubt?._id || null);
      setDoubtMessage("");
      setShowDoubt(false);
    } catch (e) {
      alert(e.message || "Failed");
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div className="min-h-screen p-6 text-gray-600">Loading…</div>;
  if (error) return <div className="min-h-screen p-6 text-red-600">{error}</div>;
  if (!video) return <div className="min-h-screen p-6 text-gray-600">Not found</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/videos" className="text-sm underline text-[#290c52]">
              ← Videos
            </Link>
            <div className="font-bold text-[#290c52] truncate">{video.title}</div>
          </div>
          <button
            onClick={openDoubt}
            className="bg-[#290c52] text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Ask Doubt
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="border rounded-xl overflow-hidden bg-black">
          {streamUrl ? (
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              playsInline
              className="w-full h-auto"
            />
          ) : (
            <div className="p-6 text-white">Stream not ready</div>
          )}
        </div>

        {video.description ? (
          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-1">About</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{video.description}</div>
          </div>
        ) : null}

        {createdDoubtId ? (
          <div className="border rounded-xl p-4 bg-green-50">
            <div className="font-semibold text-green-800">Doubt submitted</div>
            <Link className="underline text-sm text-green-900" href={`/doubts/${createdDoubtId}`}>
              Open chat →
            </Link>
          </div>
        ) : null}
      </div>

      {showDoubt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-bold">Ask a doubt</div>
              <button className="text-sm underline" onClick={() => setShowDoubt(false)}>
                Close
              </button>
            </div>

            <div className="text-sm text-gray-700">
              Timestamp: <b>{formatTs(doubtTs)}</b>
              <button
                className="ml-3 text-xs underline text-[#290c52]"
                onClick={() => setDoubtTs(videoRef.current?.currentTime || 0)}
              >
                Use current time
              </button>
            </div>

            <textarea
              rows={4}
              className="w-full border rounded p-3 text-sm"
              placeholder="Type your doubt…"
              value={doubtMessage}
              onChange={(e) => setDoubtMessage(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded border" onClick={() => setShowDoubt(false)}>
                Cancel
              </button>
              <button
                disabled={posting || !doubtMessage.trim()}
                className="px-4 py-2 rounded bg-[#290c52] text-white disabled:opacity-50"
                onClick={submitDoubt}
              >
                {posting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

