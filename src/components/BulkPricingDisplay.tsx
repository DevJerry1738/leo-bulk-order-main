import { useEffect, useState } from "react";
import { PricingService, PricingTier } from "@/services/pricing-service";
import { formatCurrency } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BulkPricingDisplayProps {
  productId: string;
  basePrice: number;
  currentQuantity: number;
}

export default function BulkPricingDisplay({
  productId,
  basePrice,
  currentQuantity,
}: BulkPricingDisplayProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [bulkPrice, setBulkPrice] = useState<{
    unitPrice: number;
    totalPrice: number;
    savings: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPricingTiers = async () => {
      setLoading(true);
      const tierData = await PricingService.getPricingTiers(productId);
      setTiers(tierData);
      
      if (currentQuantity > 1) {
        const pricing = await PricingService.calculateBulkPrice(
          productId,
          basePrice,
          currentQuantity
        );
        setBulkPrice(pricing);
      }
      setLoading(false);
    };

    loadPricingTiers();
  }, [productId, basePrice, currentQuantity]);

  if (loading || !tiers.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Current pricing */}
      {currentQuantity > 1 && bulkPrice && bulkPrice.savings > 0 && (
        <Card className="p-3 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Volume Discount Applied</p>
              <p className="text-xs text-green-700">
                {formatCurrency(bulkPrice.savings)} savings on {currentQuantity} units
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {formatCurrency(bulkPrice.unitPrice)}/unit
            </Badge>
          </div>
        </Card>
      )}

      {/* Tier chart */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Volume Pricing Tiers</p>
        <div className="space-y-1">
          {tiers.map((tier, idx) => {
            const isApplicable =
              currentQuantity >= tier.min_quantity &&
              (!tier.max_quantity || currentQuantity <= tier.max_quantity);

            const displayPrice = tier.price_override || basePrice;
            const savings =
              tier.discount_percentage || 
              ((basePrice - (tier.price_override || basePrice)) / basePrice * 100) || 0;

            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between p-2 rounded text-sm transition-colors ${
                  isApplicable
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex-1">
                  <span className="text-gray-600">
                    {tier.min_quantity}
                    {tier.max_quantity ? `–${tier.max_quantity}` : "+"} units
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(displayPrice)}
                  </span>
                  {savings > 0 && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      Save {Math.round(savings)}%
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
