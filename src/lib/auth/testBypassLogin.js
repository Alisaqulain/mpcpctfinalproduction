import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Subscription from "@/lib/models/Subscription";

export const TEST_BYPASS_PHONE = "9876543210";
export const TEST_BYPASS_PASSWORD = "123456";

const TEST_LIFETIME_DAYS = 36500;

function getLifetimeEndDate() {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + TEST_LIFETIME_DAYS);
  return endDate;
}

/** Grant active lifetime access to all paid content for the test bypass user. */
export async function ensureTestBypassLifetimeSubscription(userId) {
  if (!isTestBypassEnabled()) return null;

  const endDate = getLifetimeEndDate();
  const now = new Date();

  let subscription = await Subscription.findOne({
    userId,
    type: "all",
    status: "active",
    endDate: { $gt: now },
  });

  if (subscription) {
    if (subscription.plan !== "lifetime" || subscription.endDate < endDate) {
      subscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          $set: {
            plan: "lifetime",
            endDate,
            price: 0,
            paymentId: "test_bypass_lifetime",
          },
        },
        { new: true }
      );
    }
    return subscription;
  }

  const expired = await Subscription.findOne({ userId, type: "all" });
  if (expired) {
    return Subscription.findByIdAndUpdate(
      expired._id,
      {
        $set: {
          status: "active",
          plan: "lifetime",
          startDate: now,
          endDate,
          price: 0,
          paymentId: "test_bypass_lifetime",
        },
      },
      { new: true }
    );
  }

  return Subscription.create({
    userId,
    type: "all",
    status: "active",
    plan: "lifetime",
    startDate: now,
    endDate,
    price: 0,
    paymentId: "test_bypass_lifetime",
  });
}

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
  } else {
    const updates = {
      isPhoneVerified: true,
      isMobileVerified: true,
      password: passwordHash,
    };
    await User.findByIdAndUpdate(user._id, { $set: updates });
    user = await User.findById(user._id);
  }

  await ensureTestBypassLifetimeSubscription(user._id);
  return user;
}
