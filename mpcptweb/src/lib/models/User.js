import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  states: { type: String, required: true },
  city: { type: String, required: true },
  profileUrl: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  referralCode: { type: String, unique: true, sparse: true }, // User's own referral code
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who referred this user
  referralRewards: { type: Number, default: 0 }, // Number of months earned from referrals
}, { timestamps: true });

// Generate referral code before saving
UserSchema.pre('save', function(next) {
  if (!this.referralCode) {
    // Generate unique referral code: first 3 letters of name + last 4 digits of phone
    const namePart = this.name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const phonePart = this.phoneNumber.slice(-4);
    this.referralCode = `${namePart}${phonePart}`;
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
