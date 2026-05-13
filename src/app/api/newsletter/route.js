import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MarketingLead from "@/lib/models/MarketingLead";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await dbConnect();
    await MarketingLead.findOneAndUpdate(
      { email },
      { email, source: "newsletter", meta: { page: body.page || "/" } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
