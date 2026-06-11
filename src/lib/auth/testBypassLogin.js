import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const TEST_BYPASS_PHONE = "9876543210";
export const TEST_BYPASS_PASSWORD = "123456";

export function isTestBypassEnabled() {
  if (process.env.ENABLE_TEST_BYPASS_LOGIN === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function matchesTestBypass(phoneNumber, password) {
  const mobile = String(phoneNumber || "").replace(/\D/g, "").slice(-10);
  return mobile === TEST_BYPASS_PHONE && password === TEST_BYPASS_PASSWORD;
}

/** Find or create a phone-verified test user for local QA. */
export async function findOrCreateTestBypassUser() {
  await dbConnect();

  let user = await User.findOne({ phoneNumber: TEST_BYPASS_PHONE });
  const passwordHash = await bcrypt.hash(TEST_BYPASS_PASSWORD, 10);

  if (!user) {
    user = await User.create({
      name: "Test User",
      phoneNumber: TEST_BYPASS_PHONE,
      email: "test9876543210@phone.mpcpct.in",
      password: passwordHash,
      isPhoneVerified: true,
      isMobileVerified: true,
      authProvider: "credentials",
    });
    return user;
  }

  const updates = {
    isPhoneVerified: true,
    isMobileVerified: true,
  };
  if (!user.password) {
    updates.password = passwordHash;
  }

  await User.findByIdAndUpdate(user._id, { $set: updates });
  return User.findById(user._id);
}
