import mongoose from "mongoose";

const UserFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, required: true },
    fileType: { type: String, enum: ["pdf_notes", "syllabus_pdf"], required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number }, // in bytes
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Admin who uploaded
    description: { type: String },
  },
  { timestamps: true }
);

// Index for efficient queries
UserFileSchema.index({ userId: 1, fileType: 1 });

export default mongoose.models.UserFile || mongoose.model("UserFile", UserFileSchema);

