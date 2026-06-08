import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doubt from "@/lib/models/Doubt";
import { requirePhoneVerified, requireAdmin } from "@/lib/apiAuth";
import { isValidObjectId } from "@/lib/objectId";
import { sanitizeMessage } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const doubt = await Doubt.findById(id).lean();
    if (!doubt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (auth.user.role !== "admin" && String(doubt.userId) !== String(auth.user.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, doubt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = await requirePhoneVerified(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await dbConnect();
    const doubt = await Doubt.findById(id);
    if (!doubt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = auth.user.role === "admin";
    const isOwner = String(doubt.userId) === String(auth.user.userId);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const msg = sanitizeMessage(body.message);
    const attachment = body.attachment || body.attachmentUrl || "";

    if (body.action === "close" && isAdmin) {
      doubt.status = "closed";
      doubt.resolvedAt = new Date();
      await doubt.save();
      return NextResponse.json({ success: true, doubt });
    }

    if (!msg) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    doubt.messages.push({
      senderId: auth.user.userId,
      senderRole: isAdmin ? "admin" : "user",
      message: msg,
      attachment,
      createdAt: new Date(),
    });
    doubt.lastMessageAt = new Date();
    if (isAdmin) {
      doubt.status = body.markClosed ? "closed" : "replied";
      if (body.markClosed) doubt.resolvedAt = new Date();
    } else if (doubt.status === "closed") {
      doubt.status = "pending";
    }

    await doubt.save();
    return NextResponse.json({ success: true, doubt });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
