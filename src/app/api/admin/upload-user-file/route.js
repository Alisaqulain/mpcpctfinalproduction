import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserFile from "@/lib/models/UserFile";
import User from "@/lib/models/User";
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
    const userId = formData.get("userId");
    const fileType = formData.get("fileType");
    const description = formData.get("description") || "";

    if (!file || !userId || !fileType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "user-files");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = originalName.split(".").pop();
    const fileName = `${userId}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create file URL
    const fileUrl = `/uploads/user-files/${fileName}`;

    // Save to database
    const userFile = await UserFile.create({
      userId,
      userName: user.name,
      fileType,
      fileName: originalName,
      fileUrl,
      fileSize: buffer.length,
      uploadedBy: payload.userId,
      description,
    });

    return NextResponse.json({ success: true, file: userFile });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

