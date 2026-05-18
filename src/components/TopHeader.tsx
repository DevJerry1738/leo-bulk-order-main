import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function TopHeader() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg flex-shrink-0">
          <span className="text-primary">Leo</span>
          <span className="text-muted-foreground font-normal text-sm hidden sm:inline">Wholesale</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[200px]">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
