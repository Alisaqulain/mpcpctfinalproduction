import mongoose from "mongoose";

const PricingSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["learning", "skill", "exam"], required: true, unique: true },
    plans: {
      oneMonth: {
        price: { type: Number, required: true, default: 399 },
        originalPrice: { type: Number, required: true, default: 999 },
        discount: { type: Number, default: 0 }, // Auto-calculated
        duration: { type: Number, default: 30 }
      },
      threeMonths: {
        price: { type: Number, required: true, default: 999 },
        originalPrice: { type: Number, required: true, default: 1999 },
        discount: { type: Number, default: 0 },
        duration: { type: Number, default: 90 }
      },
      sixMonths: {
        price: { type: Number, required: true, default: 1499 },
        originalPrice: { type: Number, required: true, default: 2999 },
        discount: { type: Number, default: 0 },
        duration: { type: Number, default: 180 }
      }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Auto-calculate discount before saving
PricingSchema.pre('save', function(next) {
  if (this.plans.oneMonth.originalPrice > 0) {
    this.plans.oneMonth.discount = Math.round(
      ((this.plans.oneMonth.originalPrice - this.plans.oneMonth.price) / this.plans.oneMonth.originalPrice) * 100
    );
  }
  if (this.plans.threeMonths.originalPrice > 0) {
    this.plans.threeMonths.discount = Math.round(
      ((this.plans.threeMonths.originalPrice - this.plans.threeMonths.price) / this.plans.threeMonths.originalPrice) * 100
    );
  }
  if (this.plans.sixMonths.originalPrice > 0) {
    this.plans.sixMonths.discount = Math.round(
      ((this.plans.sixMonths.originalPrice - this.plans.sixMonths.price) / this.plans.sixMonths.originalPrice) * 100
    );
  }
  next();
});

export default mongoose.models.Pricing || mongoose.model("Pricing", PricingSchema);

