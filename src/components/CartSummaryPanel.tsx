import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useNavigate } from "react-router-dom";

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
        <div>
          <h2 className="font-semibold">Cart Summary</h2>
          <p className="text-sm text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
        </div>

        {/* Items Preview */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {list.slice(0, 5).map((item) => (
            <div key={item.productId} className="text-xs space-y-1 pb-2 border-b last:border-b-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-muted-foreground flex justify-between">
                <span>{item.quantity}x</span>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            </div>
          ))}
          {list.length > 5 && (
            <div className="text-xs text-muted-foreground py-2 text-center">
              +{list.length - 5} more item{list.length - 5 !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex justify-between">
            <span className="text-sm">Subtotal</span>
            <span className="font-semibold">{formatCurrency(total)}</span>
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
