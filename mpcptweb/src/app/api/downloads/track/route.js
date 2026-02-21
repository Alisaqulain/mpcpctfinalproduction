import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Download from "@/lib/models/Download";

export async function POST(req) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { downloadId } = body;
    
    if (!downloadId) {
      return NextResponse.json({ error: "Missing downloadId" }, { status: 400 });
    }
    
    // Increment download count
    const download = await Download.findByIdAndUpdate(
      downloadId,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    
    if (!download) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, downloadCount: download.downloadCount });
  } catch (error) {
    console.error('Error tracking download:', error);
    return NextResponse.json({ error: error.message || 'Failed to track download' }, { status: 500 });
  }
}

