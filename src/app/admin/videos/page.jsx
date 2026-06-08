"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminVideosPage() {
  const router = useRouter();
  const xhrRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [videoType, setVideoType] = useState("lecture");
  const [status, setStatus] = useState("active");
  const [order, setOrder] = useState(0);
  const [duration, setDuration] = useState(0);
  const [accessType, setAccessType] = useState("subscription");
  const [subscriptionType, setSubscriptionType] = useState("learning");
  const [assignUserIds, setAssignUserIds] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadMsg, setUploadMsg] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");

  const selectedVideo = useMemo(
    () => videos.find((v) => String(v._id) === String(selectedVideoId)) || null,
    [videos, selectedVideoId]
  );

  const load = async () => {
    const [vr, cr] = await Promise.all([
      fetch("/api/videos", { credentials: "include" }),
      fetch("/api/admin/video-courses", { credentials: "include" }),
    ]);
    const vj = await vr.json();
    const cj = await cr.json();
    if (vr.ok) setVideos(vj.videos || []);
    if (cr.ok) setCourses(cj.courses || []);
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

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;
    const r = await fetch("/api/admin/video-courses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newCourseTitle.trim() }),
    });
    const j = await r.json();
    if (r.ok) {
      setNewCourseTitle("");
      await load();
      if (j.course?._id) setCourseId(j.course._id);
    } else {
      alert(j.error || "Failed");
    }
  };

  const upload = (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setUploadPct(0);
    setUploadMsg("");

    const fd = new FormData();
    fd.append("file", file);
    if (thumbnail) fd.append("thumbnail", thumbnail);
    fd.append("title", title.trim());
    fd.append("description", description);
    fd.append("courseId", courseId);
    fd.append("moduleId", moduleId);
    fd.append("type", videoType);
    fd.append("status", status);
    fd.append("order", String(order));
    fd.append("duration", String(duration));
    fd.append("accessType", accessType);
    fd.append("subscriptionType", subscriptionType);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/videos/upload");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadPct(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = async () => {
      setUploading(false);
      try {
        const j = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadMsg("Upload successful.");
          setFile(null);
          setThumbnail(null);
          setTitle("");
          setDescription("");
          await load();
        } else {
          setUploadMsg(j.error || "Upload failed");
        }
      } catch {
        setUploadMsg("Upload failed");
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setUploadMsg("Network error during upload");
    };
    xhr.send(fd);
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
          <div className="flex gap-4 text-sm">
            <Link href="/admin/doubts" className="underline">
              Doubts
            </Link>
            <Link href="/admin" className="underline">
              ← Admin home
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <div className="font-semibold">Video courses</div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="New course title"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
            />
            <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded text-sm" onClick={createCourse}>
              Add course
            </button>
          </div>
        </div>

        <form onSubmit={upload} className="bg-white rounded-xl shadow p-6 space-y-3">
          <div className="font-semibold">Upload video to VPS</div>
          <p className="text-xs text-gray-500">
            Stored under VIDEO_STORAGE_PATH / SOLUTION_VIDEO_STORAGE_PATH (not public).
          </p>
          <input
            type="file"
            accept="video/mp4,video/webm"
            className="w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-sm"
            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
          />
          <span className="text-xs text-gray-500">Optional thumbnail</span>
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
          <select
            className="w-full border rounded px-3 py-2"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Course (optional)</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Chapter / module"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
          />
          <div className="flex flex-wrap gap-3 text-sm">
            <label>
              Type
              <select
                className="ml-2 border rounded px-2 py-1"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
              >
                <option value="lecture">lecture</option>
                <option value="solution">solution</option>
              </select>
            </label>
            <label>
              Status
              <select
                className="ml-2 border rounded px-2 py-1"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label>
              Order
              <input
                type="number"
                className="ml-2 border rounded px-2 py-1 w-20"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </label>
            <label>
              Duration (sec)
              <input
                type="number"
                className="ml-2 border rounded px-2 py-1 w-24"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <label>
              Access
              <select
                className="ml-2 border rounded px-2 py-1"
                value={accessType}
                onChange={(e) => setAccessType(e.target.value)}
              >
                <option value="subscription">subscription</option>
                <option value="single">single</option>
                <option value="bulk">bulk</option>
              </select>
            </label>
            <label>
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
          {uploading && (
            <div className="w-full bg-gray-200 rounded h-2">
              <div className="bg-[#290c52] h-2 rounded" style={{ width: `${uploadPct}%` }} />
            </div>
          )}
          {uploadMsg && <p className="text-sm text-gray-700">{uploadMsg}</p>}
          <button
            type="submit"
            disabled={uploading || !file}
            className="bg-[#290c52] text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {uploading ? `Uploading ${uploadPct}%…` : "Upload"}
          </button>
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
                {v.title} ({v.type || "lecture"})
              </option>
            ))}
          </select>
          {selectedVideo ? (
            <div className="text-sm text-gray-700">
              Access: <b>{selectedVideo.accessType}</b> · Status:{" "}
              <b>{selectedVideo.status || "active"}</b>
            </div>
          ) : null}
          {accessType !== "subscription" ? (
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              rows={3}
              placeholder="UserIds, comma separated"
              value={assignUserIds}
              onChange={(e) => setAssignUserIds(e.target.value)}
            />
          ) : (
            <div className="text-sm text-gray-700">Uses active subscription ({subscriptionType}).</div>
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
                <div className="text-xs text-gray-500">
                  {v.type || "lecture"} · {v.status || "active"} · order {v.order ?? 0}
                </div>
              </div>
              <Link className="text-sm underline text-[#290c52]" href={`/video/${v._id}`}>
                Preview
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
