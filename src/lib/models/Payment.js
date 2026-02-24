import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, unique: true },
  gateway: { type: String, required: true }, // razorpay, stripe, etc.
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
