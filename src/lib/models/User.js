import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    states: { type: String, default: "" },
    city: { type: String, default: "" },
    profileUrl: { type: String },
    avatar: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    authProvider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
    googleId: { type: String, unique: true, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    /** @deprecated use isPhoneVerified — kept for backward compatibility */
    isMobileVerified: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    referralRewards: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.pre("save", function syncPhoneVerified(next) {
  if (this.isPhoneVerified) this.isMobileVerified = true;
  if (this.isMobileVerified && !this.isPhoneVerified) this.isPhoneVerified = true;
  if (this.profileUrl && !this.avatar) this.avatar = this.profileUrl;
  if (this.avatar && !this.profileUrl) this.profileUrl = this.avatar;
  next();
});

UserSchema.pre("save", function referralCodeGen(next) {
  if (!this.referralCode && this.name && this.phoneNumber) {
    const namePart = this.name.substring(0, 3).toUpperCase().replace(/\s/g, "");
    const phonePart = this.phoneNumber.slice(-4);
    this.referralCode = `${namePart}${phonePart}`;
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
