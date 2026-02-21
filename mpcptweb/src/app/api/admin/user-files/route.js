import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserFile from "@/lib/models/UserFile";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await dbConnect();
    const files = await UserFile.find({ userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("User files fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user files" }, { status: 500 });
  }
}

