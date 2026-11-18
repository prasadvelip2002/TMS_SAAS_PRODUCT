"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  Truck,
  ClipboardList,
  FileCheck,
  Wallet,
  BadgeCheck,
  Receipt,
  Bell,
  Search,
  Plus,
  Filter,
  ChevronDown,
  TrendingUp,
  Package,
  CircleDollarSign,
  Route,
  Building2,
  ListChecks,
  Receipt as ReceiptIcon,
  BarChart3,
  MessageCircle,
  CalendarClock,
  Settings as SettingsIcon,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "customers", label: "Customer Master", icon: Users },
  { id: "vendors", label: "Fleet Vendor Master", icon: Building2 },
  { id: "vehicles", label: "Vehicle Master", icon: Truck },
  { id: "indent", label: "Indent Management", icon: ClipboardList },
  { id: "tcs", label: "Trip Confirmation", icon: FileCheck },
  { id: "assignment", label: "Trip Assignment", icon: ListChecks },
  { id: "advance", label: "Advance Payment", icon: Wallet },
  { id: "approvals", label: "Manager Approval", icon: BadgeCheck },
  { id: "charges", label: "Additional Charges", icon: ReceiptIcon },
  { id: "final", label: "Final Payment", icon: Receipt },
  { id: "scheduler", label: "Daily Scheduler", icon: CalendarClock },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "whatsapp", label: "WhatsApp Integration", icon: MessageCircle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings & Users", icon: SettingsIcon },
]

function StatusPill({ tone, children }: { tone: "green" | "amber" | "blue" | "red"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  )
}

function KpiCard({ label, value, delta, icon: Icon }: { label: string; value: string; delta: string; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
        <TrendingUp className="h-3 w-3" /> {delta}
      </div>
    </div>
  )
}

function TableShell({
  title,
  columns,
  rows,
  action,
}: {
  title: string
  columns: string[]
  rows: React.ReactNode[][]
  action?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground">
            <Search className="h-3.5 w-3.5" /> Search…
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm">
            <Filter className="h-3.5 w-3.5" /> Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
            <Plus className="h-3.5 w-3.5" /> {action ?? "New"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/50">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active Trips" value="184" delta="+12% wk" icon={Route} />
        <KpiCard label="Open Indents" value="37" delta="+5 today" icon={Package} />
        <KpiCard label="Pending Approvals" value="14" delta="4 urgent" icon={BadgeCheck} />
        <KpiCard label="Advances Today" value="₹4.2L" delta="+8%" icon={CircleDollarSign} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Trip volume — last 7 days</h3>
            <span className="text-xs text-muted-foreground">Trips dispatched</span>
          </div>
          <div className="flex h-40 items-end gap-3">
            {[52, 68, 44, 82, 74, 96, 60].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end" style={{ height: "128px" }}>
                  <div className="w-full rounded-t-md bg-primary" style={{ height: `${h}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-semibold">Recent activity</h3>
          <ul className="space-y-3 text-sm">
            {[
              ["Advance approved", "TRIP-2291 · ₹15,000", "bg-emerald-500"],
              ["POD verified", "TRIP-2287 · Delhi hub", "bg-blue-500"],
              ["Indent created", "IND-5521 · ACME Corp", "bg-amber-500"],
              ["Charge escalated", "TRIP-2280 · Detention", "bg-red-500"],
            ].map(([t, s, dot], i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="text-xs text-muted-foreground">{s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Customers() {
  return (
    <TableShell
      title="Customer Master"
      action="Add Customer"
      columns={["Code", "Customer", "GSTIN", "Rate Contract", "Status"]}
      rows={[
        ["CUST-001", "ACME Logistics Pvt Ltd", "27AABCA1234F1Z5", "Active · FTL", <StatusPill key="s" tone="green">Active</StatusPill>],
        ["CUST-002", "BlueDart Movers", "29AAACB4321K1Z2", "Active · LTL", <StatusPill key="s" tone="green">Active</StatusPill>],
        ["CUST-003", "Sterling Freight", "24AAECS9876M1Z9", "Draft", <StatusPill key="s" tone="amber">Pending KYC</StatusPill>],
        ["CUST-004", "Orbit Traders", "07AAFCO5432L1Z1", "Expired", <StatusPill key="s" tone="red">On Hold</StatusPill>],
      ]}
    />
  )
}

function Indent() {
  return (
    <TableShell
      title="Indent Management"
      action="Create Indent"
      columns={["Indent #", "Customer", "Route", "Vehicle Type", "Pickup", "Status"]}
      rows={[
        ["IND-5521", "ACME Logistics", "Mumbai → Pune", "32ft MXL", "07 Jul", <StatusPill key="s" tone="blue">Assigned</StatusPill>],
        ["IND-5522", "BlueDart Movers", "Delhi → Jaipur", "20ft SXL", "07 Jul", <StatusPill key="s" tone="amber">Open</StatusPill>],
        ["IND-5523", "Sterling Freight", "Chennai → Blr", "Container", "08 Jul", <StatusPill key="s" tone="amber">Open</StatusPill>],
        ["IND-5524", "Orbit Traders", "Kolkata → Patna", "14ft", "08 Jul", <StatusPill key="s" tone="green">Confirmed</StatusPill>],
      ]}
    />
  )
}

function Vehicles() {
  return (
    <TableShell
      title="Vehicle Master"
      action="Add Vehicle"
      columns={["Reg. No", "Type", "Owner", "Capacity", "Docs", "Status"]}
      rows={[
        ["MH12 AB 4521", "32ft MXL", "Owned", "16 T", <StatusPill key="s" tone="green">Valid</StatusPill>, <StatusPill key="a" tone="green">Available</StatusPill>],
        ["DL01 CE 8890", "20ft SXL", "Vendor · SR Trans", "9 T", <StatusPill key="s" tone="amber">Insurance due</StatusPill>, <StatusPill key="a" tone="blue">On Trip</StatusPill>],
        ["KA05 MN 3312", "Container", "Owned", "24 T", <StatusPill key="s" tone="green">Valid</StatusPill>, <StatusPill key="a" tone="blue">On Trip</StatusPill>],
        ["WB20 GH 7745", "14ft", "Vendor · Patna Fleet", "6 T", <StatusPill key="s" tone="red">Expired PUC</StatusPill>, <StatusPill key="a" tone="red">Blocked</StatusPill>],
      ]}
    />
  )
}

function Tcs() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-semibold">Trip Confirmation Sheet — TCS-8842</h3>
          <StatusPill tone="amber">Awaiting Approval</StatusPill>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {[
            ["Customer", "ACME Logistics"],
            ["Route", "Mumbai → Pune"],
            ["Vehicle", "MH12 AB 4521"],
            ["Driver", "R. Kumar"],
            ["Freight", "₹28,500"],
            ["Advance", "₹15,000"],
            ["Loading", "07 Jul, 09:00"],
            ["Distance", "148 km"],
            ["Material", "Auto parts"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Submit for Approval</button>
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Save Draft</button>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Cost breakdown</h3>
        <ul className="space-y-2 text-sm">
          {[["Base freight", "₹28,500"], ["Loading", "₹1,200"], ["Toll (est.)", "₹850"], ["Advance", "-₹15,000"]].map(
            ([k, v]) => (
              <li key={k} className="flex justify-between border-b border-border pb-2 text-muted-foreground last:border-0">
                <span>{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </li>
            ),
          )}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
          <span>Balance on POD</span>
          <span>₹15,550</span>
        </div>
      </div>
    </div>
  )
}

function Approvals() {
  return (
    <div className="space-y-3">
      {[
        ["Advance Request", "TRIP-2291 · R. Kumar", "₹15,000", "Within policy", "green"],
        ["Unloading Charge", "TRIP-2287 · S. Yadav", "₹3,200", "Above threshold", "amber"],
        ["Rate Exception", "IND-5523 · Sterling", "+8% freight", "Needs review", "amber"],
        ["Detention Charge", "TRIP-2280 · A. Singh", "₹2,000", "Proof attached", "blue"],
      ].map(([type, ref, amt, note, tone], i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{type}</span>
              <StatusPill tone={tone as any}>{note}</StatusPill>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{ref}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{amt}</span>
            <button className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium">Reject</button>
            <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Approve</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Advance() {
  return (
    <TableShell
      title="Advance Payment"
      action="Disburse"
      columns={["Trip #", "Driver", "Amount", "Approved by", "Mode", "Status"]}
      rows={[
        ["TRIP-2291", "R. Kumar", "₹15,000", "Accounts", "UPI", <StatusPill key="s" tone="green">Disbursed</StatusPill>],
        ["TRIP-2288", "S. Yadav", "₹10,000", "Manager", "Bank", <StatusPill key="s" tone="amber">Pending</StatusPill>],
        ["TRIP-2285", "A. Singh", "₹8,500", "Accounts", "UPI", <StatusPill key="s" tone="green">Disbursed</StatusPill>],
        ["TRIP-2279", "M. Das", "₹20,000", "—", "—", <StatusPill key="s" tone="blue">In Review</StatusPill>],
      ]}
    />
  )
}

function Final() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <h3 className="border-b border-border pb-3 font-semibold">Final Settlement — TRIP-2287</h3>
        <ul className="mt-4 space-y-2.5 text-sm">
          {[
            ["Total freight", "₹32,000", false],
            ["Additional charges", "₹3,200", false],
            ["Advance paid", "-₹15,000", false],
            ["Deductions (shortage)", "-₹500", false],
            ["Net payable to vendor", "₹19,700", true],
          ].map(([k, v, bold], i) => (
            <li
              key={i}
              className={`flex justify-between border-b border-border pb-2.5 last:border-0 ${bold ? "border-t border-border pt-3 text-base font-semibold" : "text-muted-foreground"}`}
            >
              <span className={bold ? "text-foreground" : ""}>{k}</span>
              <span className="font-medium text-foreground">{v}</span>
            </li>
          ))}
        </ul>
        <button className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Process Settlement</button>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Documents</h3>
        <ul className="space-y-2 text-sm">
          {[["POD (front)", "green"], ["POD (back)", "green"], ["Unloading receipt", "green"], ["Toll receipts", "amber"]].map(
            ([d, tone], i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>{d}</span>
                <StatusPill tone={tone as any}>{tone === "green" ? "Verified" : "Pending"}</StatusPill>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  )
}

function Vendors() {
  return (
    <TableShell
      title="Fleet Vendor Master"
      action="Add Vendor"
      columns={["Code", "Vendor", "Fleet Size", "PAN / GST", "Rating", "Status"]}
      rows={[
        ["VEN-101", "SR Transport", "24 vehicles", "AAECS1234R", "4.6 ★", <StatusPill key="s" tone="green">Active</StatusPill>],
        ["VEN-102", "Patna Fleet Co.", "12 vehicles", "AAFCP9087K", "4.1 ★", <StatusPill key="s" tone="green">Active</StatusPill>],
        ["VEN-103", "Highway Carriers", "38 vehicles", "AAGCH5522L", "3.8 ★", <StatusPill key="s" tone="amber">KYC due</StatusPill>],
        ["VEN-104", "Metro Roadlines", "7 vehicles", "AAHCM7741P", "2.9 ★", <StatusPill key="s" tone="red">Suspended</StatusPill>],
      ]}
    />
  )
}

function Assignment() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card lg:col-span-2">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Unassigned Indents</h3>
          <p className="text-xs text-muted-foreground">Drag or assign a vehicle to confirm the trip.</p>
        </div>
        <div className="divide-y divide-border">
          {[
            ["IND-5522", "Delhi → Jaipur", "20ft SXL", "07 Jul"],
            ["IND-5523", "Chennai → Bangalore", "Container", "08 Jul"],
            ["IND-5525", "Pune → Nagpur", "32ft MXL", "08 Jul"],
          ].map(([id, route, type, date]) => (
            <div key={id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold">{route}</p>
                <p className="text-xs text-muted-foreground">{id} · {type} · {date}</p>
              </div>
              <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                Assign <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">Available vehicles</h3>
        <ul className="space-y-2 text-sm">
          {[
            ["MH12 AB 4521", "32ft MXL · Owned", "green"],
            ["KA05 MN 3312", "Container · Owned", "green"],
            ["DL01 CE 8890", "20ft · SR Trans", "amber"],
          ].map(([reg, meta, tone]) => (
            <li key={reg} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="font-medium">{reg}</p>
                <p className="text-xs text-muted-foreground">{meta}</p>
              </div>
              <StatusPill tone={tone as any}>{tone === "green" ? "Ready" : "Check docs"}</StatusPill>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Charges() {
  return (
    <TableShell
      title="Additional Charges"
      action="Raise Charge"
      columns={["Trip #", "Type", "Amount", "Raised by", "Proof", "Status"]}
      rows={[
        ["TRIP-2287", "Unloading", "₹3,200", "Driver", <StatusPill key="p" tone="green">Attached</StatusPill>, <StatusPill key="s" tone="amber">Pending</StatusPill>],
        ["TRIP-2280", "Detention", "₹2,000", "Driver", <StatusPill key="p" tone="green">Attached</StatusPill>, <StatusPill key="s" tone="green">Approved</StatusPill>],
        ["TRIP-2275", "Toll extra", "₹640", "Ops", <StatusPill key="p" tone="amber">Missing</StatusPill>, <StatusPill key="s" tone="red">Rejected</StatusPill>],
        ["TRIP-2291", "Loading wait", "₹1,100", "Driver", <StatusPill key="p" tone="green">Attached</StatusPill>, <StatusPill key="s" tone="blue">In Review</StatusPill>],
      ]}
    />
  )
}

function Scheduler() {
  const slots = ["06:00", "09:00", "12:00", "15:00", "18:00"]
  const lanes = ["Mumbai Hub", "Delhi Hub", "Chennai Hub"]
  const trips: Record<string, [string, string, string][]> = {
    "Mumbai Hub": [["09:00", "TRIP-2291 → Pune", "bg-primary"], ["15:00", "TRIP-2295 → Nashik", "bg-chart-3"]],
    "Delhi Hub": [["06:00", "TRIP-2287 → Jaipur", "bg-accent"], ["12:00", "TRIP-2298 → Agra", "bg-chart-4"]],
    "Chennai Hub": [["12:00", "TRIP-2280 → Blr", "bg-chart-5"]],
  }
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Daily Scheduler — 07 Jul 2026</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" /> Dispatch board
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[120px_repeat(5,1fr)] border-b border-border pb-2 text-xs font-medium uppercase text-muted-foreground">
            <span>Hub</span>
            {slots.map((s) => <span key={s} className="text-center">{s}</span>)}
          </div>
          {lanes.map((lane) => (
            <div key={lane} className="grid grid-cols-[120px_repeat(5,1fr)] items-center gap-1 border-b border-border py-3 last:border-0">
              <span className="text-sm font-medium">{lane}</span>
              {slots.map((slot) => {
                const t = trips[lane]?.find(([time]) => time === slot)
                return (
                  <div key={slot} className="px-1">
                    {t ? (
                      <div className={`rounded-md ${t[2]} px-2 py-1.5 text-center text-[10px] font-medium text-primary-foreground`}>
                        {t[1]}
                      </div>
                    ) : (
                      <div className="h-8 rounded-md border border-dashed border-border" />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Reports() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Revenue (MTD)" value="₹1.24Cr" delta="+9.2%" icon={CircleDollarSign} />
        <KpiCard label="Trips Closed" value="1,842" delta="+140" icon={Route} />
        <KpiCard label="On-time %" value="93.4%" delta="+1.8%" icon={TrendingUp} />
        <KpiCard label="Avg Margin" value="18.6%" delta="+0.6%" icon={BarChart3} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-semibold">Revenue by lane</h3>
          <ul className="space-y-3 text-sm">
            {[
              ["Mumbai → Pune", 92, "₹18.2L"],
              ["Delhi → Jaipur", 74, "₹14.6L"],
              ["Chennai → Blr", 61, "₹12.1L"],
              ["Kolkata → Patna", 43, "₹8.5L"],
            ].map(([lane, pct, amt]) => (
              <li key={lane as string}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{lane}</span>
                  <span className="text-muted-foreground">{amt}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-semibold">Available report exports</h3>
          <ul className="space-y-2 text-sm">
            {["Trip P&L statement", "Vendor performance", "Advance & settlement", "GST / e-invoice register", "Fuel & toll summary"].map(
              (r) => (
                <li key={r} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <span>{r}</span>
                  <button className="flex items-center gap-1 text-xs font-medium text-primary">
                    Export <ArrowDownRight className="h-3.5 w-3.5" />
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

function WhatsApp() {
  return (
    <div className="space-y-5">
      {/* Connection + delivery KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-semibold">Business API</span>
          </div>
          <p className="mt-1 text-xs text-emerald-700/80">+91 90000 12345 · Verified</p>
          <p className="mt-2 text-[11px] text-emerald-700/70">Quality rating: High</p>
        </div>
        {[
          ["Sent", "1,204", "text-blue-600"],
          ["Delivered / Read", "1,180 / 1,041", "text-emerald-600"],
          ["Failed", "24", "text-red-500"],
        ].map(([k, v, cls]) => (
          <div key={k as string} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className={`mt-1 text-xl font-bold ${cls}`}>{v}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">Today</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Automation trigger rules */}
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h3 className="font-semibold">Automation trigger rules</h3>
              <p className="text-xs text-muted-foreground">Which event fires which template.</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
              <Plus className="h-3.5 w-3.5" /> New rule
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                {["Trigger event", "Template", "Recipient", "Status"].map((c) => (
                  <th key={c} className="px-4 py-2.5 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Trip assigned", "trip_assigned", "Driver", "green"],
                ["Advance approved", "advance_disbursed", "Driver", "green"],
                ["POD pending > 24h", "pod_reminder", "Driver", "green"],
                ["Trip delivered", "delivery_confirm", "Customer", "green"],
                ["Payment settled", "payment_settled", "Vendor", "amber"],
              ].map(([evt, tpl, who, tone], i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{evt}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tpl}</td>
                  <td className="px-4 py-3 text-muted-foreground">{who}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={tone as any}>{tone === "green" ? "Active" : "Draft"}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Template library */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Template library</h3>
          <ul className="space-y-2 text-sm">
            {[
              ["trip_assigned", "Approved", "green"],
              ["advance_disbursed", "Approved", "green"],
              ["pod_reminder", "Approved", "green"],
              ["delivery_confirm", "Approved", "green"],
              ["payment_settled", "In review", "amber"],
            ].map(([name, status, tone]) => (
              <li key={name as string} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="font-mono text-xs">{name}</span>
                <StatusPill tone={tone as any}>{status}</StatusPill>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Two-way conversation view */}
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">RK</span>
              <div>
                <p className="text-sm font-semibold">Rajesh Kumar</p>
                <p className="text-xs text-muted-foreground">Driver · TRIP-2287</p>
              </div>
            </div>
            <StatusPill tone="green">Online</StatusPill>
          </div>
          <div className="space-y-3 bg-secondary/30 p-4">
            {[
              ["out", "Trip TRIP-2287 assigned: Delhi → Jaipur. Reply 1 to accept.", "09:02"],
              ["in", "1", "09:03"],
              ["out", "Advance of ₹15,000 disbursed to your account.", "09:20"],
              ["in", "Received. Loading done, leaving now.", "09:41"],
              ["in", "[POD photo]", "18:12"],
              ["out", "POD received and verified. Thank you!", "18:15"],
            ].map(([dir, text, time], i) => (
              <div key={i} className={`flex ${dir === "out" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${dir === "out" ? "bg-emerald-600 text-white" : "bg-card border border-border"}`}>
                  <p>{text}</p>
                  <p className={`mt-0.5 text-[10px] ${dir === "out" ? "text-white/70" : "text-muted-foreground"}`}>{time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <div className="flex-1 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">Type a reply…</div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Opt-in / consent management */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-1 font-semibold">Opt-in & consent</h3>
          <p className="mb-3 text-xs text-muted-foreground">Consent status per contact group.</p>
          <ul className="space-y-2 text-sm">
            {[
              ["Drivers", "312 / 320", "green"],
              ["Customers", "88 / 104", "amber"],
              ["Fleet vendors", "41 / 46", "amber"],
              ["Blocked / opted out", "12", "red"],
            ].map(([grp, val, tone]) => (
              <li key={grp as string} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>{grp}</span>
                <StatusPill tone={tone as any}>{val}</StatusPill>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
            Opt-out keyword STOP is honored automatically per WhatsApp policy.
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsWeb() {
  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {[
        ["Advance approved", "TRIP-2291 · ₹15,000 disbursed via UPI", "2m ago", "green"],
        ["Charge escalated", "TRIP-2287 unloading ₹3,200 needs manager sign-off", "18m ago", "amber"],
        ["Document expiring", "MH12 AB 4521 insurance expires in 5 days", "1h ago", "red"],
        ["Trip closed", "TRIP-2280 settled · net ₹19,700", "3h ago", "blue"],
        ["New indent", "IND-5525 created by ACME Logistics", "5h ago", "blue"],
      ].map(([title, sub, time, tone], i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : tone === "red" ? "bg-red-500" : "bg-blue-500"}`} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{sub}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
      ))}
    </div>
  )
}

function Settings() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card lg:col-span-2">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">Users & Roles</h3>
          <button className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
            <Plus className="h-3.5 w-3.5" /> Invite user
          </button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              {["User", "Role", "Status"].map((c) => <th key={c} className="px-4 py-2.5 font-medium">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ["Priya Verma", "Tenant Admin", "green"],
              ["Anil Mehta", "Manager", "green"],
              ["Sara Khan", "Accounts", "green"],
              ["Rohit Das", "Internal User", "amber"],
            ].map(([name, role, tone], i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{name}</td>
                <td className="px-4 py-3 text-muted-foreground">{role}</td>
                <td className="px-4 py-3"><StatusPill tone={tone as any}>{tone === "green" ? "Active" : "Invited"}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 font-semibold">Role permissions</h3>
        <ul className="space-y-2 text-sm">
          {[
            ["Create indent", true],
            ["Approve advance", true],
            ["Disburse payment", false],
            ["Manage users", true],
            ["Export reports", false],
          ].map(([perm, on], i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span>{perm}</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full ${on ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SCREENS: Record<string, () => React.JSX.Element> = {
  dashboard: Dashboard,
  customers: Customers,
  vendors: Vendors,
  vehicles: Vehicles,
  indent: Indent,
  tcs: Tcs,
  assignment: Assignment,
  advance: Advance,
  approvals: Approvals,
  charges: Charges,
  final: Final,
  scheduler: Scheduler,
  reports: Reports,
  whatsapp: WhatsApp,
  notifications: NotificationsWeb,
  settings: Settings,
}

export function WebScreens() {
  const [active, setActive] = useState("dashboard")
  const current = NAV.find((n) => n.id === active) ?? NAV[0]
  const Screen = SCREENS[active]

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8">
        <Badge className="mb-3 bg-primary text-primary-foreground">Web · Admin Portal</Badge>
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Desktop admin console</h2>
        <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          High-fidelity blueprints for the operations team. Switch modules in the sidebar to preview each screen.
        </p>
      </header>

      {/* Browser frame */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <div className="ml-3 flex-1 truncate rounded-md bg-card px-3 py-1 text-xs text-muted-foreground">
            app.logipulse.io/{active}
          </div>
        </div>

        <div className="flex min-h-[560px]">
          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 flex-col bg-sidebar p-3 text-sidebar-foreground md:flex">
            <div className="flex items-center gap-2 px-2 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Truck className="h-4 w-4" />
              </span>
              <span className="font-bold">LogiPulse</span>
            </div>
            <nav className="mt-2 flex flex-col gap-1">
              {NAV.map((item) => {
                const Icon = item.icon
                const isActive = item.id === active
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col bg-background">
            <header className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  LogiPulse <span>/</span> <span className="text-foreground">{current.label}</span>
                </div>
                <h3 className="text-lg font-semibold">{current.label}</h3>
              </div>
              <div className="flex items-center gap-3">
                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                    3
                  </span>
                </button>
                <div className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    PV
                  </span>
                  <span className="hidden sm:inline">Priya V.</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </header>

            {/* Mobile module selector */}
            <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                    item.id === active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <Screen />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
