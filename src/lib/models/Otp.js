import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, index: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["verify_mobile", "forgot_password", "signup"],
      default: "verify_mobile",
    },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
