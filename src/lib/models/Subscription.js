import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { 
    type: String, 
    enum: {
      values: ["learning", "skill", "exam", "all"],
      message: "{VALUE} is not a valid subscription type"
    }, 
    required: true 
  },
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  plan: { 
    type: String, 
    required: true 
  }, // Can be: "oneMonth", "threeMonths", "sixMonths", "basic", "premium", "lifetime", "referral_reward", etc.
  price: { type: Number, required: true },
  paymentId: { type: String },
  // Shared membership fields
  sharedLimit: { type: Number, default: 3 }, // Maximum number of users who can share this membership
  ownerRewardGranted: { type: Boolean, default: false }, // Whether owner has received the reward for all 3 activations
  shareToken: { type: String, unique: true, sparse: true }, // Unique token for sharing this subscription
}, { timestamps: true });

// Index for efficient queries
SubscriptionSchema.index({ userId: 1, type: 1, status: 1 });

// Use a function to get or create the model to avoid caching issues
function getSubscriptionModel() {
  if (mongoose.models.Subscription) {
    // In development, delete and recreate to pick up schema changes
    if (process.env.NODE_ENV === 'development') {
      delete mongoose.models.Subscription;
      return mongoose.model("Subscription", SubscriptionSchema);
    }
    return mongoose.models.Subscription;
  }
  return mongoose.model("Subscription", SubscriptionSchema);
}

export default getSubscriptionModel();
