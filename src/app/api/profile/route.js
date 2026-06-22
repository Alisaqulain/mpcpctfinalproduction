// /src/app/api/profile/route.js
import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import cloudinary from "@/lib/cloudinary";
import { getJwtSecretBytes } from "@/lib/jwtSecret";

async function uploadProfilePhoto(file) {
  const hasCloudinaryConfig = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  const isValidFile =
    file &&
    typeof file.arrayBuffer === "function" &&
    file.size !== undefined &&
    file.size > 0 &&
    file.type &&
    file.type.startsWith("image/");

  if (!hasCloudinaryConfig || !isValidFile) {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "profiles",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      )
      .end(buffer);
  });

  return uploadResult.secure_url;
}

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    console.log("Token received:", token ? "Present" : "Missing");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    console.log("Token payload:", payload);
    
    await dbConnect();

    // Get user data from database
    const user = await User.findById(payload.userId).select('-password');
    console.log("User found:", user ? "Yes" : "No");
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's active subscriptions
    const Subscription = (await import("@/lib/models/Subscription")).default;
    
    // First try to find "all" type subscription
    let activeSubscription = await Subscription.findOne({
      userId: user._id,
      type: "all",
      status: "active",
      endDate: { $gt: new Date() }
    }).sort({ endDate: -1 });

    // If no "all" type, get any active subscription
    if (!activeSubscription) {
      activeSubscription = await Subscription.findOne({
        userId: user._id,
        status: "active",
        endDate: { $gt: new Date() }
      }).sort({ endDate: -1 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileUrl: user.profileUrl,
        states: user.states,
        city: user.city,
        role: user.role || "user",
        referralCode: user.referralCode || null,
        referralRewards: user.referralRewards || 0,
        authProvider: user.authProvider || "credentials",
        isEmailVerified: !!user.isEmailVerified,
        isPhoneVerified: !!(user.isPhoneVerified || user.isMobileVerified),
        isMobileVerified: !!(user.isMobileVerified || user.isPhoneVerified),
        avatar: user.avatar || user.profileUrl,
      },
      subscription: activeSubscription ? {
        _id: activeSubscription._id,
        id: activeSubscription._id,
        type: activeSubscription.type,
        plan: activeSubscription.plan,
        status: activeSubscription.status,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        price: activeSubscription.price
      } : null
    });

  } catch (err) {
    console.error("Profile error:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function PATCH(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    await dbConnect();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const file = formData.get("profile");

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Name must be 100 characters or less." }, { status: 400 });
    }

    user.name = name;

    try {
      const imageUrl = await uploadProfilePhoto(file);
      if (imageUrl) {
        user.profileUrl = imageUrl;
        user.avatar = imageUrl;
      }
    } catch (uploadErr) {
      console.error("Profile photo upload error:", uploadErr);
      return NextResponse.json({ error: "Failed to upload profile photo." }, { status: 500 });
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileUrl: user.profileUrl,
        states: user.states,
        city: user.city,
        avatar: user.avatar || user.profileUrl,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
