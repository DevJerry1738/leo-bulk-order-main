import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { Trash2 } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  variant: string | null;
  size: string | null;
  sku: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
}

interface CartSummaryPanelProps {
  items: Record<string, CartItem>;
  total: number;
  itemCount: number;
  onCheckout: () => void;
}

export default function CartSummaryPanel({ items, total, itemCount, onCheckout }: CartSummaryPanelProps) {
  const { removeItem, clear } = useCart();
  const list = Object.values(items);
  const navigate = useNavigate();

  if (list.length === 0) {
    return (
      <aside className="hidden lg:block w-80 border-l bg-card/50 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
        <div className="p-6 space-y-4 flex flex-col h-full">
          <div>
            <h2 className="font-semibold">Cart Summary</h2>
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
          </div>
          <div className="flex-1" />
          <div className="space-y-2">
            <div className="p-3 bg-muted/30 rounded-lg text-center text-sm">
              Add products to get started
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:block w-80 border-l bg-card/50 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
      <div className="p-6 space-y-4 flex flex-col h-full">
        <div className="flex justify-between items-center pb-2 border-b">
          <div>
            <h2 className="font-semibold">Cart Summary</h2>
            <p className="text-xs text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>
          <Button
            variant="ghost"
            onClick={clear}
            size="sm"
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20 font-medium px-2.5 h-8 gap-1.5"
          >
            Clear Cart
          </Button>
        </div>

        {/* Items Preview */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {list.slice(0, 10).map((item) => (
            <div
              key={item.productId}
              className="group/item text-xs py-2.5 border-b last:border-b-0 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-foreground group-hover/item:text-primary transition-colors">
                  {item.name}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {item.quantity}x · {formatCurrency(item.unitPrice)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 p-1 rounded transition-all opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                  title="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {list.length > 10 && (
            <div className="text-xs text-muted-foreground py-2 text-center">
              +{list.length - 10} more item{list.length - 10 !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-sm">Subtotal</span>
            <span className="font-semibold text-base">{formatCurrency(total)}</span>
          </div>
          <div className="space-y-2">
            <Button onClick={() => navigate("/cart")} variant="outline" className="w-full">
              View Cart
            </Button>
            <Button onClick={onCheckout} className="w-full">
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
