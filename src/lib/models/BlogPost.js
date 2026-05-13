import mongoose from "mongoose";

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    contentFormat: {
      type: String,
      enum: ["markdown", "html"],
      default: "markdown",
    },
    featuredImage: { type: String, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      default: null,
    },
    tags: [{ type: String }],
    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    readingMinutes: { type: Number, default: 0 },
    author: { type: String, default: "MPC PCT Editorial" },
  },
  { timestamps: true }
);

BlogPostSchema.index({ published: 1, publishedAt: -1 });

export default mongoose.models.BlogPost ||
  mongoose.model("BlogPost", BlogPostSchema);
