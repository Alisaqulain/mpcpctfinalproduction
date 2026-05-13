import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Result from "@/lib/models/Result";
import { getAuth } from "@/lib/apiAuth";

export async function GET(req, { params }) {
  try {
    const { userId } = await params;
    const { user, error } = await getAuth(req);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.userId !== userId && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const results = await Result.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
  }
}
