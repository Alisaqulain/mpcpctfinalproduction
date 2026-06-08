import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoCourse",
      index: true,
    },
    moduleId: { type: String, default: "", trim: true },
    /** Directory on VPS — never expose to client */
    storagePath: { type: String, select: false },
    /** Unique filename within storagePath — never expose */
    filename: { type: String, select: false },
    mimeType: { type: String, default: "video/mp4" },
    size: { type: Number },
    duration: { type: Number },
    thumbnail: { type: String, default: "" },
    order: { type: Number, default: 0, index: true },
    type: {
      type: String,
      enum: ["lecture", "solution"],
      default: "lecture",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Legacy filesystem fields (migrated uploads) */
    filePath: { type: String, select: false },
    publicId: { type: String, unique: true, sparse: true, index: true },
    originalName: { type: String },
    sizeBytes: { type: Number },
    durationSeconds: { type: Number },
    thumbnailUrl: { type: String, default: "" },
    courseLabel: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    accessType: {
      type: String,
      enum: ["single", "bulk", "subscription"],
      default: "subscription",
      index: true,
    },
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    subscriptionType: {
      type: String,
      enum: ["learning", "exam", "all"],
      default: "learning",
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

VideoSchema.index({ courseId: 1, order: 1 });
VideoSchema.index({ createdAt: -1 });

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
