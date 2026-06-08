import { NextResponse } from "next/server";
import { isCheckEnvAuthorized, runEnvHealthCheck } from "@/lib/envHealthCheck";

export const runtime = "nodejs";

export async function GET(request) {
  if (!isCheckEnvAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Forbidden — set CHECK_ENV_TOKEN and pass ?token=" },
      { status: 403 }
    );
  }

  try {
    const report = await runEnvHealthCheck();
    return NextResponse.json(report);
  } catch (e) {
    console.error("[check-env]", e);
    return NextResponse.json(
      {
        success: false,
        environment: process.env.NODE_ENV || "development",
        error: "Health check failed",
        message: e?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
