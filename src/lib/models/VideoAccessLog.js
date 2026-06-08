import mongoose from "mongoose";

const VideoAccessLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoCourse", index: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    watchedAt: { type: Date, default: Date.now, index: true },
    lastPosition: { type: Number, default: 0 },
    action: {
      type: String,
      enum: ["play", "pause", "seek", "complete", "view"],
      default: "view",
    },
  },
  { timestamps: true }
);

VideoAccessLogSchema.index({ videoId: 1, userId: 1, createdAt: -1 });

export default mongoose.models.VideoAccessLog ||
  mongoose.model("VideoAccessLog", VideoAccessLogSchema);
