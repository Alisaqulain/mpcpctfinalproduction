"use client";

import { useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";

const WHATSAPP_NUMBER = "918989966753";

export default function FloatingGrowthWidgets({ minimal = false, showWhatsApp = false }) {
  const wa =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP ||
    WHATSAPP_NUMBER;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const share = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setStatus("Link copied");
        setTimeout(() => setStatus(""), 2000);
      }
    } catch {
      /* ignore */
    }
  };

  const subscribe = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          page: typeof window !== "undefined" ? window.location.pathname : "/",
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("Subscribed!");
      setEmail("");
    } catch {
      setStatus("Try again later");
    }
  };

  const waHref = `https://wa.me/${String(wa).replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi MPCPCT — I want help with CCC / CPCT / typing practice."
  )}`;

  return (
    <>
      <div className="fixed bottom-6 right-4 z-[60] flex flex-col gap-3 items-end">
        {!minimal && (
          <button
            type="button"
            onClick={share}
            className="rounded-full bg-slate-900 text-white p-3 shadow-lg hover:bg-slate-800"
            aria-label="Share page"
          >
            <Share2 size={22} />
          </button>
        )}
        {showWhatsApp && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-green-600 text-white p-3 shadow-lg hover:bg-green-500"
            aria-label="WhatsApp MPCPCT — 8989966753"
            title="WhatsApp: 8989966753"
          >
            <MessageCircle size={24} />
          </a>
        )}
        {!minimal && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow-lg hover:bg-indigo-500"
          >
            Updates
          </button>
        )}
      </div>

      {!minimal && open && (
        <div className="fixed bottom-24 right-4 z-[70] w-[min(100vw-2rem,320px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <p className="text-sm font-semibold text-slate-900">Exam tips & offers</p>
          <p className="text-xs text-slate-500 mt-1">
            occasional CCC / CPCT / typing updates — no spam.
          </p>
          <form onSubmit={subscribe} className="mt-3 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-semibold"
            >
              Join
            </button>
          </form>
          {status && <p className="text-xs mt-2 text-indigo-600">{status}</p>}
        </div>
      )}
    </>
  );
}
