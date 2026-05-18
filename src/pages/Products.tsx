import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/error-handler";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import CartSummaryPanel from "@/components/CartSummaryPanel";
import StockBadge from "@/components/StockBadge";
import BulkPricingDisplay from "@/components/BulkPricingDisplay";

interface Product {
  id: string;
  name: string;
  variant: string | null;
  size: string | null;
  sku: string | null;
  price: number;
  stock: number;
  hasPricingTiers?: boolean;
}

export default function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const pageSize = 20;
  const { items, setQuantity, total, itemCount } = useCart();
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", debouncedSearch, page],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id,name,variant,size,sku,price,stock", { count: "exact" })
        .eq("is_active", true);

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim();
        query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,variant.ilike.%${q}%,size.ilike.%${q}%`);
      }

      query = query.order("name").range((page - 1) * pageSize, page * pageSize - 1);

      const { data: productsData, error, count } = await query;
      if (error) throw error;

      const products = (productsData as Product[]) || [];
      const productIds = products.map((p) => p.id);

      if (productIds.length > 0) {
        const { data: tiersData } = await supabase
          .from("pricing_tiers" as any)
          .select("product_id")
          .in("product_id", productIds);

        const activeTiersSet = new Set(tiersData?.map((t: any) => t.product_id) || []);
        products.forEach((p) => {
          p.hasPricingTiers = activeTiersSet.has(p.id);
        });
      }

      return { products, totalCount: count || 0 };
    },
  });

  const products = data?.products || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error));
  }, [error]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const onQty = (p: Product, raw: string) => {
    const qty = Math.max(0, Math.min(p.stock, parseInt(raw || "0", 10) || 0));
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
      qty,
    );
  };

  const handleCheckout = () => {
    if (itemCount === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-4 min-w-0">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-muted-foreground">Browse and add items to your cart.</p>
          </div>
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="border rounded-lg overflow-hidden bg-card order-table">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b sticky top-0">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium hidden sm:table-cell">Variant</th>
                  <th className="px-3 py-2 font-medium hidden md:table-cell">Size</th>
                  <th className="px-3 py-2 font-medium hidden lg:table-cell">SKU</th>
                  <th className="px-3 py-2 font-medium text-right">Price</th>
                  <th className="px-3 py-2 font-medium text-center">Stock</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No products found.</td></tr>
                ) : (
                  products.map((p) => {
                    const qty = items[p.id]?.quantity ?? 0;
                    const isExpanded = expandedProductId === p.id && p.hasPricingTiers;
                    return [
                      <tr key={`row-${p.id}`} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          {p.hasPricingTiers ? (
                            <button
                              onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                              className="inline-flex items-center gap-1 font-medium text-left hover:text-primary transition-colors"
                            >
                              <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              {p.name}
                            </button>
                          ) : (
                            <span className="font-medium text-foreground pl-5 inline-block">
                              {p.name}
                            </span>
                          )}
                          <div className="text-xs text-muted-foreground sm:hidden pl-5">
                            {[p.variant, p.size, p.sku].filter(Boolean).join(" · ")}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{p.variant || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{p.size || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground font-mono text-xs hidden lg:table-cell">{p.sku || "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(Number(p.price))}</td>
                        <td className="px-3 py-2 text-center">
                          <StockBadge stock={p.stock} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Input
                            type="number"
                            min={0}
                            max={p.stock}
                            value={qty || ""}
                            onChange={(e) => onQty(p, e.target.value)}
                            disabled={p.stock === 0}
                            placeholder="0"
                            className="h-8 w-16 ml-auto text-right text-xs"
                          />
                        </td>
                      </tr>,
                      isExpanded && (
                        <tr key={`expand-${p.id}`} className="bg-muted/20 border-b">
                          <td colSpan={7} className="px-3 py-4">
                            <BulkPricingDisplay
                              productId={p.id}
                              basePrice={Number(p.price)}
                              currentQuantity={qty}
                            />
                          </td>
                        </tr>
                      ),
                    ].filter(Boolean);
                  }).flat()
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Cart Summary (Desktop Only) */}
      <CartSummaryPanel 
        items={items} 
        total={total} 
        itemCount={itemCount} 
        onCheckout={handleCheckout}
      />

      {/* Mobile Floating Action Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 lg:hidden p-4 flex justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 pointer-events-auto">
            <div className="text-sm">
              <div className="font-medium">{itemCount} item{itemCount !== 1 ? "s" : ""}</div>
              <div className="opacity-90 tabular-nums text-xs">{formatCurrency(total)}</div>
            </div>
            <Button variant="secondary" onClick={handleCheckout} className="gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" /> Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

