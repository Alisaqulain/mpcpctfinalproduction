import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve, sep, basename } from "path";
import crypto from "crypto";

const ALLOWED_VIDEO_MIMES = new Set(["video/mp4", "video/webm"]);
const ALLOWED_ATTACHMENT_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export function getLectureStorageDir() {
  return process.env.VIDEO_STORAGE_PATH || process.env.VIDEO_UPLOAD_DIR || "/var/www/videos";
}

export function getSolutionStorageDir() {
  return process.env.SOLUTION_VIDEO_STORAGE_PATH || join(getLectureStorageDir(), "solutions");
}

export function getThumbnailStorageDir() {
  return join(getLectureStorageDir(), "thumbnails");
}

export function getDoubtAttachmentDir() {
  return join(getLectureStorageDir(), "doubt-attachments");
}

export function getMaxVideoBytes() {
  return Number(process.env.VIDEO_MAX_BYTES || 1024 * 1024 * 1024);
}

export async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

function allowedRoots() {
  return [resolve(getLectureStorageDir()), resolve(getSolutionStorageDir())];
}

/** Resolve absolute path for stored video; blocks path traversal. */
export function resolveVideoAbsolutePath(video) {
  if (video?.filePath && !video?.storagePath) {
    return resolveLegacyPath(video.filePath);
  }
  const dir = video?.storagePath;
  const name = video?.filename;
  if (!dir || !name) return null;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  const full = resolve(join(dir, name));
  const roots = allowedRoots();
  if (!roots.some((root) => full === root || full.startsWith(root + sep))) return null;
  return full;
}

function resolveLegacyPath(filePath) {
  const full = resolve(filePath);
  const roots = allowedRoots();
  if (!roots.some((root) => full === root || full.startsWith(root + sep))) return null;
  return full;
}

export function validateVideoMime(mimeType) {
  if (!mimeType) return true;
  return ALLOWED_VIDEO_MIMES.has(String(mimeType).toLowerCase());
}

export function validateAttachmentMime(mimeType) {
  if (!mimeType) return false;
  return ALLOWED_ATTACHMENT_MIMES.has(String(mimeType).toLowerCase());
}

export function safeVideoExtension(originalName, mimeType) {
  const mime = String(mimeType || "").toLowerCase();
  if (mime === "video/webm") return "webm";
  const ext = originalName?.includes(".") ? originalName.split(".").pop() : "mp4";
  const safe = String(ext).toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  return safe === "webm" ? "webm" : "mp4";
}

export function uniqueFilename(ext) {
  return `${crypto.randomUUID()}.${ext}`;
}

export async function saveUploadedFile(file, destDir, originalName, mimeType) {
  await ensureDir(destDir);
  const ext = safeVideoExtension(originalName, mimeType);
  const filename = uniqueFilename(ext);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fullPath = join(destDir, filename);
  await writeFile(fullPath, buffer);
  return { storagePath: destDir, filename, size: buffer.length, fullPath };
}

export async function saveBufferFile(buffer, destDir, ext, mimeType) {
  await ensureDir(destDir);
  const filename = uniqueFilename(ext.replace(/^\./, "") || "bin");
  const fullPath = join(destDir, filename);
  await writeFile(fullPath, buffer);
  return { storagePath: destDir, filename, size: buffer.length };
}

export function toPublicVideo(doc) {
  if (!doc) return null;
  const v = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete v.storagePath;
  delete v.filename;
  delete v.filePath;
  delete v.youtubeUrl;
  const status = v.status || (v.isActive === false ? "inactive" : "active");
  return {
    ...v,
    status,
    order: v.order ?? v.sortOrder ?? 0,
    duration: v.duration ?? v.durationSeconds,
    size: v.size ?? v.sizeBytes,
    thumbnail: v.thumbnail ?? v.thumbnailUrl ?? "",
    moduleId: v.moduleId ?? v.courseLabel ?? "",
  };
}
