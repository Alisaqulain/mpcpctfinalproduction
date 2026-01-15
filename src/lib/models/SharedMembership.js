import mongoose from "mongoose";

const SharedMembershipSchema = new mongoose.Schema({
  subscriptionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Subscription", 
    required: true,
    index: true 
  },
  sharedUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  activatedAt: { 
    type: Date, 
    default: Date.now 
  },
  // Store the subscription that was created/extended for the shared user
  sharedUserSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription"
  }
}, { timestamps: true });

// Ensure a user can only activate a specific subscription once
SharedMembershipSchema.index({ subscriptionId: 1, sharedUserId: 1 }, { unique: true });

// Index for efficient queries
SharedMembershipSchema.index({ subscriptionId: 1, activatedAt: 1 });

export default mongoose.models.SharedMembership || mongoose.model("SharedMembership", SharedMembershipSchema);

