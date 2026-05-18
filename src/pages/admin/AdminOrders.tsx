import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/error-handler";
import AdminOrderReceipt from "@/components/admin/AdminOrderReceipt";
import StatusBadge from "@/components/StatusBadge";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["pending", "confirmed", "ready", "shipped", "completed"] as const;
type Status = typeof STATUSES[number];

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  total: number;
  delivery_type: "pickup" | "delivery";
  delivery_address: string | null;
  status: Status;
  payment_method: "pickup" | "bank_transfer";
  payment_status: "pending" | "awaiting_verification" | "paid" | "rejected";
  receipt_url: string | null;
  payment_verified_by: string | null;
  payment_verified_at: string | null;
  notes: string | null;
  created_at: string;
  business_name?: string;
  email?: string;
  phone?: string | null;
}

interface Item {
  id: string;
  product_name: string;
  variant: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemsMap, setItemsMap] = useState<Record<string, Item[]>>({});
  const [receiptLinks, setReceiptLinks] = useState<Record<string, string>>({});
  const [printOrder, setPrintOrder] = useState<OrderRow | null>(null);
  const [printItems, setPrintItems] = useState<Item[]>([]);

  const loadReceiptLink = async (order: OrderRow) => {
    if (!order.receipt_url || receiptLinks[order.id]) return;
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(order.receipt_url, 3600); // 1 hour expiry
      if (error) throw error;
      setReceiptLinks((prev) => ({ ...prev, [order.id]: data.signedUrl }));
    } catch (error) {
      console.error("Failed to generate receipt signed URL:", error);
      toast.error("Unable to load receipt link");
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, order_number, user_id, total, delivery_type, delivery_address, status, payment_method, payment_status, receipt_url, payment_verified_by, payment_verified_at, notes, created_at")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const userIds = Array.from(new Set((ordersData || []).map((o) => o.user_id).filter(Boolean))) as string[];
      let profMap: Record<string, { business_name: string; email: string; phone: string | null }> = {};
      if (userIds.length) {
        const { data: profs, error: profileError } = await supabase
          .from("profiles")
          .select("id,business_name,email,contact_phone")
          .in("id", userIds);
        if (profileError) throw profileError;
        profMap = Object.fromEntries((profs || []).map((p: any) => [p.id, { business_name: p.business_name, email: p.email, phone: p.contact_phone }]));
      }
      const enriched = (ordersData || []).map((o) => ({
        ...o,
        business_name: o.user_id ? profMap[o.user_id]?.business_name : undefined,
        email: o.user_id ? profMap[o.user_id]?.email : undefined,
        phone: o.user_id ? profMap[o.user_id]?.phone : undefined,
      })) as OrderRow[];
      setOrders(enriched);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(getErrorMessage(error)); return; }
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success("Status updated");
  };

  const approvePayment = async (id: string) => {
    try {
      const userRes = await supabase.auth.getUser();
      const adminId = userRes.data.user?.id ?? null;
      const verifiedAt = new Date().toISOString();
      const { error } = await supabase.from("orders").update({
        payment_status: 'paid',
        payment_verified_by: adminId,
        payment_verified_at: verifiedAt,
      }).eq("id", id);

      if (error) { throw error; }
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, payment_status: 'paid', payment_verified_by: adminId, payment_verified_at: verifiedAt } : o)));
      toast.success("Payment approved");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const rejectPayment = async (id: string) => {
    try {
      const userRes = await supabase.auth.getUser();
      const adminId = userRes.data.user?.id ?? null;
      const verifiedAt = new Date().toISOString();
      const { error } = await supabase.from("orders").update({
        payment_status: 'rejected',
        payment_verified_by: adminId,
        payment_verified_at: verifiedAt,
      }).eq("id", id);

      if (error) { throw error; }
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, payment_status: 'rejected', payment_verified_by: adminId, payment_verified_at: verifiedAt } : o)));
      toast.success("Payment rejected");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePrintReceipt = async (order: OrderRow) => {
    try {
      let items = itemsMap[order.id];
      if (!items) {
        const { data, error } = await supabase.from("order_items").select("*").eq("order_id", order.id);
        if (error) throw error;
        items = (data as Item[]) || [];
        setItemsMap((m) => ({ ...m, [order.id]: items }));
      }
      setPrintOrder(order);
      setPrintItems(items);
      setTimeout(() => window.print(), 100);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggle = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const order = orders.find((o) => o.id === id);
    if (order) {
      await loadReceiptLink(order);
    }
    if (!itemsMap[id]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", id);
      setItemsMap((m) => ({ ...m, [id]: (data as Item[]) || [] }));
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">All Orders</h1>
          <p className="text-sm text-muted-foreground">Manage and update order status.</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="w-8"></th>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Payment</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">No orders.</td></tr>
            ) : (
              filtered.map((o) => (
                <Fragment key={o.id}>
                  <tr className="border-b hover:bg-muted/30">
                    <td className="px-2 cursor-pointer" onClick={() => toggle(o.id)}>
                      {expanded === o.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-3 py-2 font-mono font-medium cursor-pointer" onClick={() => toggle(o.id)}>{o.order_number}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{o.business_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{o.email}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(o.created_at)}</td>
                    <td className="px-3 py-2 capitalize">{o.delivery_type}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs">
                        <div className="capitalize">{o.payment_method.replace('_', ' ')}</div>
                        <div className={`text-xs ${o.payment_status === 'paid' ? 'text-green-600' : o.payment_status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>
                          {o.payment_status.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(Number(o.total))}</td>
                    <td className="px-3 py-2">
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as Status)}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              <StatusBadge status={s} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="bg-muted/20 border-b">
                      <td colSpan={8} className="px-6 py-3">
                        {o.delivery_address && <p className="text-xs mb-2"><strong>Address:</strong> {o.delivery_address}</p>}
                        {o.notes && <p className="text-xs mb-2"><strong>Notes:</strong> {o.notes}</p>}
                        {receiptLinks[o.id] && (
                          <p className="text-xs mb-2">
                            <strong>Receipt:</strong> <a href={receiptLinks[o.id]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Receipt</a>
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2 items-center">
                          <Button size="sm" onClick={() => handlePrintReceipt(o)}>Print Receipt</Button>
                          <WhatsAppButton 
                            phone={o.phone} 
                            orderData={{
                              order_number: o.order_number,
                              business_name: o.business_name,
                              payment_status: o.payment_status,
                              delivery_type: o.delivery_type,
                            }}
                          />
                          {o.payment_method === 'bank_transfer' && o.payment_status === 'awaiting_verification' && (
                            <>
                              <Button size="sm" onClick={() => approvePayment(o.id)} className="bg-green-600 hover:bg-green-700">Approve Payment</Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectPayment(o.id)}>Reject Payment</Button>
                            </>
                          )}
                        </div>
                        <table className="w-full text-xs">
                          <thead><tr className="text-muted-foreground">
                            <th className="text-left py-1">Item</th>
                            <th className="text-right py-1">Qty</th>
                            <th className="text-right py-1">Unit</th>
                            <th className="text-right py-1">Subtotal</th>
                          </tr></thead>
                          <tbody>
                            {(itemsMap[o.id] || []).map((it) => (
                              <tr key={it.id}>
                                <td className="py-1">{it.product_name} <span className="text-muted-foreground">{[it.variant, it.size].filter(Boolean).join(" · ")}</span></td>
                                <td className="text-right tabular-nums">{it.quantity}</td>
                                <td className="text-right tabular-nums">{formatCurrency(Number(it.unit_price))}</td>
                                <td className="text-right tabular-nums">{formatCurrency(Number(it.subtotal))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
      <div className="print-only">
        {printOrder && <AdminOrderReceipt order={printOrder} items={printItems} />}
      </div>
    </>
  );
}
