"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/videos", { credentials: "include" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        if (!cancelled) setVideos(j.videos || []);
      } catch (e) {
        if (!cancelled) setError(e.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#290c52]">Videos</h1>
          <button className="text-sm underline" onClick={() => router.refresh()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && <p className="text-gray-600">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && videos.length === 0 && (
          <p className="text-gray-600">No videos available for your account.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <Link
              key={v._id}
              href={`/video/${v._id}`}
              className="border rounded-xl p-4 shadow-sm hover:bg-[#290c52] hover:text-white transition-colors"
            >
              <div className="font-semibold">{v.title}</div>
              {v.description ? (
                <div className="text-sm mt-1 opacity-80 line-clamp-2">{v.description}</div>
              ) : null}
              <div className="text-xs mt-3 opacity-70">
                {v.durationSeconds ? `${Math.round(v.durationSeconds / 60)} min` : "—"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

