import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const { items, setQuantity, removeItem, clear, total, itemCount } = useCart();
  const list = Object.values(items);
  const navigate = useNavigate();

  if (list.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="flex justify-center mb-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-50" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add products from the catalog to get started.</p>
        </div>
        <Button onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear} className="text-destructive hover:text-destructive">
          Clear all
        </Button>
      </div>

      {/* Cart Items Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium text-right hidden sm:table-cell">Price</th>
                <th className="px-3 py-2 font-medium text-center">Qty</th>
                <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((it) => (
                <tr key={it.productId} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[it.variant, it.size, it.sku].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium hidden sm:table-cell">{formatCurrency(it.unitPrice)}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      max={it.stock}
                      value={it.quantity}
                      onChange={(e) =>
                        setQuantity(it.productId, it, Math.max(1, Math.min(it.stock, parseInt(e.target.value || "1", 10))))
                      }
                      className="h-8 w-20 text-center text-xs text-right tabular-nums mx-auto"
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatCurrency(it.unitPrice * it.quantity)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItem(it.productId)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cart Summary & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2">
          <Button onClick={() => navigate("/")} variant="outline" className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </Button>
        </div>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Subtotal</div>
              <div className="text-2xl font-bold">{formatCurrency(total)}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""} in your cart
            </div>
            <Button onClick={() => navigate("/checkout")} className="hidden md:block w-full">
              Proceed to checkout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 flex justify-center pointer-events-none">
        <Button onClick={() => navigate("/checkout")} className="w-full max-w-md gap-2 pointer-events-auto">
          Checkout
        </Button>
      </div>
    </div>
  );
}

