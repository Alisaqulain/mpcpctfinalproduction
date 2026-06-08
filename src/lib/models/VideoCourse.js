import mongoose from "mongoose";

const VideoCourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    slug: { type: String, trim: true, index: true },
    subscriptionType: {
      type: String,
      enum: ["learning", "exam", "all"],
      default: "learning",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.VideoCourse || mongoose.model("VideoCourse", VideoCourseSchema);
