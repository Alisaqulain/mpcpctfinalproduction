import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

// Prevent static generation during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req) {
  try {
    // Get server time
    const serverTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Try to connect to database
    let dbConnected = false;
    try {
      // Only try to connect if MONGODB_URI is available
      if (process.env.MONGODB_URI) {
        await dbConnect();
        dbConnected = true;
      } else {
        dbConnected = false;
      }
    } catch (error) {
      console.error("Database connection error:", error);
      dbConnected = false;
    }

    return NextResponse.json({
      success: true,
      serverTime,
      database: dbConnected ? "connected" : "disconnected",
      environment: process.env.NODE_ENV || "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Status check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}





















