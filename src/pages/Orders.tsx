import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/error-handler";
import StatusBadge from "@/components/StatusBadge";
import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import OrderTimeline from "@/components/OrderTimeline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  delivery_type: "pickup" | "delivery";
  delivery_address: string | null;
  status: "pending" | "confirmed" | "ready" | "shipped" | "completed";
  payment_method: "pickup" | "bank_transfer";
  payment_status: "pending" | "awaiting_verification" | "paid" | "rejected";
  created_at: string;
  notes: string | null;
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

export default function Orders() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;
  const debouncedSearch = useDebounce(search, 300);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemsMap, setItemsMap] = useState<Record<string, Item[]>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", user?.id, debouncedSearch, page],
    enabled: Boolean(user),
    keepPreviousData: true,
    queryFn: async () => {
      if (!user) return { orders: [], totalCount: 0 };
      let query = supabase
        .from("orders")
        .select("id, order_number, total, delivery_type, delivery_address, status, payment_method, payment_status, created_at, notes", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim();
        query = query.or(`order_number.ilike.%${q}%`);
      }

      query = query.range((page - 1) * pageSize, page * pageSize - 1);
      const { data: ordersData, error: queryError, count } = await query;
      if (queryError) throw queryError;
      return { orders: (ordersData as OrderRow[]) || [], totalCount: count || 0 };
    },
  });

  const orders = data?.orders || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (debouncedSearch) setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (error) toast.error(getErrorMessage(error));
  }, [error]);

  const toggle = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!itemsMap[id]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", id);
      setItemsMap((m) => ({ ...m, [id]: (data as Item[]) || [] }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order History</h1>
          <p className="text-sm text-muted-foreground">Track your orders and their status.</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search order number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-semibold mb-2">No orders yet</p>
          <p className="text-muted-foreground">Start by browsing our products.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Fragment key={o.id}>
              <div
                className="border rounded-lg p-4 bg-card cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => toggle(o.id)}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-semibold text-sm">{o.order_number}</span>
                      <StatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.payment_status} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(o.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">{formatCurrency(Number(o.total))}</div>
                    <div className="text-xs text-muted-foreground capitalize">{o.delivery_type}</div>
                  </div>
                  <div className="text-muted-foreground">
                    {expanded === o.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="border-t pt-3">
                  <OrderTimeline currentStatus={o.status} createdAt={o.created_at} deliveryType={o.delivery_type} />
                </div>
              </div>

              {expanded === o.id && (
                <div className="border rounded-lg bg-muted/20 p-4 animate-in fade-in space-y-4">
                  {/* Order Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {o.delivery_address && (
                      <div>
                        <div className="font-semibold text-xs text-muted-foreground uppercase mb-1">Delivery Address</div>
                        <div className="text-sm">{o.delivery_address}</div>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground uppercase mb-1">Fulfillment</div>
                      <div className="text-sm capitalize">{o.delivery_type === "pickup" ? "Pickup" : "Delivery"}</div>
                    </div>
                  </div>

                  {o.notes && (
                    <div>
                      <div className="font-semibold text-xs text-muted-foreground uppercase mb-1">Notes</div>
                      <div className="text-sm">{o.notes}</div>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="border-t pt-4">
                    <div className="font-semibold text-sm mb-2">Items</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b">
                            <th className="text-left py-2">Product</th>
                            <th className="text-right py-2">Qty</th>
                            <th className="text-right py-2 hidden sm:table-cell">Unit Price</th>
                            <th className="text-right py-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(itemsMap[o.id] || []).map((it) => (
                            <tr key={it.id} className="border-b last:border-0">
                              <td className="py-2">
                                <div className="font-medium">{it.product_name}</div>
                                {(it.variant || it.size) && (
                                  <div className="text-muted-foreground">
                                    {[it.variant, it.size].filter(Boolean).join(" · ")}
                                  </div>
                                )}
                              </td>
                              <td className="text-right tabular-nums py-2">{it.quantity}</td>
                              <td className="text-right tabular-nums py-2 hidden sm:table-cell">{formatCurrency(Number(it.unit_price))}</td>
                              <td className="text-right tabular-nums py-2 font-medium">{formatCurrency(Number(it.subtotal))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3 pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} orders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

