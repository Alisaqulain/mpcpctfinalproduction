import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    mobile: { type: String, index: true, sparse: true },
    email: { type: String, index: true, sparse: true },
    codeHash: { type: String, default: "" },
    /** Legacy plain code — do not write new records */
    code: { type: String },
    provider: { type: String, enum: ["local", "none"], default: "local" },
    purpose: {
      type: String,
      enum: [
        "verify_mobile",
        "forgot_password",
        "signup",
        "login",
        "reset_email",
        "reset_phone",
      ],
      default: "verify_mobile",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
