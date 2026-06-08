import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import dbConnect from "@/lib/db";
import Doubt from "@/lib/models/Doubt";
import { getAuth } from "@/lib/apiAuth";
import { getDoubtAttachmentDir } from "@/lib/videoStorage";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { user, error } = await getAuth(req);
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename } = await params;
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    await dbConnect();
    const doubtQuery = {
      $or: [
        { attachment: filename },
        { attachmentUrl: { $regex: filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") } },
        { "messages.attachment": filename },
      ],
    };
    if (user.role !== "admin") doubtQuery.userId = user.userId;
    const canAccess = user.role === "admin" || (await Doubt.findOne(doubtQuery).lean());

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const path = join(getDoubtAttachmentDir(), filename);
    if (!existsSync(path)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buf = await readFile(path);
    const ext = filename.split(".").pop()?.toLowerCase();
    const type =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "pdf"
            ? "application/pdf"
            : "image/jpeg";

    return new Response(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
