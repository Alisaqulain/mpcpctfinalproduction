"use client";

import { useMemo } from "react";
import { Facebook, Linkedin, Link2, Share2 } from "lucide-react";

export default function BlogShareBar({ title, url }) {
  const encoded = useMemo(() => encodeURIComponent(url), [url]);
  const titleEnc = useMemo(() => encodeURIComponent(title), [title]);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    } catch {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-6 border-y border-slate-200">
      <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
        <Share2 size={18} /> Share
      </span>
      <a
        className="inline-flex items-center gap-1 rounded-lg bg-[#1877F2]/10 text-[#1877F2] px-3 py-1.5 text-sm font-medium hover:bg-[#1877F2]/20"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Facebook size={16} /> Facebook
      </a>
      <a
        className="inline-flex items-center gap-1 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] px-3 py-1.5 text-sm font-medium hover:bg-[#0A66C2]/20"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Linkedin size={16} /> LinkedIn
      </a>
      <a
        className="inline-flex items-center gap-1 rounded-lg bg-slate-900/10 text-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-900/20"
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${titleEnc}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X / Twitter
      </a>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Link2 size={16} /> Copy link
      </button>
    </div>
  );
}
