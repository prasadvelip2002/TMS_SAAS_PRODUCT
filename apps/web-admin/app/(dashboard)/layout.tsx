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

      // RBAC Rules
      const rules: Record<string, string[]> = {
        "/map": ["Tenant Admin", "Manager", "Internal User"],
        "/customers": ["Tenant Admin", "Internal User", "Accounts"],
        "/fleet": ["Tenant Admin", "Internal User", "Accounts"],
        "/vehicles": ["Tenant Admin", "Internal User", "Accounts"],
        "/drivers": ["Tenant Admin", "Internal User", "Accounts"],
        "/trips/indents": ["Tenant Admin", "Internal User", "Manager"],
        "/trips/procurement": ["Tenant Admin", "Internal User", "Manager"],
        "/trips/assignment": ["Tenant Admin", "Internal User", "Manager"],
        "/trips/advance-payment": ["Tenant Admin", "Accounts"],
        "/trips/pod": ["Tenant Admin", "Internal User", "Manager"],
        "/trips/charges": ["Tenant Admin", "Internal User", "Accounts"],
        "/payments/settlements": ["Tenant Admin", "Accounts"],
        "/payments/invoices": ["Tenant Admin", "Accounts"],
        "/users": ["Tenant Admin"],
        "/automation": ["Tenant Admin", "Manager"],
      };

      let isAllowed = true;
      if (role === "Platform Admin") {
        isAllowed = true;
      } else {
        for (const route in rules) {
          if (pathname.startsWith(route)) {
            if (!rules[route].includes(role)) {
              isAllowed = false;
              break;
            }
          }
        }
      }

      setAuthorized(isAllowed);
    } catch (e) {
      router.push("/login");
    }
  }, [pathname, router]);

  if (authorized === null) {
    return <div className="h-screen flex items-center justify-center bg-slate-50" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-y-auto p-6 relative z-0">
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
