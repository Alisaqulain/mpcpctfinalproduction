import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import Doubt from "@/lib/models/Doubt";
import { getAuth } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function POST(req) {
  const { user, error } = await getAuth(req);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const body = await req.json();
    const { doubtId, message, type } = body;
    if (!doubtId) return NextResponse.json({ error: "doubtId required" }, { status: 400 });

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

    if (user.role !== "admin" && String(doubt.userId) !== String(user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const msg = await ChatMessage.create({
      doubtId,
      senderId: user.userId,
      senderRole: user.role === "admin" ? "admin" : "user",
      type: type === "video" ? "video" : "text",
      message: String(message || "").trim(),
    });

    doubt.lastMessageAt = new Date();
    if (user.role === "admin" && body.resolve === true) {
      doubt.status = "resolved";
      doubt.resolvedAt = new Date();
    }
    await doubt.save();

    const { videoFilePath, ...safe } = msg.toObject();
    return NextResponse.json({ success: true, message: safe });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}

