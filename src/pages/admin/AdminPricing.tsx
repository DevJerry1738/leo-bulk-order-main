import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2 } from "lucide-react";

export default function AdminPricing() {
  const queryClient = useQueryClient();
  const [newTierDialog, setNewTierDialog] = useState(false);
  const [newCodeDialog, setNewCodeDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [tierData, setTierData] = useState({
    minQty: "",
    maxQty: "",
    price: "",
    discount: "",
  });
  const [codeData, setCodeData] = useState({
    code: "",
    type: "percentage",
    value: "",
    minOrder: "",
    maxUses: "",
    startDate: "",
    endDate: "",
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,price")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  // Fetch pricing tiers
  const { data: tiers } = useQuery({
    queryKey: ["pricing_tiers", selectedProductId],
    enabled: !!selectedProductId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pricing_tiers")
        .select("*")
        .eq("product_id", selectedProductId)
        .order("min_quantity");
      return data || [];
    },
  });

  // Fetch discount codes
  const { data: discountCodes } = useQuery({
    queryKey: ["discount_codes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Create pricing tier
  const createTierMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId || !tierData.minQty || !tierData.price) {
        throw new Error("Please fill in required fields");
      }

      const { error } = await supabase.from("pricing_tiers").insert({
        product_id: selectedProductId,
        min_quantity: parseInt(tierData.minQty),
        max_quantity: tierData.maxQty ? parseInt(tierData.maxQty) : null,
        price_override: tierData.price ? parseFloat(tierData.price) : null,
        discount_percentage: tierData.discount ? parseFloat(tierData.discount) : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing_tiers"] });
      setTierData({ minQty: "", maxQty: "", price: "", discount: "" });
      setNewTierDialog(false);
      toast.success("Pricing tier created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create pricing tier");
    },
  });

  // Create discount code
  const createCodeMutation = useMutation({
    mutationFn: async () => {
      if (!codeData.code || !codeData.value) {
        throw new Error("Please fill in required fields");
      }

      const { error } = await supabase.from("discount_codes").insert({
        code: codeData.code.toUpperCase(),
        discount_type: codeData.type,
        discount_value: parseFloat(codeData.value),
        min_order_value: codeData.minOrder ? parseFloat(codeData.minOrder) : null,
        max_uses: codeData.maxUses ? parseInt(codeData.maxUses) : null,
        start_date: codeData.startDate || null,
        end_date: codeData.endDate || null,
        created_by: (await supabase.auth.getUser()).data.user?.id || "",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount_codes"] });
      setCodeData({
        code: "",
        type: "percentage",
        value: "",
        minOrder: "",
        maxUses: "",
        startDate: "",
        endDate: "",
      });
      setNewCodeDialog(false);
      toast.success("Discount code created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create discount code");
    },
  });

  // Delete tier
  const deleteTierMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const { error } = await supabase
        .from("pricing_tiers")
        .delete()
        .eq("id", tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing_tiers"] });
      toast.success("Pricing tier deleted");
    },
  });

  // Delete code
  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", codeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount_codes"] });
      toast.success("Discount code deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pricing Management</h1>
        <p className="text-muted-foreground">Configure bulk pricing tiers and discount codes</p>
      </div>

      <Tabs defaultValue="tiers" className="w-full">
        <TabsList>
          <TabsTrigger value="tiers">Bulk Pricing Tiers</TabsTrigger>
          <TabsTrigger value="discounts">Discount Codes</TabsTrigger>
        </TabsList>

        {/* Pricing Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-select">Select Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product-select">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProductId && (
                <Dialog open={newTierDialog} onOpenChange={setNewTierDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pricing Tier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Pricing Tier</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="min-qty">Minimum Quantity *</Label>
                        <Input
                          id="min-qty"
                          type="number"
                          placeholder="e.g., 10"
                          value={tierData.minQty}
                          onChange={(e) =>
                            setTierData({ ...tierData, minQty: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-qty">Maximum Quantity (optional)</Label>
                        <Input
                          id="max-qty"
                          type="number"
                          placeholder="Leave empty for unlimited"
                          value={tierData.maxQty}
                          onChange={(e) =>
                            setTierData({ ...tierData, maxQty: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Price Override (optional)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="Leave empty to use discount percentage"
                          value={tierData.price}
                          onChange={(e) =>
                            setTierData({ ...tierData, price: e.target.value })
                          }
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount">Discount Percentage (optional)</Label>
                        <Input
                          id="discount"
                          type="number"
                          placeholder="e.g., 10 for 10%"
                          value={tierData.discount}
                          onChange={(e) =>
                            setTierData({ ...tierData, discount: e.target.value })
                          }
                          step="0.01"
                        />
                      </div>
                      <Button
                        onClick={() => createTierMutation.mutate()}
                        disabled={createTierMutation.isPending}
                        className="w-full"
                      >
                        Create Tier
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </Card>

          {selectedProductId && tiers && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Quantity Range</th>
                      <th className="px-4 py-2 text-left">Price/Discount</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">
                          No pricing tiers yet
                        </td>
                      </tr>
                    ) : (
                      tiers.map((tier: any) => (
                        <tr key={tier.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-2">
                            {tier.min_quantity}
                            {tier.max_quantity ? `–${tier.max_quantity}` : "+"} units
                          </td>
                          <td className="px-4 py-2">
                            {tier.price_override
                              ? formatCurrency(tier.price_override)
                              : tier.discount_percentage
                              ? `${tier.discount_percentage}% off`
                              : "—"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTierMutation.mutate(tier.id)}
                              disabled={deleteTierMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Discount Codes Tab */}
        <TabsContent value="discounts" className="space-y-4">
          <Dialog open={newCodeDialog} onOpenChange={setNewCodeDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Discount Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Discount Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., SUMMER20"
                    value={codeData.code}
                    onChange={(e) =>
                      setCodeData({ ...codeData, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={codeData.type} onValueChange={(v) =>
                      setCodeData({ ...codeData, type: v })
                    }>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Value *</Label>
                    <Input
                      id="value"
                      type="number"
                      placeholder="e.g., 20"
                      value={codeData.value}
                      onChange={(e) =>
                        setCodeData({ ...codeData, value: e.target.value })
                      }
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="minOrder">Min Order Value</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    placeholder="Optional"
                    value={codeData.minOrder}
                    onChange={(e) =>
                      setCodeData({ ...codeData, minOrder: e.target.value })
                    }
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Optional"
                    value={codeData.maxUses}
                    onChange={(e) =>
                      setCodeData({ ...codeData, maxUses: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={codeData.startDate}
                      onChange={(e) =>
                        setCodeData({ ...codeData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={codeData.endDate}
                      onChange={(e) =>
                        setCodeData({ ...codeData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createCodeMutation.mutate()}
                  disabled={createCodeMutation.isPending}
                  className="w-full"
                >
                  Create Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {discountCodes && (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-left">Discount</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Uses</th>
                      <th className="px-4 py-2 text-left">Valid Until</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                          No discount codes yet
                        </td>
                      </tr>
                    ) : (
                      discountCodes.map((code: any) => (
                        <tr key={code.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-2 font-mono font-semibold">{code.code}</td>
                          <td className="px-4 py-2">
                            {code.discount_type === "percentage"
                              ? `${code.discount_value}%`
                              : formatCurrency(code.discount_value)}
                          </td>
                          <td className="px-4 py-2">
                            {code.is_active ? (
                              <span className="text-green-600 font-medium">Active</span>
                            ) : (
                              <span className="text-gray-500">Inactive</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {code.current_uses}/{code.max_uses || "∞"}
                          </td>
                          <td className="px-4 py-2">
                            {code.end_date
                              ? new Date(code.end_date).toLocaleDateString()
                              : "∞"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCodeMutation.mutate(code.id)}
                              disabled={deleteCodeMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
