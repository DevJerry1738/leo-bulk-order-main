import { NavLink } from "react-router-dom";
import { Package, ClipboardList, Box, Users, BarChart3, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { path: "/", label: "Products", icon: Package, adminOnly: false, end: true },
  { path: "/orders", label: "Orders", icon: ClipboardList, adminOnly: false, end: true },
];

const adminItems = [
  { path: "/admin", label: "Dashboard", icon: BarChart3, adminOnly: true, end: true },
  { path: "/admin/products", label: "Products", icon: Box, adminOnly: true, end: true },
  { path: "/admin/orders", label: "Orders", icon: Users, adminOnly: true, end: true },
  { path: "/admin/pricing", label: "Pricing", icon: Tag, adminOnly: true, end: true },
];

export default function DesktopSidebar() {
  const { isAdmin } = useAuth();
  const { itemCount } = useCart();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group ${
      isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <aside className="w-64 border-r bg-card h-[calc(100vh-56px)] sticky top-14 hidden md:flex flex-col overflow-y-auto">
      <nav className="flex-1 p-3 space-y-1">
        {/* User Navigation */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={linkClass}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div className="my-2 h-px bg-border" />
            <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase">Admin</div>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={linkClass}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
