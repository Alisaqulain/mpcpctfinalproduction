"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function AdminChatPage() {
  const params = useParams();
  const router = useRouter();
  const doubtId = params?.doubtId;
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [solutionFile, setSolutionFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef(null);

  const load = async () => {
    const r = await fetch(`/api/chat/${doubtId}`, { credentials: "include" });
    const j = await r.json();
    if (r.ok) setMessages(j.messages || []);
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
  }, [router, doubtId]);

  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => load(), 2000);
    return () => clearInterval(t);
  }, [ready, doubtId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (resolve = false) => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doubtId, message: text.trim(), type: "text", resolve }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setText("");
      await load();
    } catch (e) {
      alert(e.message || "Failed");
    } finally {
      setSending(false);
    }
  };

  const uploadSolution = async () => {
    if (!solutionFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", solutionFile);
      fd.append("doubtId", doubtId);
      fd.append("message", "Solution video");
      const r = await fetch("/api/chat/upload-video", { method: "POST", credentials: "include", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload failed");
      setSolutionFile(null);
      await load();
    } catch (e) {
      alert(e.message || "Upload failed");
    } finally {
      setUploading(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-[#290c52]">Admin Chat</div>
          <div className="flex gap-3 text-sm">
            <Link href="/admin/doubts" className="underline">
              Doubts
            </Link>
            <Link href="/admin" className="underline">
              Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 overflow-y-auto space-y-2">
        {messages.map((m) => {
          const mine = m.senderRole === "admin";
          const isVideo = m.type === "video" && m.videoPublicId;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm text-sm ${
                  mine ? "bg-blue-700 text-white" : "bg-white text-gray-900"
                }`}
              >
                {isVideo ? (
                  <div className="space-y-2">
                    <div className="font-semibold">{m.message || "Solution video"}</div>
                    <video
                      controls
                      playsInline
                      className="w-full rounded-lg"
                      src={`/api/chat/stream/${m.videoPublicId}`}
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.message}</div>
                )}
                <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-gray-500"}`}>
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Type a reply…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              disabled={sending || !text.trim()}
              onClick={() => send(false)}
            >
              {sending ? "Sending…" : "Send"}
            </button>
            <button
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              disabled={sending || !text.trim()}
              onClick={() => send(true)}
            >
              Send & resolve
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <input type="file" accept="video/*" onChange={(e) => setSolutionFile(e.target.files?.[0] || null)} />
            <button
              type="button"
              className="border px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              disabled={uploading || !solutionFile}
              onClick={uploadSolution}
            >
              {uploading ? "Uploading…" : "Upload solution video"}
            </button>
            <span className="text-xs text-gray-500">
              Solution videos are stored on filesystem and streamed via API.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

