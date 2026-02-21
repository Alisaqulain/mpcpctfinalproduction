import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Create response
    const response = NextResponse.json({ message: "Logout successful" });
    
    // Check if request is over HTTPS (for secure cookie)
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || 
                    req.url?.startsWith('https://') ||
                    process.env.NEXT_PUBLIC_FORCE_SECURE_COOKIE === 'true';
    
    // Clear the token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: isHttps, // Only set secure if actually using HTTPS
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/"
    });

    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
