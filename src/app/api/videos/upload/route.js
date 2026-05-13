import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { requireAdmin } from "@/lib/apiAuth";

export const runtime = "nodejs";

function getVideoStorageDir() {
  return (
    process.env.VIDEO_STORAGE_PATH ||
    process.env.VIDEO_UPLOAD_DIR ||
    "/var/www/videos"
  );
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    await dbConnect();
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const accessType = formData.get("accessType") || "single";
    const subscriptionType = formData.get("subscriptionType") || "learning";

    if (!file || !title) {
      return NextResponse.json({ error: "file and title are required" }, { status: 400 });
    }

    const maxBytes = Number(process.env.VIDEO_MAX_BYTES || 1024 * 1024 * 1024); // 1GB default
    if (file.size && file.size > maxBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const storageDir = getVideoStorageDir();
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true });
    }

    const publicId = crypto.randomUUID();
    const originalName = file.name || "video";
    const ext = originalName.includes(".") ? originalName.split(".").pop() : "mp4";
    const safeExt = String(ext).toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    const fileName = `${publicId}.${safeExt}`;
    const filePath = join(storageDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const video = await Video.create({
      title: String(title).trim(),
      description: String(description),
      filePath,
      publicId,
      originalName,
      mimeType: file.type || null,
      sizeBytes: buffer.length,
      createdBy: auth.user.userId,
      accessType,
      subscriptionType,
      assignedUsers: [],
      isActive: true,
    });

    return NextResponse.json({ success: true, video });
  } catch (e) {
    console.error("video upload error:", e);
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
  }
}

