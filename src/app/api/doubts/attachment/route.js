import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { requirePhoneVerified } from "@/lib/apiAuth";
import {
  ensureDir,
  getDoubtAttachmentDir,
  uniqueFilename,
  validateAttachmentMime,
} from "@/lib/videoStorage";

export const runtime = "nodejs";

export async function POST(req) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !file.size) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const mime = (file.type || "").toLowerCase();
    if (!validateAttachmentMime(mime)) {
      return NextResponse.json({ error: "Invalid attachment type" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Attachment too large (max 5MB)" }, { status: 400 });
    }

    const ext =
      mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "application/pdf" ? "pdf" : "jpg";
    const dir = getDoubtAttachmentDir();
    await ensureDir(dir);
    const filename = uniqueFilename(ext);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buf);

    return NextResponse.json({
      success: true,
      attachment: filename,
      attachmentUrl: `/api/doubts/attachment/${filename}`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
