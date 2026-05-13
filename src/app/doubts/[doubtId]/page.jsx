"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DoubtChatPage() {
  const params = useParams();
  const doubtId = params?.doubtId;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = async () => {
    const r = await fetch(`/api/chat/${doubtId}`, { credentials: "include" });
    const j = await r.json();
    if (r.ok) setMessages(j.messages || []);
  };

  useEffect(() => {
    if (!doubtId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      await load();
      if (mounted) setLoading(false);
    })();
    const t = setInterval(() => load(), 2500);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [doubtId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doubtId, message: text.trim(), type: "text" }),
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-[#290c52]">Doubt Chat</div>
          <Link href="/videos" className="text-sm underline">
            Videos
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto space-y-2">
        {loading && <p className="text-gray-600">Loading…</p>}
        {!loading &&
          messages.map((m) => {
            const mine = m.senderRole === "user";
            const isVideo = m.type === "video" && m.videoPublicId;
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm text-sm ${
                    mine ? "bg-[#290c52] text-white" : "bg-white text-gray-900"
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
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            className="bg-[#290c52] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            disabled={sending || !text.trim()}
            onClick={send}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

