import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import Doubt from "@/lib/models/Doubt";
import { getAuth } from "@/lib/apiAuth";
import { statSync, createReadStream } from "fs";
import { lookup as lookupMime } from "mime-types";

export const runtime = "nodejs";

function parseRange(rangeHeader, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
  if (!m) return null;
  const startStr = m[1];
  const endStr = m[2];
  let start = startStr ? parseInt(startStr, 10) : 0;
  let end = endStr ? parseInt(endStr, 10) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start < 0) start = 0;
  if (end >= size) end = size - 1;
  if (start > end) return null;
  return { start, end };
}

export async function GET(req, { params }) {
  const { user, error } = await getAuth(req);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const { publicId } = await params;
    const msg = await ChatMessage.findOne({ videoPublicId: publicId }).lean();
    if (!msg || !msg.videoFilePath) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const doubt = await Doubt.findById(msg.doubtId).lean();
    if (!doubt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && String(doubt.userId) !== String(user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const s = statSync(msg.videoFilePath);
    const size = s.size;
    const rangeHeader = req.headers.get("range");
    const contentType = msg.mimeType || lookupMime(msg.videoFilePath) || "video/mp4";

    if (!rangeHeader) {
      const stream = createReadStream(msg.videoFilePath);
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(size),
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=0, no-store",
        },
      });
    }

    const r = parseRange(rangeHeader, size);
    if (!r) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }

    const chunkSize = r.end - r.start + 1;
    const stream = createReadStream(msg.videoFilePath, { start: r.start, end: r.end });
    return new Response(stream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${r.start}-${r.end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Stream failed" }, { status: 500 });
  }
}

