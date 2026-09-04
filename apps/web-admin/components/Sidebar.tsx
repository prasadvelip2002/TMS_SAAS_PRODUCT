"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Grid, Users, Truck, CreditCard, Paperclip, FileText, Handshake, DollarSign, Camera, Plus, Check, Bell, BarChart2, Bot, ShoppingCart, Wallet, Map as MapIcon, Building2 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>("Tenant Admin");
  const [user, setUser] = useState<{name: string, email: string, role: string} | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        if (u.role) {
          setUserRole(u.role);
        }
      } catch (e) {}
    }
  }, []);

  const navGroups = [
    {
      group: 'SaaS Administration',
      items: [
        { href: '/saas-admin', label: 'Tenants & Billing', icon: Grid, roles: ['Platform Admin'] }
      ]
    },
    {
      group: 'Overview',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: Grid, roles: ['Tenant Admin', 'Manager', 'Accounts', 'Internal User', 'Platform Admin'] },
        { href: '/map', label: 'Fleet Map Dashboard', icon: MapIcon, roles: ['Tenant Admin', 'Manager', 'Internal User', 'Platform Admin'] }
      ]
    },
    {
      group: 'Customer Masters',
      items: [
        { href: '/customers/contract', label: 'Contract Customers', icon: Users, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] },
        { href: '/customers/spot', label: 'Spot Customers', icon: Users, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] }
      ]
    },
    {
      group: 'Vendor Masters',
      items: [
        { href: '/fleet', label: 'Vendor Directory', icon: Handshake, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] },
        { href: '/vehicles/vendor', label: 'Vendor Vehicles', icon: Truck, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] },
        { href: '/drivers/vendor', label: 'Vendor Drivers', icon: Users, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] },
      ]
    },
    {
      group: 'Own Fleet Masters',
      items: [
        { href: '/vehicles/own', label: 'Own Vehicles', icon: Truck, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] },
        { href: '/drivers/own', label: 'Own Drivers', icon: Users, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] },
      ]
    },
    {
      group: 'Trip Lifecycle',
      items: [
        { href: '/trips', label: 'All Trips & Status', icon: Truck, roles: ['Tenant Admin', 'Internal User', 'Manager', 'Accounts', 'Platform Admin'] },
        { href: '/trips/indents', label: 'Indent Management', icon: FileText, roles: ['Tenant Admin', 'Internal User', 'Manager', 'Platform Admin'] },
        { href: '/trips/procurement', label: 'Procurement (RFQ)', icon: ShoppingCart, roles: ['Tenant Admin', 'Internal User', 'Manager', 'Platform Admin'] },
        { href: '/trips/sales', label: 'Customer Sales & PO', icon: Handshake, roles: ['Tenant Admin', 'Internal User', 'Manager', 'Platform Admin'] },
        { href: '/trips/confirmation', label: 'Trip Confirmation Sheet', icon: Paperclip, roles: ['Tenant Admin', 'Internal User', 'Platform Admin'] },
        { href: '/trips/assignment', label: 'Trip Assignment', icon: Handshake, roles: ['Tenant Admin', 'Internal User', 'Manager', 'Platform Admin'] },
        { href: '/trips/pod', label: 'POD Review', icon: Camera, roles: ['Tenant Admin', 'Internal User', 'Manager', 'Platform Admin'] },
        { href: '/automation', label: 'Automation Logs', icon: Bot, roles: ['Tenant Admin', 'Manager', 'Platform Admin'] },
      ]
    },
    {
      group: 'Finance & Payments',
      items: [
        { href: '/trips/advance-payment', label: 'Advance Payment', icon: DollarSign, roles: ['Tenant Admin', 'Accounts', 'Platform Admin'] },
        { href: '/trips/charges', label: 'Additional Charges', icon: Plus, roles: ['Tenant Admin', 'Internal User', 'Accounts', 'Platform Admin'] },
        { href: '/payments/settlements', label: 'Vendor Settlements', icon: Wallet, roles: ['Tenant Admin', 'Accounts', 'Platform Admin'] },
        { href: '/payments/invoices', label: 'Customer Invoices', icon: FileText, roles: ['Tenant Admin', 'Accounts', 'Platform Admin'] },
        { href: '/payments', label: 'Final Payment', icon: DollarSign, roles: ['Tenant Admin', 'Accounts', 'Platform Admin'] },
      ]
    },
    {
      group: 'System',
      items: [
        { href: '/users', label: 'Team & Users', icon: Users, roles: ['Tenant Admin', 'Platform Admin'] },
        { href: '/settings', label: 'Organization Settings', icon: Building2, roles: ['Tenant Admin', 'Platform Admin'] },
        { href: '/reports', label: 'Reports', icon: BarChart2, roles: ['Tenant Admin', 'Manager', 'Accounts', 'Platform Admin'] },
        { href: '/notifications', label: 'Notifications & WhatsApp', icon: Bell, roles: ['Tenant Admin', 'Manager', 'Platform Admin'] },
      ]
    }
  ];

  return (
    <div className="w-[260px] shrink-0 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 relative z-40">
      <div className="h-[100px] shrink-0 flex items-center px-5 justify-center mb-2 border-b border-slate-800/80">
        <div className="h-20 flex items-center justify-center border-b border-white/5 mx-4 shrink-0 bg-white rounded-xl mt-4 px-2">
          <img src="/logo.png" alt="Transitflow LOGISTICS" className="w-full h-[60px] object-contain mix-blend-multiply" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
        {navGroups.map((g, i) => {
          const visibleItems = g.items.filter(item => item.roles.includes(userRole));
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={i}>
              <div className="font-sans text-[11px] tracking-wider text-slate-500 font-bold uppercase px-6 pt-5 pb-2">
                {g.group}
              </div>
              {visibleItems.map((item, j) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={j}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 mx-3 my-1 text-[13.5px] cursor-pointer rounded-xl transition-all duration-300 group
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-[0_4px_12px_rgba(249,115,22,0.25)]' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium border border-transparent'
                      }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>


    </div>
  );
}
