import { supabase } from "@/integrations/supabase/client";

export interface PricingTier {
  id: string;
  product_id: string;
  min_quantity: number;
  max_quantity: number | null;
  price_override: number;
  discount_percentage: number | null;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface DiscountResult {
  valid: boolean;
  discountAmount: number;
  message: string;
  discountCode?: DiscountCode;
}

export class PricingService {
  /**
   * Calculate price for a product based on quantity (bulk pricing)
   */
  static async calculateBulkPrice(
    productId: string,
    basePrice: number,
    quantity: number
  ): Promise<{ unitPrice: number; totalPrice: number; savings: number }> {
    try {
      const { data: tiers } = await supabase
        .from("pricing_tiers")
        .select("*")
        .eq("product_id", productId)
        .order("min_quantity", { ascending: false });

      // Find applicable tier
      let applicableTier = null;
      if (tiers) {
        applicableTier = tiers.find(
          (tier) =>
            tier.min_quantity <= quantity &&
            (!tier.max_quantity || tier.max_quantity >= quantity)
        );
      }

      let unitPrice = basePrice;
      if (applicableTier) {
        if (applicableTier.price_override) {
          unitPrice = applicableTier.price_override;
        } else if (applicableTier.discount_percentage) {
          unitPrice = basePrice * (1 - applicableTier.discount_percentage / 100);
        }
      }

      const totalPrice = unitPrice * quantity;
      const savings = basePrice * quantity - totalPrice;

      return { unitPrice, totalPrice, savings };
    } catch (error) {
      console.error("Error calculating bulk price:", error);
      return {
        unitPrice: basePrice,
        totalPrice: basePrice * quantity,
        savings: 0,
      };
    }
  }

  /**
   * Get all pricing tiers for a product
   */
  static async getPricingTiers(productId: string): Promise<PricingTier[]> {
    try {
      const { data } = await supabase
        .from("pricing_tiers")
        .select("*")
        .eq("product_id", productId)
        .order("min_quantity", { ascending: true });

      return data || [];
    } catch (error) {
      console.error("Error fetching pricing tiers:", error);
      return [];
    }
  }
}

export class DiscountService {
  /**
   * Validate and apply a discount code
   */
  static async validateAndApplyDiscount(
    code: string,
    orderValue: number
  ): Promise<DiscountResult> {
    try {
      const { data: discountCode } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (!discountCode) {
        return { valid: false, discountAmount: 0, message: "Discount code not found" };
      }

      // Check if active
      if (!discountCode.is_active) {
        return { valid: false, discountAmount: 0, message: "This discount code has expired" };
      }

      // Check date range
      const now = new Date();
      if (discountCode.start_date && new Date(discountCode.start_date) > now) {
        return { valid: false, discountAmount: 0, message: "This discount code is not yet active" };
      }
      if (discountCode.end_date && new Date(discountCode.end_date) < now) {
        return { valid: false, discountAmount: 0, message: "This discount code has expired" };
      }

      // Check usage limit
      if (discountCode.max_uses && discountCode.current_uses >= discountCode.max_uses) {
        return { valid: false, discountAmount: 0, message: "This discount code has reached its usage limit" };
      }

      // Check minimum order value
      if (discountCode.min_order_value && orderValue < discountCode.min_order_value) {
        return {
          valid: false,
          discountAmount: 0,
          message: `Minimum order value of $${discountCode.min_order_value.toFixed(2)} required`,
        };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discountCode.discount_type === "percentage") {
        discountAmount = (orderValue * discountCode.discount_value) / 100;
      } else {
        discountAmount = Math.min(discountCode.discount_value, orderValue);
      }

      return {
        valid: true,
        discountAmount,
        message: `Discount applied: ${discountCode.discount_type === 'percentage' ? discountCode.discount_value + '%' : '$' + discountCode.discount_value.toFixed(2)} off`,
        discountCode,
      };
    } catch (error) {
      console.error("Error validating discount code:", error);
      return { valid: false, discountAmount: 0, message: "Error validating discount code" };
    }
  }

  /**
   * Record discount usage
   */
  static async recordDiscountUsage(codeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("discount_codes")
        .update({ current_uses: supabase.rpc("increment_uses") })
        .eq("id", codeId);

      return !error;
    } catch (error) {
      console.error("Error recording discount usage:", error);
      return false;
    }
  }

  /**
   * Get active discount codes
   */
  static async getActiveDiscountCodes(): Promise<DiscountCode[]> {
    try {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("is_active", true)
        .or(
          `start_date.is.null,start_date.lte.${now}`
        )
        .or(
          `end_date.is.null,end_date.gte.${now}`
        );

      return data || [];
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      return [];
    }
  }
}
