import { Outlet } from "react-router-dom";
import TopHeader from "@/components/TopHeader";
import DesktopSidebar from "@/components/DesktopSidebar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopHeader />
      
      <div className="flex flex-1">
        <DesktopSidebar />
        
        <main className="flex-1 overflow-y-auto md:px-6 md:py-6 px-4 py-6 mb-20 md:mb-0">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      <MobileBottomNav />
    </div>
  );
}
