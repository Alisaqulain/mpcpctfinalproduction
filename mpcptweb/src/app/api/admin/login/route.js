import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { phoneNumber, password } = body;

    // Validate input
    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "Phone number and password required" }, { status: 400 });
    }

    // Get admin credentials from environment variables (fallback to defaults)
    const adminPhone = process.env.ADMIN_PHONE || "7869654042";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@mpcpct.com";

    // First, try to find user with this phone number
    let user = await User.findOne({ phoneNumber });

    // If user exists
    if (user) {
      // If user is already admin, verify password
      if (user.role === "admin") {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        // Admin user authenticated successfully
      } else {
        // User exists but is not admin - check if they're using admin credentials
        if (phoneNumber === adminPhone && password === adminPassword) {
          // Convert regular user to admin
          // Check if adminEmail is already taken by another user
          const emailConflict = await User.findOne({ 
            email: adminEmail,
            _id: { $ne: user._id } // Exclude current user
          });
          
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          const updateData = {
            name: "Admin",
            password: hashedPassword,
            states: "NA",
            city: "NA",
            role: "admin",
          };
          
          // Only update email if it doesn't conflict
          if (!emailConflict) {
            updateData.email = adminEmail;
          }
          
          user = await User.findByIdAndUpdate(
            user._id,
            updateData,
            { new: true }
          );
        } else {
          // Not admin credentials - deny access
          return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
        }
      }
    } else {
      // User doesn't exist - check if credentials match admin env vars
      if (phoneNumber !== adminPhone) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (password !== adminPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Check if email already exists (to avoid duplicate key error)
      const existingByEmail = await User.findOne({ email: adminEmail });
      if (existingByEmail) {
        // Email exists - check if phone number conflicts
        if (existingByEmail.phoneNumber !== adminPhone) {
          // Check if another user has the admin phone number
          const existingByPhone = await User.findOne({ phoneNumber: adminPhone });
          if (existingByPhone && existingByPhone._id.toString() !== existingByEmail._id.toString()) {
            // Conflict: email belongs to one user, phone to another
            console.error("Admin setup conflict: Email and phone belong to different users");
            return NextResponse.json({ 
              error: "Admin account conflict. Please contact system administrator." 
            }, { status: 409 });
          }
        }
        // Update the existing user to admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        user = await User.findByIdAndUpdate(
          existingByEmail._id,
          {
            name: "Admin",
            phoneNumber: adminPhone,
            password: hashedPassword,
            states: "NA",
            city: "NA",
            role: "admin",
          },
          { new: true }
        );
      } else {
        // Check if phone number is already taken by another user
        const existingByPhone = await User.findOne({ phoneNumber: adminPhone });
        if (existingByPhone) {
          // Phone exists but email doesn't - update existing user
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          user = await User.findByIdAndUpdate(
            existingByPhone._id,
            {
              name: "Admin",
              email: adminEmail,
              password: hashedPassword,
              states: "NA",
              city: "NA",
              role: "admin",
            },
            { new: true }
          );
        } else {
          // No user exists with phone or email - create new admin user
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          user = new User({
            name: "Admin",
            email: adminEmail,
            phoneNumber: adminPhone,
            password: hashedPassword,
            states: "NA",
            city: "NA",
            role: "admin",
          });
          await user.save();
        }
      }
    }

    // Generate JWT token with admin role
    const token = await new SignJWT({ 
      userId: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: "admin"
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Create response with admin data
    const response = NextResponse.json({
      message: "Admin login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: "admin",
      }
    });

    // Check if request is over HTTPS (for secure cookie)
    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || 
                    req.url?.startsWith('https://') ||
                    process.env.NEXT_PUBLIC_FORCE_SECURE_COOKIE === 'true';
    
    // Set JWT token as HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isHttps, // Only set secure if actually using HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    });

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    
    // Handle duplicate key errors specifically
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return NextResponse.json({ 
        error: `Duplicate ${field} error. Please contact system administrator.` 
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}

