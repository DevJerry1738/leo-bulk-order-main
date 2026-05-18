import { useState } from "react";
import { DiscountService } from "@/services/pricing-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface DiscountCodeInputProps {
  orderValue: number;
  onDiscountApplied: (discountAmount: number, codeId: string, code: string) => void;
  onDiscountRemoved: () => void;
}

export default function DiscountCodeInput({
  orderValue,
  onDiscountApplied,
  onDiscountRemoved,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    amount: number;
    codeId: string;
    code: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string>("");

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError("Please enter a discount code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await DiscountService.validateAndApplyDiscount(
        code,
        orderValue
      );

      if (result.valid && result.discountCode) {
        setAppliedDiscount({
          amount: result.discountAmount,
          codeId: result.discountCode.id,
          code: code.toUpperCase(),
          message: result.message,
        });
        onDiscountApplied(result.discountAmount, result.discountCode.id, code.toUpperCase());
        setCode("");
      } else {
        setError(result.message);
        setAppliedDiscount(null);
      }
    } catch (err) {
      setError("Error validating discount code. Please try again.");
      console.error("Discount validation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setCode("");
    setError("");
    onDiscountRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleApplyCode();
    }
  };

  if (appliedDiscount) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-green-900">Discount Applied</p>
                <Badge className="bg-green-100 text-green-800">{appliedDiscount.code}</Badge>
              </div>
              <p className="text-sm text-green-700 mb-2">{appliedDiscount.message}</p>
              <p className="text-sm font-semibold text-green-900">
                Savings: {formatCurrency(appliedDiscount.amount)}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveDiscount}
            className="text-green-600 hover:text-green-700 mt-1 flex-shrink-0"
            title="Remove discount"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Discount Code</label>
      <div className="flex gap-2">
        <Input
          placeholder="Enter discount code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyPress={handleKeyPress}
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={handleApplyCode}
          disabled={loading || !code.trim()}
          variant="outline"
          className="whitespace-nowrap"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Apply
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
