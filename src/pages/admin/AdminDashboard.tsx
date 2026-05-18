import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, DollarSign, TrendingUp, ArrowUpRight, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    business_name?: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Get ALL orders for total aggregates
      const { data: allOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, status, created_at, user_id, order_number");

      if (ordersError) throw ordersError;
      const orders = allOrders || [];

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const pendingOrders = orders.filter((o) => ["pending", "confirmed", "ready"].includes(o.status)).length;
      const completedOrders = orders.filter((o) => o.status === "completed").length;

      // 2. Fetch recent 8 orders
      const recentOrdersRaw = [...orders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8);

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
        pendingOrders,
        completedOrders,
        recentOrders: enrichedOrders,
      });
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">General administrative dashboard and recent activities</p>
        </div>
        <Link to="/admin/analytics">
          <Button className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Detailed Analytics
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time bulk orders generated</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gross wholesale earnings</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders in fulfillment pipeline</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered successfully</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity Feed</CardTitle>
          <CardDescription>Latest order updates from wholesale accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders recorded yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/10 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm truncate">{order.order_number}</span>
                      <Badge
                        variant={order.status === "completed" ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.business_name || "Partner"} • {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatCurrency(Number(order.total))}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}