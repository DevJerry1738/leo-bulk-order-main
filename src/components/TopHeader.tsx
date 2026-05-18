import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function TopHeader() {
  const { signOut, user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0 select-none">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-rose-500 shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-primary via-rose-500 to-rose-600 bg-clip-text text-transparent uppercase font-sans">
                Leo
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hidden sm:inline">
                Cosmetics
              </span>
            </div>
            <span className="text-[9px] font-medium text-muted-foreground tracking-[0.2em] uppercase leading-none hidden sm:inline">
              Wholesale
            </span>
          </div>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[200px]">
            {user?.email}
          </span>

          {!isAdmin && (
            <Link
              to="/cart"
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              title="View Cart"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 p-0 flex items-center justify-center text-[9px] font-bold rounded-full animate-in zoom-in duration-200"
                >
                  {itemCount}
                </Badge>
              )}
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sign out"
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
