"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Grid, 
  Users, 
  Truck, 
  CreditCard, 
  Paperclip, 
  FileText, 
  Handshake, 
  DollarSign, 
  Camera, 
  Plus, 
  Check, 
  Bell, 
  BarChart2, 
  Bot, 
  ShoppingCart, 
  Wallet, 
  Map as MapIcon, 
  Building2, 
  X 
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>("Tenant Admin");
  const [user, setUser] = useState<{name: string, email: string, role: string, branchName?: string} | null>(null);

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

  // Role group definitions for clear permissions
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
        { href: '/dashboard', label: 'Dashboard', icon: Grid, roles: [...ALL_OPERATIONAL, 'Finance', 'Accounts'] },
        { href: '/map', label: 'Fleet Map Dashboard', icon: MapIcon, roles: ALL_OPERATIONAL }
      ]
    },
    {
      group: 'Customer Masters',
      items: [
        { href: '/customers/contract', label: 'Contract Customers', icon: Users, roles: ALL_OPERATIONAL },
        { href: '/customers/spot', label: 'Spot Customers', icon: Users, roles: ALL_OPERATIONAL }
      ]
    },
    {
      group: 'Vendor Masters',
      items: [
        { href: '/fleet', label: 'Vendor Directory', icon: Handshake, roles: ALL_OPERATIONAL },
        { href: '/vehicles/vendor', label: 'Vendor Vehicles', icon: Truck, roles: ALL_OPERATIONAL },
        { href: '/drivers/vendor', label: 'Vendor Drivers', icon: Users, roles: ALL_OPERATIONAL },
      ]
    },
    {
      group: 'Own Fleet Masters',
      items: [
        { href: '/vehicles/own', label: 'Own Vehicles', icon: Truck, roles: ALL_OPERATIONAL },
        { href: '/drivers/own', label: 'Own Drivers', icon: Users, roles: ALL_OPERATIONAL },
      ]
    },
    {
      group: 'Trip Lifecycle',
      items: [
        { href: '/trips', label: 'All Trips & Status', icon: Truck, roles: ALL_OPERATIONAL },
        { href: '/trips/indents', label: 'Indent Management', icon: FileText, roles: ALL_OPERATIONAL },
        { href: '/trips/procurement', label: 'Procurement (RFQ)', icon: ShoppingCart, roles: ALL_OPERATIONAL },
        { href: '/trips/sales', label: 'Sales', icon: Handshake, roles: ALL_OPERATIONAL },
        { href: '/trips/confirmation', label: 'Trip Confirmation Sheet', icon: Paperclip, roles: ALL_OPERATIONAL },
        { href: '/trips/assignment', label: 'Trip Assignment', icon: Handshake, roles: ALL_OPERATIONAL },
        { href: '/trips/pod', label: 'POD Review', icon: Camera, roles: ALL_OPERATIONAL },
        { href: '/automation', label: 'Automation Logs', icon: Bot, roles: ALL_OPERATIONAL },
      ]
    },
    {
      group: 'Finance & Payments',
      items: [
        { href: '/trips/advance-payment', label: 'Advance Payment', icon: DollarSign, roles: FINANCE_ROLES },
        { href: '/trips/charges', label: 'Additional Charges', icon: Plus, roles: FINANCE_ROLES },
        { href: '/payments/settlements', label: 'Vendor Settlements', icon: Wallet, roles: FINANCE_ROLES },
        { href: '/payments/invoices', label: 'Customer Invoices', icon: FileText, roles: FINANCE_ROLES },
        { href: '/payments', label: 'Final Payment', icon: DollarSign, roles: FINANCE_ROLES },
      ]
    },
    {
      group: 'System',
      items: [
        { href: '/settings', label: (userRole === 'Branch Manager' || userRole === 'Branch Supervisor') ? 'Branch Team & Hub' : 'Organization Settings', icon: Building2, roles: SETTINGS_ROLES },
        { href: '/reports', label: 'Reports', icon: BarChart2, roles: [...ALL_OPERATIONAL, ...FINANCE_ROLES] },
        { href: '/notifications', label: 'Notifications & WhatsApp', icon: Bell, roles: ALL_OPERATIONAL },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[270px] sm:w-[280px] shrink-0 bg-[#0F172A] text-slate-400 flex flex-col h-full border-r border-slate-800 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-[62px] sm:h-[75px] lg:h-[86px] shrink-0 flex items-center px-3 sm:px-4 justify-between border-b border-slate-800/80">
          <div className="h-11 sm:h-14 flex-1 flex items-center justify-start px-2 py-1">
            <img src="/logo-white.png" alt="LogiPulse" className="h-[36px] sm:h-[44px] w-auto object-contain" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide touch-scroll">
          {navGroups.map((g, i) => {
            const visibleItems = g.items.filter(item => item.roles.includes(userRole));
            
            if (visibleItems.length === 0) return null;

            return (
              <div key={i} className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-800/60 last:border-0">
                <p className="px-2 sm:px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 sm:mb-2">{g.group}</p>
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-150 ${
                          active 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold' 
                            : 'hover:bg-slate-800/70 hover:text-slate-200'
                        }`}
                      >
                        <Icon size={16} className={`shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Branch Footer Card */}
        {user?.branchName && (
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 m-2 rounded-xl flex items-center justify-between text-xs">
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Active Hub</span>
              <span className="font-bold text-blue-400 truncate block">{user.branchName}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        )}
      </aside>
    </>
  );
}
