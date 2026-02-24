import mongoose from "mongoose";

const DownloadSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ['video_notes', 'pdf_notes', 'syllabus_pdf'], required: true, index: true },
    title: { type: String, required: true },
    title_hi: { type: String }, // Hindi title
    description: { type: String },
    description_hi: { type: String },
    fileUrl: { type: String, required: true }, // URL to the file
    thumbnailUrl: { type: String }, // For video notes
    fileSize: { type: String }, // e.g., "5.2 MB"
    duration: { type: String }, // For video notes, e.g., "10:30"
    category: { type: String }, // Optional category
    order: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false, index: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Download || mongoose.model("Download", DownloadSchema);

