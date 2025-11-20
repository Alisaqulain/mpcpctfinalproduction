import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    referralCode: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed", "rewarded"], default: "pending" },
    referrerRewardMonths: { type: Number, default: 0 }, // Months added to referrer
    referredRewardMonths: { type: Number, default: 0 }, // Months added to referred user
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" }, // Subscription that triggered reward
  },
  { timestamps: true }
);

// Index for efficient queries
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referralCode: 1 });

export default mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);







