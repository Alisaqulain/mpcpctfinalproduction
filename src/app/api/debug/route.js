import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { getJwtSecretBytes } from "@/lib/jwtSecret";

/**
 * Diagnostic endpoint — disabled in production unless ENABLE_DEBUG_API=true.
 * Never expose raw secrets or full user records.
 */
export async function GET(request) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEBUG_API !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const token = request.cookies.get("token")?.value;

    const debugInfo = {
      hasToken: Boolean(token),
      tokenLength: token ? token.length : 0,
      mongodbUriConfigured: Boolean(process.env.MONGODB_URI),
      jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
    };

    if (token) {
      try {
        const { payload } = await jwtVerify(token, getJwtSecretBytes());
        debugInfo.tokenPayload = {
          userId: payload.userId,
          role: payload.role,
          exp: payload.exp,
        };

        try {
          await dbConnect();
          debugInfo.dbConnection = "Connected";

          const user = await User.findById(payload.userId).select(
            "name email phoneNumber role"
          );
          debugInfo.userFound = Boolean(user);
          if (user) {
            debugInfo.userSummary = {
              id: user._id,
              role: user.role,
            };
          }
        } catch (dbError) {
          debugInfo.dbError = dbError.message;
        }
      } catch (jwtError) {
        debugInfo.jwtError = jwtError.message;
      }
    }

    return NextResponse.json(debugInfo);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
