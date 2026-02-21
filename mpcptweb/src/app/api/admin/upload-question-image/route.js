import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
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
    const type = formData.get("type") || "question-image";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (limit to 5MB for images)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      }, { status: 400 });
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.` 
      }, { status: 400 });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads", "question-images");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = originalName.split(".").pop();
    // Get filename without extension
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    // Sanitize filename: replace spaces and special characters with underscores
    const sanitizedName = nameWithoutExt
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars with underscores
      .replace(/_{2,}/g, '_')  // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '');  // Remove leading/trailing underscores
    const fileName = `${timestamp}_${sanitizedName}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the imageUrl - Next.js automatically serves files from public/ folder
    // So /uploads/question-images/filename.png will be accessible at that URL
    const imageUrl = `/uploads/question-images/${fileName}`;
    
    console.log('✅ Image uploaded successfully:', {
      fileName: fileName,
      imageUrl: imageUrl,
      filePath: filePath,
      fileSize: buffer.length
    });

    return NextResponse.json({ 
      success: true, 
      imageUrl: imageUrl // Always return imageUrl, never undefined
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}

