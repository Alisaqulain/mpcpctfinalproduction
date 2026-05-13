import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    /** Absolute path on server filesystem, e.g. /var/www/videos/abc.mp4 */
    filePath: { type: String, required: true },
    /** Stable id used by stream API (and hides real path) */
    publicId: { type: String, required: true, unique: true, index: true },
    originalName: { type: String },
    mimeType: { type: String },
    sizeBytes: { type: Number },
    durationSeconds: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accessType: {
      type: String,
      enum: ["single", "bulk", "subscription"],
      default: "single",
      index: true,
    },
    /** For accessType single/bulk */
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    /** For accessType subscription */
    subscriptionType: { type: String, enum: ["learning", "exam", "all"], default: "learning" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

VideoSchema.index({ createdAt: -1 });

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);

