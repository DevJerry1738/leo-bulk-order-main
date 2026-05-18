import { NavLink } from "react-router-dom";
import { Package, ShoppingCart, ClipboardList, BarChart3, Box, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";

const userNavItems = [
  { path: "/", label: "Products", icon: Package, end: true },
  { path: "/cart", label: "Cart", icon: ShoppingCart, badge: true, end: true },
  { path: "/orders", label: "Orders", icon: ClipboardList, end: true },
];

const adminNavItems = [
  { path: "/", label: "Products", icon: Package, end: true },
  { path: "/cart", label: "Cart", icon: ShoppingCart, badge: true, end: true },
  { path: "/admin", label: "Admin", icon: BarChart3, end: true },
  { path: "/admin/pricing", label: "Pricing", icon: Tag, end: true },
];

export default function MobileBottomNav() {
  const { isAdmin } = useAuth();
  const { itemCount } = useCart();

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs font-medium transition-colors relative ${
      isActive ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-card md:hidden z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={linkClass}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && itemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {itemCount > 99 ? "99+" : itemCount}
                  </Badge>
                )}
              </div>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
