import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    
    const debugInfo = {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      mongodbUri: process.env.MONGODB_URI ? "Set" : "Not set",
      jwtSecret: JWT_SECRET ? "Set" : "Not set"
    };

    if (token) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        debugInfo.tokenPayload = payload;
        
        // Test database connection
        try {
          await dbConnect();
          debugInfo.dbConnection = "Connected";
          
          // Try to find user
          const user = await User.findById(payload.userId).select('-password');
          debugInfo.userFound = !!user;
          if (user) {
            debugInfo.userData = {
              id: user._id,
              name: user.name,
              email: user.email,
              phoneNumber: user.phoneNumber
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
