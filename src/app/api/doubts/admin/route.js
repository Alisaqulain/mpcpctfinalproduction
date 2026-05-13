import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doubt from "@/lib/models/Doubt";
import { requireAdmin } from "@/lib/apiAuth";

export const runtime = "nodejs";

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = {};
    if (status) query.status = status;

    const doubts = await Doubt.find(query)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ success: true, doubts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load doubts" }, { status: 500 });
  }
}

