import { Badge } from "@/components/ui/badge";

interface StockBadgeProps {
  stock: number;
  threshold?: number;
}

export default function StockBadge({ stock, threshold = 10 }: StockBadgeProps) {
  if (stock === 0) {
    return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
  }

  if (stock < threshold) {
    return <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-900 border-amber-200">Low Stock</Badge>;
  }

  return <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-900 border-emerald-200">In Stock</Badge>;
}
