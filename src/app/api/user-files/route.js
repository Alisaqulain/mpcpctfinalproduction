import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserFile from "@/lib/models/UserFile";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// GET - Fetch user's own files
export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("fileType"); // Optional filter: 'pdf_notes' or 'syllabus_pdf'

    await dbConnect();
    
    const query = { userId };
    if (fileType) {
      query.fileType = fileType;
    }

    const files = await UserFile.find(query)
      .sort({ createdAt: -1 });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("User files fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user files" }, { status: 500 });
  }
}




