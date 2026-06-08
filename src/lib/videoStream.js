import { statSync, createReadStream } from "fs";
import { lookup as lookupMime } from "mime-types";
import { resolveVideoAbsolutePath } from "@/lib/videoStorage";

export function parseRange(rangeHeader, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
  if (!m) return null;
  let start = m[1] ? parseInt(m[1], 10) : 0;
  let end = m[2] ? parseInt(m[2], 10) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start < 0) start = 0;
  if (end >= size) end = size - 1;
  if (start > end) return null;
  return { start, end };
}

export function streamVideoFile(video, rangeHeader) {
  const absPath = resolveVideoAbsolutePath(video);
  if (!absPath) return { error: "invalid_path", status: 404 };

  const s = statSync(absPath);
  const size = s.size;
  const contentType = video.mimeType || lookupMime(absPath) || "video/mp4";

  if (!rangeHeader) {
    const stream = createReadStream(absPath);
    return {
      response: new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(size),
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=0, no-store",
        },
      }),
    };
  }

  const r = parseRange(rangeHeader, size);
  if (!r) {
    return {
      response: new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      }),
    };
  }

  const chunkSize = r.end - r.start + 1;
  const stream = createReadStream(absPath, { start: r.start, end: r.end });
  return {
    response: new Response(stream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${r.start}-${r.end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=0, no-store",
      },
    }),
  };
}
