import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { z } from "zod";
import { ChevronRight, Check, Copy } from "lucide-react";
import DiscountCodeInput from "@/components/DiscountCodeInput";

const schema = z.object({
  deliveryType: z.enum(["pickup", "delivery"]),
  paymentMethod: z.enum(["pickup", "bank_transfer"]),
  deliveryAddress: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

type Step = "fulfillment" | "payment" | "review";

export default function Checkout() {
  const { items, total, itemCount, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("fulfillment");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [paymentMethod, setPaymentMethod] = useState<"pickup" | "bank_transfer">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCodeId, setAppliedCodeId] = useState<string | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"bank" | "account" | null>(null);

  const handleCopy = (text: string, field: "bank" | "account") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === "bank" ? "Bank Name" : "Account Number"} copied to clipboard!`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  useEffect(() => {
    if (itemCount === 0) navigate("/cart");
  }, [itemCount, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("default_delivery_address")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.default_delivery_address) setDeliveryAddress(data.default_delivery_address);
      });
  }, [user]);

  const canProceedFulfillment = deliveryType === "pickup" || (deliveryType === "delivery" && deliveryAddress.trim());
  const canProceedPayment = paymentMethod === "pickup" || (paymentMethod === "bank_transfer" && receiptFile);

  const onSubmit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ deliveryType, paymentMethod, deliveryAddress, notes });
    if (!parsed.success) {
      toast.error("Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      let receiptPath: string | null = null;

      // Upload receipt if bank transfer
      if (paymentMethod === "bank_transfer" && receiptFile) {
        const fileExt = receiptFile.name.split('.').pop()?.toLowerCase() || "jpg";
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, receiptFile);
        if (uploadError) throw uploadError;
        receiptPath = fileName;
      }

      // Prepare items for RPC
      const validatedItems = Object.values(items)
        .map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        }))
        .filter((item) => item.product_id && typeof item.quantity === "number" && item.quantity > 0);

      if (validatedItems.length === 0) {
        throw new Error("No valid items in cart");
      }

      // Call checkout RPC
      const { data, error: rpcError } = await supabase.rpc("checkout_v1", {
        p_user_id: user.id,
        p_items: validatedItems,
        p_payment_method: paymentMethod,
        p_delivery_type: deliveryType,
        p_receipt_url: receiptPath,
        p_delivery_address: deliveryType === "delivery" ? deliveryAddress.trim() : null,
        p_notes: notes.trim() || null,
        p_discount_code_id: appliedCodeId,
        p_discount_amount: discountAmount > 0 ? discountAmount : null,
      });

      if (rpcError) throw rpcError;

      const rpcResult = data as {
        success: boolean;
        order_number?: string;
        error?: string;
      } | null;

      if (!rpcResult || !rpcResult.success) {
        throw new Error(rpcResult?.error || 'Checkout failed');
      }

      clear();
      toast.success(`Order ${rpcResult.order_number} placed!`);
      navigate("/orders");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: "fulfillment", label: "Fulfillment" },
    { id: "payment", label: "Payment" },
    { id: "review", label: "Review" },
  ] as const;

  return (
    <div className="max-w-4xl">
      {/* Step Indicator */}
      <div className="mb-12">
        <div className="flex justify-between items-start pb-4 relative">
          {/* Connecting lines between steps */}
          <div className="absolute top-6 left-[25%] right-[25%] h-1 bg-muted rounded-full transition-all -z-10" />
          <div className={`absolute top-6 left-[25%] h-1 rounded-full transition-all -z-10 ${canProceedFulfillment ? "bg-gradient-to-r from-primary to-primary/50" : "bg-transparent"}`} style={{ width: "calc(50% - 24px)" }} />
          <div className={`absolute top-6 left-1/2 right-[25%] h-1 rounded-full transition-all -z-10 ${canProceedPayment ? "bg-gradient-to-r from-primary to-primary/50" : "bg-muted"}`} />

          {/* Step items */}
          {steps.map((s, idx) => (
            <div key={s.id} className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (s.id === "fulfillment") setStep("fulfillment");
                  if (s.id === "payment" && canProceedFulfillment) setStep("payment");
                  if (s.id === "review" && canProceedFulfillment && canProceedPayment) setStep("review");
                }}
                className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                  step === s.id
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg scale-110"
                    : (s.id === "fulfillment") || (s.id === "payment" && canProceedFulfillment) || (s.id === "review" && canProceedFulfillment && canProceedPayment)
                    ? "bg-primary/15 text-primary cursor-pointer hover:bg-primary/25 border-2 border-primary/30"
                    : "bg-muted text-muted-foreground border-2 border-muted"
                }`}
              >
                {idx + 1}
              </button>
              <div className={`text-sm font-semibold mt-2 transition-all ${step === s.id ? "text-primary" : "text-muted-foreground"}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Fulfillment */}
          {step === "fulfillment" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">How will you receive your order?</h2>
                <p className="text-muted-foreground">Select pickup or delivery option</p>
              </div>

              <div className="space-y-3">
                <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as any)}>
                  <div className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-accent cursor-pointer transition-all" data-state={deliveryType === "pickup" ? "checked" : ""}>
                    <RadioGroupItem value="pickup" id="pickup" className="h-6 w-6" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Pickup</div>
                      <div className="text-sm text-muted-foreground">Collect from Leo Cosmetics warehouse</div>
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-accent cursor-pointer transition-all" data-state={deliveryType === "delivery" ? "checked" : ""}>
                    <RadioGroupItem value="delivery" id="delivery" className="h-6 w-6" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Delivery</div>
                      <div className="text-sm text-muted-foreground">Ship to your business address</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {deliveryType === "delivery" && (
                <div className="space-y-2 animate-in fade-in">
                  <Label htmlFor="addr" className="text-base font-semibold">Delivery Address</Label>
                  <Textarea
                    id="addr"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address, city, postal code…"
                    rows={3}
                    maxLength={500}
                    className="resize-none"
                  />
                  <div className="text-xs text-muted-foreground">{deliveryAddress.length}/500 characters</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or requests…"
                  rows={2}
                  maxLength={500}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={() => setStep("payment")}
                disabled={!canProceedFulfillment}
                className="w-full"
                size="lg"
              >
                Continue to payment <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === "payment" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">How will you pay?</h2>
                <p className="text-muted-foreground">Select your payment method</p>
              </div>

              <div className="space-y-3">
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                  <div className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-accent cursor-pointer transition-all" data-state={paymentMethod === "pickup" ? "checked" : ""}>
                    <RadioGroupItem value="pickup" id="pay_pickup" className="h-6 w-6" />
                    <Label htmlFor="pay_pickup" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Pay on {deliveryType === "pickup" ? "Pickup" : "Delivery"}</div>
                      <div className="text-sm text-muted-foreground">Pay when receiving your order</div>
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-accent cursor-pointer transition-all" data-state={paymentMethod === "bank_transfer" ? "checked" : ""}>
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" className="h-6 w-6" />
                    <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">Transfer to our account and upload receipt</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === "bank_transfer" && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Bank Details Section */}
                  <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-base font-semibold block">Transfer Details</Label>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center group/bank border-b border-blue-100/50 pb-2">
                        <div>
                          <div className="text-xs text-blue-700 font-semibold uppercase">Bank Name</div>
                          <div className="text-sm font-medium text-slate-800">{import.meta.env.VITE_BANK_NAME || "First Bank"}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(import.meta.env.VITE_BANK_NAME || "First Bank", "bank")}
                          className="p-1.5 rounded-md hover:bg-blue-200/50 text-blue-700 hover:text-blue-800 transition-colors"
                          title="Copy Bank Name"
                        >
                          {copiedField === "bank" ? (
                            <Check className="h-4 w-4 text-green-600 animate-in zoom-in duration-150" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex justify-between items-center group/account">
                        <div>
                          <div className="text-xs text-blue-700 font-semibold uppercase">Account Number</div>
                          <div className="text-sm font-mono font-medium text-slate-800">{import.meta.env.VITE_BANK_ACCOUNT_NUMBER || "1234567890"}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(import.meta.env.VITE_BANK_ACCOUNT_NUMBER || "1234567890", "account")}
                          className="p-1.5 rounded-md hover:bg-blue-200/50 text-blue-700 hover:text-blue-800 transition-colors"
                          title="Copy Account Number"
                        >
                          {copiedField === "account" ? (
                            <Check className="h-4 w-4 text-green-600 animate-in zoom-in duration-150" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 border-t pt-2">
                      Please transfer the exact order amount to this account and upload the receipt below.
                    </p>
                  </div>

                  {/* Receipt Upload Section */}
                  <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Label htmlFor="receipt" className="text-base font-semibold block">Upload Payment Receipt</Label>
                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    {receiptFile && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Check className="h-4 w-4" /> {receiptFile.name}
                      </div>
                    )}
                    <p className="text-xs text-amber-700">
                      Upload a screenshot or photo of your bank transfer receipt (JPG, PNG, etc.)
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("fulfillment")}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("review")}
                  disabled={!canProceedPayment}
                  className="flex-1"
                  size="lg"
                >
                  Review order <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-2">Confirm your order</h2>
                <p className="text-muted-foreground">Review everything before placing your order</p>
              </div>

              <div className="space-y-4 border rounded-lg p-4 bg-card">
                <div>
                  <div className="font-semibold text-sm text-muted-foreground uppercase mb-2">Fulfillment</div>
                  <div className="font-medium">{deliveryType === "pickup" ? "Pickup" : "Delivery"}</div>
                  {deliveryType === "delivery" && <div className="text-sm text-muted-foreground mt-1">{deliveryAddress}</div>}
                </div>
                <div className="border-t pt-4">
                  <div className="font-semibold text-sm text-muted-foreground uppercase mb-2">Payment</div>
                  <div className="font-medium">{paymentMethod === "pickup" ? "Pay on Delivery" : "Bank Transfer"}</div>
                </div>
                {notes && (
                  <div className="border-t pt-4">
                    <div className="font-semibold text-sm text-muted-foreground uppercase mb-2">Notes</div>
                    <div className="text-sm">{notes}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("payment")}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? "Placing order…" : "Place order"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg bg-card sticky top-20 overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold">Order Summary</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {Object.values(items).map((i) => (
                    <tr key={i.productId} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-xs">{i.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {[i.variant, i.size].filter(Boolean).join(" · ")} × {i.quantity}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-sm font-medium">
                        {formatCurrency(i.unitPrice * i.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-sm">Discount ({appliedCode})</span>
                  <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(Math.max(0, total - discountAmount))}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {itemCount} item{itemCount !== 1 ? "s" : ""} in order
              </div>
            </div>
            <div className="p-4 border-t">
              <DiscountCodeInput
                orderValue={total}
                onDiscountApplied={(amount, codeId, code) => {
                  setDiscountAmount(amount);
                  setAppliedCodeId(codeId);
                  setAppliedCode(code);
                  toast.success("Discount code applied!");
                }}
                onDiscountRemoved={() => {
                  setDiscountAmount(0);
                  setAppliedCodeId(null);
                  setAppliedCode(null);
                  toast.info("Discount code removed");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

