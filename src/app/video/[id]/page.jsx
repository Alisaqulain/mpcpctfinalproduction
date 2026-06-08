"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SecureVideoPlayer from "@/components/video/SecureVideoPlayer";

function formatTs(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function statusLabel(st) {
  if (st === "replied" || st === "resolved") return "Replied";
  if (st === "closed") return "Closed";
  return "Pending";
}

export default function VideoWatchPage() {
  const params = useParams();
  const id = params?.id;
  const currentTimeRef = useRef(0);

  const [video, setVideo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doubts, setDoubts] = useState([]);
  const [showDoubt, setShowDoubt] = useState(false);
  const [doubtMessage, setDoubtMessage] = useState("");
  const [doubtTs, setDoubtTs] = useState(0);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [posting, setPosting] = useState(false);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const loadDoubts = async () => {
    const r = await fetch(`/api/doubts?videoId=${id}`, { credentials: "include" });
    const j = await r.json();
    if (r.ok) setDoubts(j.doubts || []);
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/videos/${id}`, { credentials: "include" });
        const j = await r.json();
        if (!r.ok) {
          if (j.reason === "phone_not_verified") {
            throw new Error("Please verify your phone to watch videos.");
          }
          throw new Error(j.error || "Failed");
        }
        if (!cancelled) {
          setVideo(j.video);
          await loadDoubts();
        }
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

  const openDoubt = () => {
    setDoubtTs(currentTimeRef.current || 0);
    setShowDoubt(true);
  };

  const uploadAttachment = async () => {
    if (!attachmentFile) return "";
    const fd = new FormData();
    fd.append("file", attachmentFile);
    const r = await fetch("/api/doubts/attachment", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Attachment failed");
    return j.attachment || j.attachmentUrl || "";
  };

  const submitDoubt = async () => {
    if (!doubtMessage.trim()) return;
    setPosting(true);
    try {
      const attachment = await uploadAttachment();
      const r = await fetch("/api/doubts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: id,
          timestamp: Math.floor(doubtTs || 0),
          message: doubtMessage.trim(),
          attachment,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setDoubtMessage("");
      setAttachmentFile(null);
      setShowDoubt(false);
      await loadDoubts();
    } catch (e) {
      alert(e.message || "Failed");
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async (doubtId) => {
    if (!replyText.trim()) return;
    const r = await fetch(`/api/doubts/${doubtId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: replyText.trim() }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error || "Failed");
      return;
    }
    setReplyId(null);
    setReplyText("");
    await loadDoubts();
  };

  if (loading) return <div className="min-h-screen p-6 text-gray-600">Loading…</div>;
  if (error) {
    return (
      <div className="min-h-screen p-6 space-y-3">
        <p className="text-red-600">{error}</p>
        {error.includes("verify") ? (
          <Link href="/verify-phone" className="underline text-[#290c52]">
            Verify phone →
          </Link>
        ) : null}
      </div>
    );
  }
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
        <div className="border rounded-xl overflow-hidden">
          {video.hasFile ? (
            <SecureVideoPlayer
              videoId={id}
              streamPath={video.streamPath}
              watermark={video.watermark}
              courseId={video.courseId}
              onTimeUpdate={(t) => {
                currentTimeRef.current = t;
              }}
            />
          ) : (
            <div className="p-6 text-center text-gray-600">Video file not available.</div>
          )}
        </div>

        {video.description ? (
          <div className="border rounded-xl p-4">
            <div className="font-semibold mb-1">About</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{video.description}</div>
          </div>
        ) : null}

        <div className="border rounded-xl p-4 space-y-4">
          <div className="font-semibold text-[#290c52]">Your doubts for this video</div>
          {doubts.length === 0 && (
            <p className="text-sm text-gray-600">No doubts yet. Use Ask Doubt while watching.</p>
          )}
          {doubts.map((d) => (
            <div key={d._id} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>t={formatTs(d.timestamp ?? d.timestampSeconds)}</span>
                <span className="font-medium">{statusLabel(d.status)}</span>
              </div>
              <p className="text-sm">{d.message}</p>
              {d.attachment || d.attachmentUrl ? (
                <a
                  className="text-xs underline text-[#290c52]"
                  href={
                    String(d.attachment || d.attachmentUrl).startsWith("/")
                      ? d.attachment || d.attachmentUrl
                      : `/api/doubts/attachment/${d.attachment || d.attachmentUrl}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  View attachment
                </a>
              ) : null}
              {(d.messages || []).map((m, i) => (
                <div
                  key={i}
                  className={`text-sm rounded p-2 ${
                    m.senderRole === "admin" ? "bg-purple-50" : "bg-gray-50"
                  }`}
                >
                  <span className="text-xs font-medium">
                    {m.senderRole === "admin" ? "Admin" : "You"}:
                  </span>{" "}
                  {m.message}
                </div>
              ))}
              {d.status !== "closed" && (
                <div className="space-y-2">
                  {replyId === d._id ? (
                    <>
                      <textarea
                        className="w-full border rounded p-2 text-sm"
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button
                        className="text-sm bg-[#290c52] text-white px-3 py-1 rounded"
                        onClick={() => submitReply(d._id)}
                      >
                        Send reply
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-xs underline"
                      onClick={() => {
                        setReplyId(d._id);
                        setReplyText("");
                      }}
                    >
                      Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
                onClick={() => setDoubtTs(currentTimeRef.current || 0)}
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
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
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
