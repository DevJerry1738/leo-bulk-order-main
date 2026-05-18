import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Flame, Plus, Sparkles, ShoppingCart } from "lucide-react";
import StockBadge from "@/components/StockBadge";

export default function Trends() {
  const { items, setQuantity } = useCart();

  // Query to fetch the top 3 best-selling products dynamically based on order volume
  const { data: trendingProducts, isLoading } = useQuery({
    queryKey: ["trends-best-sellers"],
    queryFn: async () => {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, quantity, product_name, subtotal");

      let sortedTops: Array<{ product_id: string; quantity: number }> = [];

      if (orderItems && orderItems.length > 0) {
        const itemMap: Record<string, { product_id: string; quantity: number }> = {};
        orderItems.forEach((item) => {
          if (!item.product_id) return;
          if (!itemMap[item.product_id]) {
            itemMap[item.product_id] = {
              product_id: item.product_id,
              quantity: 0,
            };
          }
          itemMap[item.product_id].quantity += item.quantity;
        });

        sortedTops = Object.values(itemMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 6); // fetch up to 6 trending items for a separate page
      }

      let finalProducts: any[] = [];
      if (sortedTops.length > 0) {
        const topIds = sortedTops.map((t) => t.product_id);
        const { data: prods } = await supabase
          .from("products")
          .select("id, name, variant, size, price, stock, sku")
          .in("id", topIds)
          .eq("is_active", true);

        if (prods) {
          sortedTops.forEach((top, idx) => {
            const found = prods.find((p) => p.id === top.product_id);
            if (found) {
              finalProducts.push({
                ...found,
                rank: idx + 1,
                totalSold: top.quantity,
                isTrending: true,
              });
            }
          });
        }
      }

      // Fallback if no orders are placed yet: grab first 6 active items
      if (finalProducts.length === 0) {
        const { data: fallbackProds } = await supabase
          .from("products")
          .select("id, name, variant, size, price, stock, sku")
          .eq("is_active", true)
          .limit(6);

        if (fallbackProds) {
          finalProducts = fallbackProds.map((p, idx) => ({
            ...p,
            rank: idx + 1,
            totalSold: 0,
            isTrending: false,
          }));
        }
      }

      return finalProducts;
    },
  });

  const handleQuickAdd = (p: any) => {
    const currentQty = items[p.id]?.quantity ?? 0;
    if (p.stock <= currentQty) {
      toast.error(`Cannot add more. Only ${p.stock} items in stock.`);
      return;
    }
    const newQty = currentQty + 1;
    setQuantity(
      p.id,
      {
        productId: p.id,
        name: p.name,
        variant: p.variant,
        size: p.size,
        sku: p.sku,
        unitPrice: Number(p.price),
        stock: p.stock,
      },
      newQty,
    );
    toast.success(`Added ${p.name} to cart!`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-xl p-4 space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
              <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
              <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
              <div className="h-10 bg-muted rounded animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-500 fill-red-500 animate-pulse" />
            Market Trends & Best Sellers
          </h1>
          <p className="text-sm text-muted-foreground">
            The most popular products and trending inventory in the wholesale network.
          </p>
        </div>
      </div>

      {/* Grid of Trending items */}
      {trendingProducts && trendingProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingProducts.map((p) => {
            const rankStyles = [
              "bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-sm border-amber-400", // Rank 1: Gold
              "bg-gradient-to-r from-slate-400 to-slate-300 text-white shadow-sm border-slate-300", // Rank 2: Silver
              "bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-sm border-amber-600", // Rank 3: Bronze
            ];

            const currentQty = items[p.id]?.quantity ?? 0;

            return (
              <div
                key={p.id}
                className="relative group border rounded-xl p-5 bg-card hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Rank Badge */}
                <div className="absolute top-0 right-0 flex items-center justify-center">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-bl-xl border-l border-b ${
                      rankStyles[p.rank - 1] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    #{p.rank} {p.isTrending ? "Best Seller" : "Featured"}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-xs text-muted-foreground font-mono truncate max-w-[70%]">
                    {p.sku || "N/A"}
                  </div>
                  <h3 className="font-bold text-base tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
                    {p.name}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {[p.variant, p.size].filter(Boolean).join(" · ") || "Standard Option"}
                  </div>

                  <div className="pt-2">
                    <StockBadge stock={p.stock} />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-muted/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Unit Price
                    </span>
                    <span className="font-bold text-base text-foreground">
                      {formatCurrency(Number(p.price))}
                    </span>
                  </div>

                  {p.stock === 0 ? (
                    <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                      Out of Stock
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleQuickAdd(p)}
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground border-primary/20 text-primary transition-all duration-200"
                    >
                      <Plus className="h-3.5 w-3.5" /> Quick Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-xl p-8 text-center text-muted-foreground bg-card">
          No trends available yet. Check back soon!
        </div>
      )}
    </div>
  );
}
