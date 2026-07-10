import mongoose from "mongoose";

const ContactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new",
      index: true,
    },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ContactSubmission ||
  mongoose.model("ContactSubmission", ContactSubmissionSchema);
