import mongoose from "mongoose";

const SkillTestSettingsSchema = new mongoose.Schema(
  {
    // Single document - use a fixed ID
    id: { type: String, default: "settings", unique: true },
    mainLanguages: [{ type: String }], // e.g., ["Hindi", "English"]
    subLanguages: [{ type: String }], // e.g., ["Ramington Gail", "Inscript"]
    backspaceOptions: [{ type: String }], // e.g., ["OFF", "ON"]
    durations: [{ type: Number }], // e.g., [2, 5, 10, 15, 20, 30]
    description: { type: String, default: "" },
    description_hindi: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.SkillTestSettings || mongoose.model("SkillTestSettings", SkillTestSettingsSchema);

