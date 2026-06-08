"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatTs(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function AdminDoubtsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [doubts, setDoubts] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [status, setStatus] = useState("");
  const [courseId, setCourseId] = useState("");
  const [videoId, setVideoId] = useState("");
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [sending, setSending] = useState(false);

  const buildQuery = () => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (courseId) p.set("courseId", courseId);
    if (videoId) p.set("videoId", videoId);
    if (userId) p.set("userId", userId);
    const q = p.toString();
    return q ? `?${q}` : "";
  };

  const load = async () => {
    const r = await fetch(`/api/doubts/admin${buildQuery()}`, { credentials: "include" });
    const j = await r.json();
    if (r.ok) {
      setDoubts(j.doubts || []);
      setPendingCount(j.pendingCount ?? 0);
    }
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) return router.replace("/admin/login");
      const data = await res.json();
      if (data.user?.role !== "admin") return router.replace("/admin/login");
      await load();
      setReady(true);
    })();
  }, [router]);

  useEffect(() => {
    if (ready) load();
  }, [status, courseId, videoId, userId, ready]);

  const uploadAttachment = async () => {
    if (!replyFile) return "";
    const fd = new FormData();
    fd.append("file", replyFile);
    const r = await fetch("/api/doubts/attachment", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Attachment failed");
    return j.attachmentUrl || "";
  };

  const sendReply = async (markClosed) => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const attachment = await uploadAttachment();
      const r = await fetch(`/api/doubts/${selected._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText.trim(),
          attachment,
          markClosed,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setReplyText("");
      setReplyFile(null);
      setSelected(j.doubt);
      await load();
    } catch (e) {
      alert(e.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#290c52]">
            Admin · Doubts
            {pendingCount > 0 && (
              <span className="ml-2 text-sm bg-red-600 text-white px-2 py-0.5 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <Link href="/admin" className="text-sm underline">
            ← Admin home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <select className="border rounded px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="replied">replied</option>
            <option value="closed">closed</option>
          </select>
          <input
            className="border rounded px-2 py-2"
            placeholder="Course ID"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
          <input
            className="border rounded px-2 py-2"
            placeholder="Video ID"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
          />
          <input
            className="border rounded px-2 py-2"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow divide-y max-h-[70vh] overflow-y-auto">
            {doubts.length === 0 && <div className="p-6 text-gray-600">No doubts.</div>}
            {doubts.map((d) => (
              <button
                key={d._id}
                type="button"
                className={`w-full text-left p-4 hover:bg-gray-50 ${selected?._id === d._id ? "bg-purple-50" : ""}`}
                onClick={() => setSelected(d)}
              >
                <div className="font-medium truncate">{d.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {d.user?.name || "User"} · {d.user?.phone || d.user?.email || ""} · t=
                  {formatTs(d.timestamp ?? d.timestampSeconds)}
                </div>
                <div className="text-xs text-gray-500">
                  {d.course?.title || "—"} · {d.video?.title || d.videoId} · {d.status}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow p-5 min-h-[300px]">
            {!selected ? (
              <p className="text-gray-600">Select a doubt to view thread.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="font-bold">{selected.user?.name}</div>
                  <div className="text-sm text-gray-600">
                    {selected.user?.phone} · {selected.user?.email}
                  </div>
                  <div className="text-sm text-gray-600">
                    Course: {selected.course?.title || "—"} · Video: {selected.video?.title || selected.videoId}
                  </div>
                  <div className="text-sm">
                    Timestamp {formatTs(selected.timestamp ?? selected.timestampSeconds)} ·{" "}
                    <span className="font-medium">{selected.status}</span>
                  </div>
                  <Link
                    href={`/admin/chat/${selected._id}`}
                    className="inline-block mt-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Open live chat →
                  </Link>
                  <p className="mt-2 text-sm">{selected.message}</p>
                  {(selected.attachment || selected.attachmentUrl) && (
                    <a
                      className="text-sm underline text-[#290c52]"
                      href={selected.attachment || selected.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Attachment
                    </a>
                  )}
                </div>

                {(selected.messages || []).map((m, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded p-2 ${m.senderRole === "admin" ? "bg-purple-50" : "bg-gray-50"}`}
                  >
                    <span className="text-xs font-medium">{m.senderRole}:</span> {m.message}
                  </div>
                ))}

                {selected.status !== "closed" && (
                  <div className="space-y-2 border-t pt-4">
                    <textarea
                      rows={3}
                      className="w-full border rounded p-2 text-sm"
                      placeholder="Admin reply…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex gap-2">
                      <button
                        disabled={sending || !replyText.trim()}
                        className="bg-[#290c52] text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        onClick={() => sendReply(false)}
                      >
                        Reply
                      </button>
                      <button
                        disabled={sending || !replyText.trim()}
                        className="border px-4 py-2 rounded text-sm"
                        onClick={() => sendReply(true)}
                      >
                        Reply & close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
