"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminVideosPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState("single");
  const [subscriptionType, setSubscriptionType] = useState("learning");
  const [assignUserIds, setAssignUserIds] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const selectedVideo = useMemo(
    () => videos.find((v) => String(v._id) === String(selectedVideoId)) || null,
    [videos, selectedVideoId]
  );

  const load = async () => {
    const r = await fetch("/api/videos", { credentials: "include" });
    const j = await r.json();
    if (r.ok) setVideos(j.videos || []);
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

  const upload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("description", description);
      fd.append("accessType", accessType);
      fd.append("subscriptionType", subscriptionType);
      const r = await fetch("/api/videos/upload", { method: "POST", credentials: "include", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload failed");
      setFile(null);
      setTitle("");
      setDescription("");
      await load();
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const assign = async () => {
    if (!selectedVideoId) return;
    setAssigning(true);
    try {
      const ids = assignUserIds
        .split(/[\s,]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      const mode = accessType === "subscription" ? "subscription" : ids.length <= 1 ? "single" : "bulk";

      const r = await fetch("/api/videos/assign", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: selectedVideoId,
          mode,
          userIds: ids,
          subscriptionType,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Assign failed");
      await load();
    } catch (err) {
      alert(err.message || "Assign failed");
    } finally {
      setAssigning(false);
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#290c52]">Admin · Videos</h1>
          <Link href="/admin" className="text-sm underline">
            ← Admin home
          </Link>
        </div>

        <form onSubmit={upload} className="bg-white rounded-xl shadow p-6 space-y-3">
          <div className="font-semibold">Upload video (filesystem)</div>
          <input
            type="file"
            accept="video/*"
            className="w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <label className="text-sm">
              Access type
              <select
                className="ml-2 border rounded px-2 py-1"
                value={accessType}
                onChange={(e) => setAccessType(e.target.value)}
              >
                <option value="single">single</option>
                <option value="bulk">bulk</option>
                <option value="subscription">subscription</option>
              </select>
            </label>
            <label className="text-sm">
              Subscription type
              <select
                className="ml-2 border rounded px-2 py-1"
                value={subscriptionType}
                onChange={(e) => setSubscriptionType(e.target.value)}
              >
                <option value="learning">learning</option>
                <option value="exam">exam</option>
                <option value="all">all</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-[#290c52] text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <div className="text-xs text-gray-500">
            Storage dir is controlled by <code>VIDEO_STORAGE_PATH</code>.
          </div>
        </form>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="font-semibold">Assign access</div>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedVideoId}
            onChange={(e) => setSelectedVideoId(e.target.value)}
          >
            <option value="">Select video…</option>
            {videos.map((v) => (
              <option key={v._id} value={v._id}>
                {v.title}
              </option>
            ))}
          </select>

          {selectedVideo ? (
            <div className="text-sm text-gray-700">
              Current access: <b>{selectedVideo.accessType}</b>
            </div>
          ) : null}

          {accessType !== "subscription" ? (
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={3}
              placeholder="UserIds (Mongo ObjectIds), comma or newline separated"
              value={assignUserIds}
              onChange={(e) => setAssignUserIds(e.target.value)}
            />
          ) : (
            <div className="text-sm text-gray-700">
              Subscription access uses user subscription checks (type: {subscriptionType}).
            </div>
          )}

          <button
            type="button"
            disabled={assigning || !selectedVideoId}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            onClick={assign}
          >
            {assigning ? "Saving…" : "Save assignment"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow divide-y">
          <div className="p-4 font-semibold">All videos</div>
          {videos.map((v) => (
            <div key={v._id} className="p-4 flex justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{v.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {v.accessType} · publicId: {v.publicId}
                </div>
              </div>
              <Link className="text-sm underline text-[#290c52]" href={`/video/${v._id}`}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

