import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import Doubt from "@/lib/models/Doubt";
import { getAuth } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { user, error } = await getAuth(req);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const { doubtId } = await params;
    const doubt = await Doubt.findById(doubtId).lean();
    if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

    if (user.role !== "admin" && String(doubt.userId) !== String(user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await ChatMessage.find({ doubtId }).sort({ createdAt: 1 }).lean();
    const safe = messages.map((m) => {
      const { videoFilePath, ...rest } = m;
      return rest;
    });
    return NextResponse.json({ success: true, messages: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load chat" }, { status: 500 });
  }
}

