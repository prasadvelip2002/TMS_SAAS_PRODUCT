"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      document.cookie = 'isLoggedIn=; path=/; max-age=0';
      window.location.href = '/login';
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const role = user.role || "Tenant Admin";

      // Role group definitions matching Sidebar RBAC
      const ALL_OPERATIONAL = [
        'Tenant Admin', 
        'Director/Operations Head', 
        'Operations Manager', 
        'Branch Manager',
        'Branch Supervisor', 
        'Logistics Executive',
        'Dispatcher', 
        'Manager', 
        'Internal User', 
        'Platform Admin'
      ];

      const FINANCE_ROLES = [
        'Tenant Admin', 
        'Branch Manager',
        'Branch Supervisor', 
        'Finance Executive',
        'Finance', 
        'Accounts', 
        'Operations Manager', 
        'Platform Admin'
      ];

      const SETTINGS_ROLES = [
        'Tenant Admin', 
        'Branch Manager',
        'Branch Supervisor',
        'Platform Admin'
      ];

      const ALL_ROLES = Array.from(new Set([...ALL_OPERATIONAL, ...FINANCE_ROLES]));

      // RBAC Rules
      const rules: Record<string, string[]> = {
        "/map": ALL_OPERATIONAL,
        "/customers": ALL_ROLES,
        "/fleet": ALL_OPERATIONAL,
        "/vehicles": ALL_OPERATIONAL,
        "/drivers": ALL_OPERATIONAL,
        "/trips/advance-payment": FINANCE_ROLES,
        "/trips/charges": FINANCE_ROLES,
        "/trips": ALL_OPERATIONAL,
        "/payments": FINANCE_ROLES,
        "/settings": SETTINGS_ROLES,
        "/users": SETTINGS_ROLES,
        "/automation": ALL_OPERATIONAL,
        "/reports": ALL_ROLES,
        "/notifications": ALL_OPERATIONAL,
        "/saas-admin": ["Platform Admin"]
      };

      let isAllowed = true;
      if (role === "Platform Admin" || role === "Tenant Admin") {
        isAllowed = true;
      } else {
        // Sort routes by length descending so more specific sub-paths match first (e.g. /trips/advance-payment before /trips)
        const sortedRoutes = Object.keys(rules).sort((a, b) => b.length - a.length);
        for (const route of sortedRoutes) {
          if (pathname.startsWith(route)) {
            if (!rules[route].includes(role)) {
              isAllowed = false;
            }
            break;
          }
        }
      }

      setAuthorized(isAllowed);
    } catch (e) {
      router.push("/login");
    }
  }, [pathname, router]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close mobile sidebar whenever pathname changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (authorized === null) {
    return <div className="h-screen flex items-center justify-center bg-slate-50" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink w-full max-w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative w-full max-w-full">
        <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 md:p-6 relative z-0 w-full max-w-full touch-scroll">
          {authorized ? children : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Access Denied</h1>
              <p className="text-slate-500 max-w-md">Your current role does not have permission to view this module. Please contact your Tenant Admin for access.</p>
              <button onClick={() => router.push("/")} className="mt-8 bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
