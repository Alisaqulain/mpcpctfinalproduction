import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Pricing from "@/lib/models/Pricing";

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    if (type) {
      const pricing = await Pricing.findOne({ type });
      if (!pricing) {
        // Return default pricing if not found
        return NextResponse.json({ 
          pricing: getDefaultPricing(type) 
        });
      }
      return NextResponse.json({ pricing });
    }
    
    // Return all pricing
    const allPricing = await Pricing.find({});
    const pricingMap = {};
    allPricing.forEach(p => {
      pricingMap[p.type] = p;
    });
    
    // Fill in defaults for missing types
    ["learning", "skill", "exam"].forEach(t => {
      if (!pricingMap[t]) {
        pricingMap[t] = getDefaultPricing(t);
      }
    });
    
    return NextResponse.json({ pricing: pricingMap });
  } catch (error) {
    console.error("Pricing fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }
}

function getDefaultPricing(type) {
  const defaults = {
    learning: {
      oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
      threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
      sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
    },
    skill: {
      oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
      threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
      sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
    },
    exam: {
      oneMonth: { price: 399, originalPrice: 999, discount: 60, duration: 30 },
      threeMonths: { price: 999, originalPrice: 1999, discount: 50, duration: 90 },
      sixMonths: { price: 1499, originalPrice: 2999, discount: 50, duration: 180 }
    }
  };
  return defaults[type] || defaults.learning;
}

