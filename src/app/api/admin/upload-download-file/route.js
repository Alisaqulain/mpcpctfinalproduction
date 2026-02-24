import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Download from "@/lib/models/Download";
import { jwtVerify } from "jose";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const title_hi = formData.get("title_hi") || "";
    const description = formData.get("description") || "";
    const description_hi = formData.get("description_hi") || "";
    const fileType = formData.get("fileType"); // pdf_notes or syllabus_pdf
    const isFree = formData.get("isFree") === "true";
    const order = parseInt(formData.get("order") || "0");
    const fileSize = formData.get("fileSize") || "";

    if (!file || !title || !fileType) {
      return NextResponse.json({ error: "Missing required fields: file, title, and fileType are required" }, { status: 400 });
    }

    // Validate file type
    if (!["pdf_notes", "syllabus_pdf"].includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type. Only pdf_notes and syllabus_pdf are allowed" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "downloads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename and ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const originalName = file.name;
    const fileExtension = originalName.split(".").pop();
    const fileName = `${fileType}_${timestamp}_${random}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create file URL
    const fileUrl = `/uploads/downloads/${fileName}`;

    // Generate unique download ID
    const downloadId = `download-${fileType}-${timestamp}-${random}`;

    // Check if download ID already exists (unlikely but possible)
    const existing = await Download.findOne({ id: downloadId });
    let finalDownloadId = downloadId;
    if (existing) {
      // If exists, generate new ID
      const newRandom = Math.random().toString(36).substring(2, 9);
      finalDownloadId = `download-${fileType}-${timestamp}-${newRandom}`;
    }

    // Calculate file size string if not provided
    const fileSizeStr = fileSize || `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`;

    // Save to Download model
    const download = await Download.create({
      id: finalDownloadId,
      type: fileType,
      title,
      title_hi: title_hi || "",
      description: description || "",
      description_hi: description_hi || "",
      fileUrl,
      fileSize: fileSizeStr,
      order: order || 0,
      isFree: isFree === true || isFree === "true",
      downloadCount: 0,
    });

    return NextResponse.json({ success: true, download });
  } catch (error) {
    console.error("File upload error:", error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message).join(', ');
      return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ error: `Download with this ID already exists` }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

