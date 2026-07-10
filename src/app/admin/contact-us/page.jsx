"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES = {
  new: "bg-red-100 text-red-700",
  read: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-700",
};

export default function AdminContactUsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const query = params.toString();
    const r = await fetch(`/api/admin/contact-submissions${query ? `?${query}` : ""}`, {
      credentials: "include",
    });
    const j = await r.json();
    if (r.ok) {
      setSubmissions(j.submissions || []);
      setNewCount(j.newCount ?? 0);
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
  }, [statusFilter, ready]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const r = await fetch("/api/admin/contact-submissions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id, status }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to update");
      if (selected?._id === id) setSelected(j.submission);
      await load();
    } catch (e) {
      alert(e.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const deleteSubmission = async (id) => {
    if (!confirm("Delete this contact message?")) return;
    setUpdating(true);
    try {
      const r = await fetch(`/api/admin/contact-submissions?_id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to delete");
      if (selected?._id === id) setSelected(null);
      await load();
    } catch (e) {
      alert(e.message || "Failed to delete");
    } finally {
      setUpdating(false);
    }
  };

  const openSubmission = async (item) => {
    setSelected(item);
    if (item.status === "new") {
      await updateStatus(item._id, "read");
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#290c52]">
              Admin · Contact Us
              {newCount > 0 && (
                <span className="ml-2 text-sm bg-red-600 text-white px-2 py-0.5 rounded-full">
                  {newCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Messages submitted from the Contact Us page
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin" className="text-[#290c52] underline font-medium">
              ← Admin home
            </Link>
            <Link href="/admin/doubts" className="text-[#290c52] underline font-medium">
              Student doubts
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-4 flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-[#290c52] text-white rounded-md text-sm hover:bg-[#3d1577]"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-gray-800">
              Messages ({submissions.length})
            </div>
            {submissions.length === 0 ? (
              <div className="p-6 text-gray-600 text-sm">No contact messages yet.</div>
            ) : (
              <div className="divide-y max-h-[70vh] overflow-y-auto">
                {submissions.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => openSubmission(item)}
                    className={`w-full text-left p-4 hover:bg-purple-50 transition-colors ${
                      selected?._id === item._id ? "bg-purple-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                        <div className="text-xs text-gray-600 truncate">{item.email}</div>
                        <div className="text-sm text-gray-700 mt-1 line-clamp-2">{item.message}</div>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded shrink-0 ${
                          STATUS_STYLES[item.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-2">{formatDate(item.createdAt)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden min-h-[320px]">
            <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-gray-800">
              Details
            </div>
            {!selected ? (
              <div className="p-6 text-gray-600 text-sm">Select a message to view details.</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs uppercase font-bold px-2 py-1 rounded ${
                      STATUS_STYLES[selected.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selected.status}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(selected.createdAt)}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-gray-800">Name:</span> {selected.name}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">Email:</span>{" "}
                    <a href={`mailto:${selected.email}`} className="text-blue-600 underline">
                      {selected.email}
                    </a>
                  </p>
                  {selected.phone && (
                    <p>
                      <span className="font-semibold text-gray-800">Phone:</span> {selected.phone}
                    </p>
                  )}
                  <p>
                    <span className="font-semibold text-gray-800">Email sent:</span>{" "}
                    {selected.emailSent ? "Yes" : "No (saved in admin panel)"}
                  </p>
                </div>

                <div>
                  <div className="font-semibold text-gray-800 text-sm mb-1">Message</div>
                  <div className="bg-gray-50 border rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.status !== "read" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => updateStatus(selected._id, "read")}
                      className="px-3 py-1.5 text-xs bg-yellow-500 text-black rounded-md disabled:opacity-50"
                    >
                      Mark Read
                    </button>
                  )}
                  {selected.status !== "resolved" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => updateStatus(selected._id, "resolved")}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {selected.status !== "new" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => updateStatus(selected._id, "new")}
                      className="px-3 py-1.5 text-xs bg-gray-200 text-gray-800 rounded-md disabled:opacity-50"
                    >
                      Mark New
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => deleteSubmission(selected._id)}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
