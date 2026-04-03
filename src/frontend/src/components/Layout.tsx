import {
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { AppPage } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import AIAssistantButton from "./AIAssistantButton";

interface Props {
  children: ReactNode;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const NAV_ITEMS: { page: AppPage; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "markets", label: "Markets", icon: TrendingUp },
  { page: "trades", label: "My Trades", icon: LineChart },
  { page: "account", label: "Account", icon: Wallet },
  { page: "leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Layout({ children, currentPage, onNavigate }: Props) {
  const { clear } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    clear();
    onNavigate("landing");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={22} />
          <span className="font-bold text-white text-lg tracking-tight">
            Mtextrading
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
          <button
            type="button"
            key={page}
            data-ocid={`nav.${page}.link`}
            onClick={() => {
              onNavigate(page);
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0e1a] text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#0c1120] border-r border-white/10 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-56 bg-[#0c1120] border-r border-white/10 flex flex-col">
            <SidebarContent />
          </div>
          <button
            type="button"
            aria-label="Close menu"
            className="flex-1 bg-black/50 border-none cursor-default"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} />
            <span className="font-bold">Mtextrading</span>
          </div>
          <button
            type="button"
            data-ocid="nav.mobile_menu.button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
        </div>
        {children}
      </main>

      {/* Floating AI Assistant (bottom-left) */}
      <AIAssistantButton />
    </div>
  );
}
