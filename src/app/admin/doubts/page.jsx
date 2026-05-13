"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDoubtsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [doubts, setDoubts] = useState([]);
  const [status, setStatus] = useState("");

  const load = async (st) => {
    const q = st ? `?status=${encodeURIComponent(st)}` : "";
    const r = await fetch(`/api/doubts/admin${q}`, { credentials: "include" });
    const j = await r.json();
    if (r.ok) setDoubts(j.doubts || []);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) return router.replace("/admin/login");
      const data = await res.json();
      if (data.user?.role !== "admin") return router.replace("/admin/login");
      await load("");
      setReady(true);
    })();
  }, [router]);

  useEffect(() => {
    if (ready) load(status);
  }, [status, ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#290c52]">Admin · Doubts</h1>
          <Link href="/admin" className="text-sm underline">
            ← Admin home
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4 flex gap-3 items-center">
          <div className="text-sm font-medium">Filter</div>
          <select className="border rounded px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <button className="text-sm underline" onClick={() => load(status)}>
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow divide-y">
          {doubts.length === 0 && <div className="p-6 text-gray-600">No doubts.</div>}
          {doubts.map((d) => (
            <div key={d._id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {d.status === "resolved" ? "✅" : "❓"} {d.message}
                </div>
                <div className="text-xs text-gray-500">
                  videoId: {String(d.videoId)} · userId: {String(d.userId)} · t={d.timestampSeconds}s
                </div>
              </div>
              <Link href={`/admin/chat/${d._id}`} className="text-sm underline text-[#290c52]">
                Open chat
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

