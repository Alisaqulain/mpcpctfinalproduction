import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import dbConnect from "@/lib/db";
import Video from "@/lib/models/Video";
import { requireAdmin } from "@/lib/apiAuth";
import { isValidObjectId } from "@/lib/objectId";
import {
  ensureDir,
  getLectureStorageDir,
  getSolutionStorageDir,
  getThumbnailStorageDir,
  getMaxVideoBytes,
  saveUploadedFile,
  validateVideoMime,
  safeVideoExtension,
  uniqueFilename,
  toPublicVideo,
} from "@/lib/videoStorage";

export const runtime = "nodejs";

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    await dbConnect();
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const description = formData.get("description") || "";
    const courseId = formData.get("courseId") || "";
    const moduleId = formData.get("moduleId") || formData.get("chapter") || "";
    const videoType = formData.get("type") || "lecture";
    const status = formData.get("status") || "active";
    const order = Number(formData.get("order") || formData.get("sortOrder") || 0);
    const duration = Number(formData.get("duration") || formData.get("durationSeconds") || 0);
    const accessType = formData.get("accessType") || "subscription";
    const subscriptionType = formData.get("subscriptionType") || "learning";
    const thumbnailFile = formData.get("thumbnail");

    if (!file || !title) {
      return NextResponse.json({ error: "file and title are required" }, { status: 400 });
    }

    if (courseId && !isValidObjectId(String(courseId))) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }

    const mimeType = file.type || "video/mp4";
    if (!validateVideoMime(mimeType)) {
      return NextResponse.json({ error: "Only MP4/WebM videos are allowed" }, { status: 400 });
    }

    const maxBytes = getMaxVideoBytes();
    if (file.size && file.size > maxBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const destDir =
      videoType === "solution" ? getSolutionStorageDir() : getLectureStorageDir();
    const saved = await saveUploadedFile(file, destDir, file.name, mimeType);

    let thumbnail = "";
    if (thumbnailFile && thumbnailFile.size > 0) {
      const thumbDir = getThumbnailStorageDir();
      await ensureDir(thumbDir);
      const mime = (thumbnailFile.type || "").toLowerCase();
      const ext =
        mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const thumbName = uniqueFilename(ext);
      const buf = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(join(thumbDir, thumbName), buf);
      thumbnail = thumbName;
    }

    const video = await Video.create({
      title: String(title).trim(),
      description: String(description),
      courseId: courseId || undefined,
      moduleId: String(moduleId).trim(),
      storagePath: saved.storagePath,
      filename: saved.filename,
      mimeType,
      size: saved.size,
      duration: duration || undefined,
      thumbnail,
      order,
      type: videoType === "solution" ? "solution" : "lecture",
      status: status === "inactive" ? "inactive" : "active",
      isActive: status !== "inactive",
      createdBy: auth.user.userId,
      accessType,
      subscriptionType,
      assignedUsers: [],
    });

    return NextResponse.json({ success: true, video: toPublicVideo(video) });
  } catch (e) {
    console.error("video upload error:", e);
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
  }
}
