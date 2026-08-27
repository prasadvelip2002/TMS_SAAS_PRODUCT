"use client";

import { useState, useEffect } from "react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = 'isLoggedIn=; path=/; max-age=0'; // Clear the middleware cookie
    window.location.href = "/login";
  };

  return (
    <div className="h-[90px] shrink-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_30px_rgb(0,0,0,0.03)] flex items-center justify-between px-10 relative z-50">
      <div className="flex flex-col">
        <div className="font-bold text-[18px] text-slate-800 leading-tight">Welcome back, {user?.name || "Admin"} 👋</div>
        <div className="font-medium text-[12.5px] text-slate-500 mt-0.5 tracking-wide">Overview across all active trips</div>
      </div>
      <div className="flex items-center gap-6">
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors relative border border-transparent hover:border-slate-200/60">
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute top-[10px] right-[10px] w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-4 rounded-full transition-all duration-200 border border-transparent hover:border-slate-200/80 hover:shadow-sm"
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
