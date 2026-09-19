"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, LogOut, Settings, User, Search, X, ArrowRight, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

const ALL_MODULES = [
  { name: "Trip & Indent Dashboard", path: "/trips", category: "Trips & Operations" },
  { name: "Sales Indents", path: "/trips/sales", category: "Trips & Operations" },
  { name: "Procurement & Sourcing", path: "/trips/procurement", category: "Trips & Operations" },
  { name: "Vehicle Assignment", path: "/trips/assignment", category: "Trips & Operations" },
  { name: "Indent Confirmation", path: "/trips/confirmation", category: "Trips & Operations" },
  { name: "Advance Payment", path: "/trips/advance-payment", category: "Trips & Operations" },
  { name: "POD Confirmation", path: "/trips/pod", category: "Trips & Operations" },
  { name: "Additional Charges", path: "/trips/charges", category: "Trips & Operations" },
  { name: "Live Fleet GPS Tracker", path: "/map", category: "Tracking & Analytics" },
  { name: "Customers Directory", path: "/customers", category: "Directory" },
  { name: "Spot Customers", path: "/customers/spot", category: "Directory" },
  { name: "Contract Customers", path: "/customers/contract", category: "Directory" },
  { name: "Vendor & Fleet Partners", path: "/fleet", category: "Directory" },
  { name: "Vehicles Management", path: "/vehicles", category: "Fleet & Assets" },
  { name: "Own Fleet Vehicles", path: "/vehicles/own", category: "Fleet & Assets" },
  { name: "Vendor Fleet Vehicles", path: "/vehicles/vendor", category: "Fleet & Assets" },
  { name: "Drivers Directory", path: "/drivers", category: "Fleet & Assets" },
  { name: "Own Fleet Drivers", path: "/drivers/own", category: "Fleet & Assets" },
  { name: "Vendor Fleet Drivers", path: "/drivers/vendor", category: "Fleet & Assets" },
  { name: "Customer Invoices", path: "/payments/invoices", category: "Billing & Finance" },
  { name: "Vendor Settlements", path: "/payments/settlements", category: "Billing & Finance" },
  { name: "Payment Ledger", path: "/payments", category: "Billing & Finance" },
  { name: "Manager Approvals", path: "/approvals", category: "Management" },
  { name: "Analytics & Reports", path: "/reports", category: "Tracking & Analytics" },
  { name: "Daily Scheduler & Automation", path: "/automation", category: "System" },
  { name: "Notifications & WhatsApp", path: "/notifications", category: "System" },
  { name: "Team & User Access", path: "/users", category: "Management" },
  { name: "SaaS Administration", path: "/saas-admin", category: "System" },
];

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredModules = ALL_MODULES.filter((m) => {
    if (!globalSearch.trim()) return true;
    const q = globalSearch.toLowerCase().trim();
    return m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.path.toLowerCase().includes(q);
  });

  const handleSelectModule = (path: string) => {
    setSearchOpen(false);
    setGlobalSearch("");
    router.push(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = 'isLoggedIn=; path=/; max-age=0'; // Clear the middleware cookie
    window.location.href = "/login";
  };

  return (
    <div className="h-[62px] sm:h-[75px] lg:h-[86px] shrink-0 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_30px_rgb(0,0,0,0.03)] flex items-center justify-between px-3 sm:px-6 lg:px-8 relative z-30">
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95 shrink-0 border border-slate-200/80 shadow-2xs"
            aria-label="Open navigation menu"
            title="Menu"
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
        )}
        <div className="flex flex-col min-w-0">
          <div className="font-bold text-[15px] sm:text-[18px] text-slate-800 leading-tight truncate">
            Welcome back, {user?.name || "Admin"} 👋
          </div>
          <div className="font-medium text-[11px] sm:text-[12.5px] text-slate-500 mt-0.5 tracking-wide hidden sm:block">
            Overview across all active trips
          </div>
        </div>
      </div>

      {/* Global Quick Search Bar (Desktop Trigger) */}
      <div className="relative hidden md:block">
        <div 
          onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
          className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-150 border border-slate-200/90 rounded-full px-4 py-2 w-72 lg:w-96 text-slate-400 hover:text-slate-600 cursor-pointer transition-all shadow-xs"
        >
          <Search size={16} className="text-slate-400 shrink-0" />
          <span className="text-xs font-medium truncate flex-1">Quick search screens, trips, customers...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">Ctrl K</kbd>
        </div>
      </div>

      {/* Global Search Dropdown (Mobile & Desktop) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[500px] z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3">
              <Search size={18} className="text-blue-600 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Jump to any module or screen..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400"
              />
              {globalSearch && (
                <button onClick={() => setGlobalSearch("")} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={16} />
                </button>
              )}
              <button onClick={() => setSearchOpen(false)} className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100">
                ESC
              </button>
            </div>

            <div className="overflow-y-auto p-2 divide-y divide-slate-50 touch-scroll">
              {filteredModules.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No screens matching "{globalSearch}"
                </div>
              ) : (
                filteredModules.map((m) => (
                  <button
                    key={m.path}
                    onClick={() => handleSelectModule(m.path)}
                    className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-blue-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-600">{m.name}</div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-slate-400">{m.category} • <span className="font-mono">{m.path}</span></div>
                    </div>
                    <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Quick Search Icon */}
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/80 shadow-2xs"
          aria-label="Search modules"
          title="Search"
        >
          <Search size={17} />
        </button>

        <button className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors relative border border-transparent hover:border-slate-200/60">
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute top-[8px] sm:top-[10px] right-[8px] sm:right-[10px] w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 sm:gap-3 hover:bg-slate-50 p-1 sm:p-1.5 sm:pr-4 rounded-full transition-all duration-200 border border-transparent hover:border-slate-200/80 hover:shadow-sm"
          >
            <div className="w-[34px] h-[34px] bg-[#1E3A8A] text-white rounded-full flex items-center justify-center font-bold text-[14px] shadow-inner">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'PV'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[13px] font-semibold text-slate-700 leading-none">{user?.name || "Admin"}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-none">{user?.role || "Tenant Admin"}</div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-[110%] w-[200px] bg-white border border-line rounded-[8px] shadow-lg overflow-hidden flex flex-col font-body z-50">
              <div className="px-4 py-3 border-b border-line bg-slate-50">
                <p className="text-[13px] font-bold text-ink">{user?.name || "Admin User"}</p>
                <p className="text-[11px] text-muted-text truncate">{user?.email || "admin@example.com"}</p>
                <div className="mt-1 inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded">
                  {user?.role || "Tenant Admin"}
                </div>
              </div>
              <button 
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium text-ink hover:bg-slate-50 transition-colors w-full text-left"
              >
                <User size={14} className="text-muted-text" /> My Profile
              </button>
              <button 
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium text-ink hover:bg-slate-50 transition-colors w-full text-left border-b border-line"
              >
                <Settings size={14} className="text-muted-text" /> Settings
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium text-alert hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
