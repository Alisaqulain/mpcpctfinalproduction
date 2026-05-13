import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doubt from "@/lib/models/Doubt";
import { getAuth } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { user, error } = await getAuth(req);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { userId } = await params;
    if (user.role !== "admin" && user.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await dbConnect();
    const doubts = await Doubt.find({ userId })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({ success: true, doubts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load doubts" }, { status: 500 });
  }
}

