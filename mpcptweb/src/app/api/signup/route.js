// /src/app/api/signup/route.js
import { NextResponse } from "next/server";
export const runtime = "nodejs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import cloudinary from "@/lib/cloudinary";

const JWT_SECRET = process.env.JWT_SECRET || "secret123"; // keep in .env

export async function POST(req) {
  try {
    await dbConnect();

    const formData = await req.formData();

    const name = formData.get("name");
    const phoneNumber = formData.get("phoneNumber");
    const email = formData.get("email");
    const password = formData.get("password");
    const rePassword = formData.get("rePassword");
    const states = formData.get("states");
    const city = formData.get("city");
    const file = formData.get("profile");

    if (!name || !phoneNumber || !email || !password || !states || !city) {
      return NextResponse.json({ error: "All fields except profile are required." }, { status: 400 });
    }

    if (password !== rePassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const existing = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existing) {
      return NextResponse.json({ error: "Email or phone already exists." }, { status: 400 });
    }

    let imageUrl = undefined;
    try {
      const hasCloudinaryConfig = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      // Check if file is valid: must exist, have arrayBuffer method, and have size > 0
      const isValidFile = file && 
                         typeof file.arrayBuffer === "function" && 
                         file.size !== undefined && 
                         file.size > 0 &&
                         file.type && 
                         file.type.startsWith('image/');

      if (hasCloudinaryConfig && isValidFile) {
        console.log("📂 Uploading profile photo:", file.name, file.type, file.size, "bytes");
      
        const buffer = Buffer.from(await file.arrayBuffer());
      
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { 
                resource_type: "image", 
                folder: "profiles",
                transformation: [
                  { width: 400, height: 400, crop: "fill", gravity: "face" },
                  { quality: "auto", fetch_format: "auto" }
                ]
              },
              (err, result) => {
                if (err) {
                  console.error("❌ Cloudinary error:", err);
                  reject(err);
                } else {
                  console.log("✅ Profile photo uploaded successfully:", result.secure_url);
                  resolve(result);
                }
              }
            )
            .end(buffer);
        });
      
        imageUrl = uploadResult.secure_url;
        console.log("✅ Profile photo URL saved:", imageUrl);
      } else if (file && !isValidFile) {
        console.warn("⚠️ Invalid file provided or Cloudinary not configured. File details:", {
          hasFile: !!file,
          hasArrayBuffer: file && typeof file.arrayBuffer === "function",
          size: file?.size,
          type: file?.type,
          hasCloudinaryConfig
        });
      }
      
    } catch (uploadErr) {
      console.error("❌ Profile upload error:", uploadErr?.message || uploadErr);
      // Continue without image - profile photo is optional
      console.warn("⚠️ Continuing signup without profile photo");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
      states,
      city,
      profileUrl: imageUrl,
    });

    await newUser.save();

    // Return success response without setting cookie
    // The login API will handle setting the JWT token
    return NextResponse.json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phoneNumber,
      },
    });

  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
