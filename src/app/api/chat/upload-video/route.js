import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import Doubt from "@/lib/models/Doubt";
import { requireAdmin } from "@/lib/apiAuth";

export const runtime = "nodejs";

function getSolutionStorageDir() {
  return (
    process.env.SOLUTION_VIDEO_STORAGE_PATH ||
    process.env.VIDEO_STORAGE_PATH ||
    "/var/www/videos/solutions"
  );
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    await dbConnect();
    const formData = await request.formData();
    const file = formData.get("file");
    const doubtId = formData.get("doubtId");
    const message = formData.get("message") || "Solution video";

    if (!file || !doubtId) {
      return NextResponse.json({ error: "file and doubtId required" }, { status: 400 });
    }

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

    const maxBytes = Number(process.env.VIDEO_MAX_BYTES || 1024 * 1024 * 1024);
    if (file.size && file.size > maxBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const dir = getSolutionStorageDir();
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    const publicId = crypto.randomUUID();
    const originalName = file.name || "solution";
    const ext = originalName.includes(".") ? originalName.split(".").pop() : "mp4";
    const safeExt = String(ext).toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    const fileName = `${publicId}.${safeExt}`;
    const filePath = join(dir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const msg = await ChatMessage.create({
      doubtId,
      senderId: auth.user.userId,
      senderRole: "admin",
      type: "video",
      message: String(message),
      videoFilePath: filePath,
      videoPublicId: publicId,
      mimeType: file.type || null,
      sizeBytes: buffer.length,
    });

    doubt.lastMessageAt = new Date();
    await doubt.save();

    const { videoFilePath, ...safe } = msg.toObject();
    return NextResponse.json({ success: true, message: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to upload solution video" }, { status: 500 });
  }
}

