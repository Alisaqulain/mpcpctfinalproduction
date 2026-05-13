import mongoose from "mongoose";

/** Newsletter / lead captures */
const MarketingLeadSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    source: { type: String, default: "newsletter" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.MarketingLead ||
  mongoose.model("MarketingLead", MarketingLeadSchema);
