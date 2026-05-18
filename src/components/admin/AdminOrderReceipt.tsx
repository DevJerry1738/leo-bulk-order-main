import { formatCurrency, formatDate } from "@/lib/format";

interface Item {
  id: string;
  product_name: string;
  variant: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderReceiptProps {
  order: {
    order_number: string;
    created_at: string;
    total: number;
    delivery_type: string;
    delivery_address: string | null;
    payment_method: "pickup" | "bank_transfer";
    payment_status: string;
    notes: string | null;
    business_name?: string;
    email?: string;
  };
  items: Item[];
}

export default function AdminOrderReceipt({ order, items }: OrderReceiptProps) {
  return (
    <article className="mx-auto w-full max-w-[320px] rounded-lg border border-black/10 bg-white p-4 text-black shadow-sm">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em]">Leo Cosmetics </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-600">POS Receipt</p>
      </div>

      <div className="my-3 h-px bg-slate-900/10" />

      <div className="space-y-1 text-[11px] uppercase tracking-[0.12em] text-slate-700">
        <div className="flex justify-between"><span>Order</span><span>{order.order_number}</span></div>
        <div className="flex justify-between"><span>Date</span><span>{formatDate(order.created_at)}</span></div>
        <div className="flex justify-between"><span>Payment</span><span className="capitalize">{order.payment_method.replace("_", " ")}</span></div>
        <div className="flex justify-between"><span>Status</span><span>{order.payment_status.replace("_", " ")}</span></div>
        <div className="flex justify-between"><span>Fulfillment</span><span className="capitalize">{order.delivery_type}</span></div>
      </div>

      {(order.business_name || order.email || order.delivery_address || order.notes) && (
        <>
          <div className="my-3 h-px bg-slate-900/10" />
          <div className="space-y-1 text-[11px] text-slate-700">
            {order.business_name && <div><span className="font-semibold text-slate-900">Customer:</span> {order.business_name}</div>}
            {order.email && <div><span className="font-semibold text-slate-900">Email:</span> {order.email}</div>}
            {order.delivery_address && <div><span className="font-semibold text-slate-900">Address:</span> {order.delivery_address}</div>}
            {order.notes && <div><span className="font-semibold text-slate-900">Notes:</span> {order.notes}</div>}
          </div>
        </>
      )}

      <div className="my-3 h-px bg-slate-900/10" />

      <div className="space-y-2 text-[12px]">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex justify-between text-[12px] font-medium">
              <span>{item.product_name}</span>
              <span>{item.quantity}x</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>{[item.variant, item.size].filter(Boolean).join(" · ") || ""}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="my-3 h-px bg-slate-900/10" />

      <div className="space-y-2 text-[12px]">
        <div className="flex justify-between font-semibold uppercase tracking-[0.12em]"><span>Subtotal</span><span>{formatCurrency(items.reduce((sum, item) => sum + item.subtotal, 0))}</span></div>
        <div className="flex justify-between font-semibold uppercase tracking-[0.12em]"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
      </div>

      <div className="my-4 h-px bg-slate-900/10" />

      <p className="text-center text-[10px] uppercase tracking-[0.24em] text-slate-600">Thank you for your purchase!</p>
    </article>
  );
}
