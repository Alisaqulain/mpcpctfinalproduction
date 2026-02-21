import dbConnect from "./db";
import Subscription from "./models/Subscription";
import User from "./models/User";

// Check if user has access to specific content
export async function checkAccess(userId, contentType, itemId = null) {
  try {
    await dbConnect();
    
    // Get user to check if they're admin
    const user = await User.findById(userId);
    if (user?.role === "admin") {
      return { hasAccess: true, reason: "admin" };
    }

    // Check if user has active subscription
    // First check for "all" type subscription (unified subscription)
    let subscription = await Subscription.findOne({
      userId,
      type: "all",
      status: "active",
      endDate: { $gt: new Date() }
    });

    // If no unified subscription, check for specific type subscription
    if (!subscription) {
      subscription = await Subscription.findOne({
        userId,
        type: contentType,
        status: "active",
        endDate: { $gt: new Date() }
      });
    }

    if (subscription) {
      return { hasAccess: true, reason: "subscription", subscription };
    }

    // Check if this is the free item (first item in each category)
    const isFreeItem = await checkIfFreeItem(contentType, itemId);
    if (isFreeItem) {
      return { hasAccess: true, reason: "free" };
    }

    return { hasAccess: false, reason: "paid_content" };
  } catch (error) {
    console.error("Access check error:", error);
    return { hasAccess: false, reason: "error" };
  }
}

// Check if specific item is free (first item in category)
async function checkIfFreeItem(contentType, itemId) {
  // For now, we'll consider the first item as free
  // This can be enhanced with a "isFree" field in the models
  if (!itemId) return false;
  
  // You can add logic here to determine which items are free
  // For example, check if it's the first lesson in a section
  return false; // Default to false, implement your free logic
}

// Get subscription plans
export const SUBSCRIPTION_PLANS = {
  learning: {
    basic: { price: 299, duration: 30, name: "Learning Basic" },
    premium: { price: 599, duration: 90, name: "Learning Premium" },
    lifetime: { price: 1999, duration: 36500, name: "Learning Lifetime" }
  },
  skill: {
    basic: { price: 199, duration: 30, name: "Skill Basic" },
    premium: { price: 499, duration: 90, name: "Skill Premium" },
    lifetime: { price: 1499, duration: 36500, name: "Skill Lifetime" }
  },
  exam: {
    basic: { price: 399, duration: 30, name: "Exam Basic" },
    premium: { price: 799, duration: 90, name: "Exam Premium" },
    lifetime: { price: 2499, duration: 36500, name: "Exam Lifetime" }
  }
};
