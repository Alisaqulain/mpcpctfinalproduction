import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import dbConnect from "@/lib/db";
import Download from "@/lib/models/Download";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");
    const fileName = searchParams.get("file");

    if (!fileId && !fileName) {
      return NextResponse.json({ error: "File ID or filename is required" }, { status: 400 });
    }

    await dbConnect();

    // Find the download record
    let download;
    if (fileId) {
      download = await Download.findOne({ id: fileId });
    } else if (fileName) {
      // Extract filename from path if full path is provided
      const cleanFileName = fileName.split("/").pop();
      download = await Download.findOne({ fileUrl: { $regex: cleanFileName } });
    }

    if (!download) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check authentication and membership for non-free files
    if (!download.isFree) {
      try {
        const token = request.cookies.get("token")?.value;
        if (!token) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        const userId = payload?.userId;

        if (userId) {
          const user = await User.findById(userId);
          if (user?.role !== "admin") {
            // Check for active subscription
            const subscription = await Subscription.findOne({
              userId,
              status: "active",
              endDate: { $gt: new Date() }
            });

            if (!subscription) {
              return NextResponse.json({ error: "Membership required to download this file" }, { status: 403 });
            }
          }
        }
      } catch (error) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
    }

    // Get file path
    // fileUrl is stored as /uploads/downloads/filename.pdf
    const filePath = join(process.cwd(), "public", download.fileUrl);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      return NextResponse.json({ error: "File not found on server" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);
    const fileExtension = download.fileUrl.split(".").pop().toLowerCase();

    // Determine content type
    const contentTypeMap = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    };

    const contentType = contentTypeMap[fileExtension] || "application/octet-stream";

    // Increment download count
    download.downloadCount = (download.downloadCount || 0) + 1;
    await download.save().catch(err => console.error("Error updating download count:", err));

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${download.title.replace(/[^a-z0-9]/gi, '_')}.${fileExtension}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}















