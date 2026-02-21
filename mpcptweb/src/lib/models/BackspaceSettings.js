import mongoose from "mongoose";

const BackspaceSettingsSchema = new mongoose.Schema(
  {
    duration: { type: Number, required: true, unique: true }, // Duration in minutes (e.g., 5, 10, 15)
    backspaceLimit: { type: Number, required: true, default: 0 }, // Number of backspaces allowed (0 = unlimited)
    isActive: { type: Boolean, default: true },
    description: { type: String }, // Optional description like "5min-10 backspace"
  },
  { timestamps: true }
);

// Index for efficient queries
BackspaceSettingsSchema.index({ duration: 1 });

export default mongoose.models.BackspaceSettings || mongoose.model("BackspaceSettings", BackspaceSettingsSchema);

