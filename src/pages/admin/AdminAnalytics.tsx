import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ShoppingCart, Users, DollarSign, TrendingUp, Percent, Truck, ArrowUpRight, Sparkles, Clock } from "lucide-react";

interface TopProduct {
  id: string;
  name: string;
  sku: string | null;
  quantitySold: number;
  revenue: number;
}

interface MonthlySales {
  date: string;
  revenue: number;
  orders: number;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeCustomers: number;
  pendingOrders: number;
  completedOrders: number;
  topProducts: TopProduct[];
  salesTrend: MonthlySales[];
  recentOrders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    business_name?: string;
  }>;
}

const SalesChart = ({ data }: { data: MonthlySales[] }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1000);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingY = 20;

  return (
    <div className="w-full pt-4">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + paddingY + 20}`} className="w-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = chartHeight * (1 - ratio) + paddingY;
          return (
            <g key={idx}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                className="stroke-muted"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.4}
              />
              <text
                x={-8}
                y={y + 3}
                className="text-[9px] font-mono fill-muted-foreground"
                textAnchor="end"
              >
                {ratio === 0 ? "₦0" : formatCurrency(maxRevenue * ratio).replace(".00", "").replace("₦", "₦")}
              </text>
            </g>
          );
        })}

        {data.map((d, idx) => {
          const barWidth = 32;
          const spacing = chartWidth / data.length;
          const x = idx * spacing + (spacing - barWidth) / 2;
          const barHeight = d.revenue > 0 ? (d.revenue / maxRevenue) * chartHeight : 4; 
          const y = chartHeight - barHeight + paddingY;

          return (
            <g key={idx} className="group cursor-pointer">
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect
                  x={x - 24}
                  y={y - 32}
                  width={barWidth + 48}
                  height={26}
                  rx={6}
                  className="fill-popover stroke-border shadow-md"
                  strokeWidth={1}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 15}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-foreground"
                >
                  {formatCurrency(d.revenue).replace(".00", "")}
                </text>
              </g>

              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={5}
                className="fill-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-[2px]"
              />

              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={5}
                className="fill-primary/85 group-hover:fill-primary transition-all duration-300"
              />

              <text
                x={x + barWidth / 2}
                y={chartHeight + paddingY + 16}
                textAnchor="middle"
                className="text-[10px] font-medium fill-muted-foreground"
              >
                {d.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default function AdminAnalytics() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    activeCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    topProducts: [],
    salesTrend: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const { data: allOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, status, created_at, user_id, order_number");

      if (ordersError) throw ordersError;
      const orders = allOrders || [];

      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, subtotal, sku");

      if (itemsError) throw itemsError;
      const itemsList = orderItems || [];

      const productMap: Record<string, { id: string; name: string; sku: string | null; quantitySold: number; revenue: number }> = {};
      itemsList.forEach((item) => {
        const pId = item.product_id || item.product_name;
        if (!pId) return;

        if (!productMap[pId]) {
          productMap[pId] = {
            id: item.product_id || "",
            name: item.product_name,
            sku: item.sku,
            quantitySold: 0,
            revenue: 0,
          };
        }
        productMap[pId].quantitySold += item.quantity;
        productMap[pId].revenue += Number(item.subtotal || 0);
      });

      const topProducts = Object.values(productMap)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);

      const salesMap: Record<string, { date: string; revenue: number; orders: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        salesMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
      }

      orders.forEach((order) => {
        const dateStr = new Date(order.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (salesMap[dateStr]) {
          salesMap[dateStr].revenue += Number(order.total);
          salesMap[dateStr].orders += 1;
        }
      });

      const salesTrend = Object.values(salesMap);

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const activeCustomers = new Set(orders.map((o) => o.user_id).filter(Boolean)).size;

      const pendingOrders = orders.filter((o) => ["pending", "confirmed", "ready"].includes(o.status)).length;
      const completedOrders = orders.filter((o) => o.status === "completed").length;

      const recentOrdersRaw = [...orders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const userIds = Array.from(new Set(recentOrdersRaw.map((o) => o.user_id).filter(Boolean)));
      let profiles: Record<string, { business_name: string }> = {};

      if (userIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, business_name")
          .in("id", userIds);
        profiles = Object.fromEntries((profData || []).map((p) => [p.id, { business_name: p.business_name }]));
      }

      const enrichedOrders = recentOrdersRaw.map((order) => ({
        ...order,
        business_name: order.user_id ? profiles[order.user_id]?.business_name : undefined,
      }));

      setStats({
        totalOrders,
        totalRevenue,
        averageOrderValue,
        activeCustomers,
        pendingOrders,
        completedOrders,
        topProducts,
        salesTrend,
        recentOrders: enrichedOrders,
      });
    } catch (error) {
      console.error("Failed to load analytics stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2 w-32"></div>
                <div className="h-3 bg-muted rounded animate-pulse w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Business Intelligence & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">Comprehensive insights helping you make data-driven decisions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-1.5 bg-green-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time wholesale earnings</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Bulk orders successfully generated</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <Percent className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatCurrency(stats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Mean transaction basket size</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">Wholesale accounts ordering</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Sales Trend (Past 7 Days)
            </CardTitle>
            <CardDescription>Daily gross wholesale revenue progress</CardDescription>
          </CardHeader>
          <CardContent className="h-[210px] flex items-center justify-center">
            {stats.salesTrend.length === 0 ? (
              <div className="text-muted-foreground text-sm">No transaction details found in range</div>
            ) : (
              <SalesChart data={stats.salesTrend} />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Fulfillment Pipeline
            </CardTitle>
            <CardDescription>Real-time order pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Processing
                </span>
                <span>{stats.pendingOrders} orders</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Badge variant="default" className="bg-primary hover:bg-primary p-0.5 rounded-full"><ArrowUpRight className="w-2.5 h-2.5" /></Badge> Completed
                </span>
                <span>{stats.completedOrders} orders</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t text-[11px] text-muted-foreground flex justify-between">
              <span>Pipeline Fulfillment Ratio:</span>
              <span className="font-semibold text-foreground">
                {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Best Sellers (Top Products)
            </CardTitle>
            <CardDescription>Most popular wholesale inventory by volume</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No sales items tracked yet</p>
            ) : (
              <div className="divide-y">
                {stats.topProducts.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold bg-muted w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.sku || "N/A"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{p.quantitySold} sold</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(p.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest client transactions feed</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No orders recorded yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-sm truncate">{order.order_number}</span>
                        <Badge variant={order.status === "completed" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {order.business_name || "Partner"} • {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-sm">{formatCurrency(Number(order.total))}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
