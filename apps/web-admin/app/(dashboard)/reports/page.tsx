"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { 
  BarChart2, 
  TrendingUp, 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  Search, 
  X, 
  Filter, 
  Calendar, 
  DollarSign, 
  Users, 
  Truck, 
  CheckCircle2, 
  Receipt,
  RotateCcw,
  ArrowUpRight
} from "lucide-react";

function PremiumKpiCard({ title, value, subtext, trend, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${colorClass} opacity-10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-125`} />
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClass} text-white shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : trend === 'down' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'}`}>
          {subtext}
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{value}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trips' | 'customers' | 'vendors'>('trips');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, this_month, last_month, last_30, last_90
  const [statusFilter, setStatusFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState("all"); // all, billed, unbilled

  useEffect(() => {
    fetchApi("/Reports/trips")
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to load reports", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic
  const filteredReports = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return reports.filter(r => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = (
          r.tripId?.toString().toLowerCase().includes(q) ||
          r.customerName?.toLowerCase().includes(q) ||
          r.source?.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q) ||
          r.warehouseLocation?.toLowerCase().includes(q) ||
          r.vendorName?.toLowerCase().includes(q) ||
          r.vehicle?.toLowerCase().includes(q) ||
          r.material?.toLowerCase().includes(q) ||
          r.invoiceNumber?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q)
        );
        if (!matchesSearch) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === "completed" && !["Delivered", "Completed", "Closed"].includes(r.status)) return false;
        if (statusFilter === "transit" && !["Started", "InTransit", "Assigned"].includes(r.status)) return false;
        if (statusFilter === "pending" && !["Pending Assignment", "Draft"].includes(r.status)) return false;
      }

      // 3. Billing Filter
      if (billingFilter !== "all") {
        if (billingFilter === "billed" && !r.isBilled) return false;
        if (billingFilter === "unbilled" && r.isBilled) return false;
      }

      // 4. Date Range Filter
      if (dateFilter !== "all") {
        const tripDate = new Date(r.date);
        if (dateFilter === "this_month") {
          if (tripDate.getMonth() !== currentMonth || tripDate.getFullYear() !== currentYear) return false;
        } else if (dateFilter === "last_month") {
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (tripDate.getMonth() !== prevMonth || tripDate.getFullYear() !== prevYear) return false;
        } else if (dateFilter === "last_30") {
          const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (tripDate < past30) return false;
        } else if (dateFilter === "last_90") {
          const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          if (tripDate < past90) return false;
        }
      }

      return true;
    });
  }, [reports, searchQuery, statusFilter, billingFilter, dateFilter]);

  // Aggregate Totals
  const totals = useMemo(() => {
    const revenue = filteredReports.reduce((acc, curr) => acc + (Number(curr.customerRate) || 0), 0);
    const cost = filteredReports.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
    const margin = filteredReports.reduce((acc, curr) => acc + (Number(curr.margin) || 0), 0);
    const avgMarginPercent = revenue > 0 ? ((margin / revenue) * 100).toFixed(1) : "0.0";

    return {
      revenue,
      cost,
      margin,
      avgMarginPercent
    };
  }, [filteredReports]);

  // Customer Grouped Summary
  const customerSummary = useMemo(() => {
    const map: Record<string, any> = {};
    filteredReports.forEach(r => {
      const cust = r.customerName || "Unknown Customer";
      if (!map[cust]) {
        map[cust] = {
          name: cust,
          tripCount: 0,
          revenue: 0,
          cost: 0,
          margin: 0,
          billedCount: 0,
          unbilledCount: 0
        };
      }
      map[cust].tripCount += 1;
      map[cust].revenue += Number(r.customerRate) || 0;
      map[cust].cost += Number(r.totalCost) || 0;
      map[cust].margin += Number(r.margin) || 0;
      if (r.isBilled) {
        map[cust].billedCount += 1;
      } else {
        map[cust].unbilledCount += 1;
      }
    });

    return Object.values(map).sort((a: any, b: any) => b.revenue - a.revenue);
  }, [filteredReports]);

  // Vendor Grouped Summary
  const vendorSummary = useMemo(() => {
    const map: Record<string, any> = {};
    filteredReports.forEach(r => {
      const vendor = r.vendorName || "Market / Unassigned";
      if (!map[vendor]) {
        map[vendor] = {
          name: vendor,
          tripCount: 0,
          totalCost: 0,
          fuelTolls: 0,
          settledCount: 0,
          pendingSettlementCount: 0
        };
      }
      map[vendor].tripCount += 1;
      map[vendor].totalCost += Number(r.totalCost) || 0;
      map[vendor].fuelTolls += (Number(r.fuelAdvance) || 0) + (Number(r.tollCharges) || 0);
      if (r.isVendorSettled) {
        map[vendor].settledCount += 1;
      } else {
        map[vendor].pendingSettlementCount += 1;
      }
    });

    return Object.values(map).sort((a: any, b: any) => b.totalCost - a.totalCost);
  }, [filteredReports]);

  // CSV Export - Now accurately downloads filtered selection
  const downloadCSV = () => {
    if (activeTab === 'trips') {
      const headers = ["Trip ID", "Date", "Customer", "Route", "Material", "Weight (Tons)", "Vendor", "Vehicle", "Status", "Billed", "Invoice #", "Selling Price (₹)", "Supplier Cost (₹)", "Fuel (₹)", "Toll (₹)", "Extra Charges (₹)", "Total Cost (₹)", "Gross Margin (₹)", "Margin %"];
      const rows = filteredReports.map(r => {
        const routeStr = r.warehouseLocation 
          ? `${r.source} -> ${r.warehouseLocation} (Hub) -> ${r.destination}`
          : `${r.source} to ${r.destination}`;
        const marginPct = r.customerRate > 0 ? ((r.margin / r.customerRate) * 100).toFixed(1) + "%" : "0%";
        return [
          r.tripId,
          new Date(r.date).toLocaleDateString(),
          `"${(r.customerName || '').replace(/"/g, '""')}"`,
          `"${routeStr.replace(/"/g, '""')}"`,
          `"${(r.material || '').replace(/"/g, '""')}"`,
          r.weight || 0,
          `"${(r.vendorName || '').replace(/"/g, '""')}"`,
          `"${(r.vehicle || '').replace(/"/g, '""')}"`,
          r.status,
          r.isBilled ? "Yes" : "No",
          r.invoiceNumber || "Unbilled",
          r.customerRate || 0,
          r.supplierRate || 0,
          r.fuelAdvance || 0,
          r.tollCharges || 0,
          r.extraCharges || 0,
          r.totalCost || 0,
          r.margin || 0,
          marginPct
        ].join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `trip_profitability_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeTab === 'customers') {
      const headers = ["Customer Name", "Total Trips", "Gross Freight Revenue (₹)", "Total Direct Costs (₹)", "Net Gross Margin (₹)", "Margin %", "Invoiced Trips", "Unbilled Trips"];
      const rows = customerSummary.map((c: any) => {
        const marginPct = c.revenue > 0 ? ((c.margin / c.revenue) * 100).toFixed(1) + "%" : "0%";
        return [
          `"${(c.name || '').replace(/"/g, '""')}"`,
          c.tripCount,
          c.revenue,
          c.cost,
          c.margin,
          marginPct,
          c.billedCount,
          c.unbilledCount
        ].join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `customer_revenue_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ["Vendor / Fleet Name", "Trips Handled", "Total Freight Cost (₹)", "Fuel & Toll Expenses (₹)", "Settled Trips", "Pending Settlement"];
      const rows = vendorSummary.map((v: any) => [
        `"${(v.name || '').replace(/"/g, '""')}"`,
        v.tripCount,
        v.totalCost,
        v.fuelTolls,
        v.settledCount,
        v.pendingSettlementCount
      ].join(","));

      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `vendor_settlement_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hasActiveFilters = searchQuery !== "" || dateFilter !== "all" || statusFilter !== "all" || billingFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setStatusFilter("all");
    setBillingFilter("all");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Financial & Operations Reports
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Real-time trip profitability, customer revenue breakdown, and vendor settlement reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={downloadCSV}
            disabled={filteredReports.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Filtered CSV ({activeTab === 'trips' ? filteredReports.length : activeTab === 'customers' ? customerSummary.length : vendorSummary.length})
          </button>
        </div>
      </div>

      {/* 4 Dynamic Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <PremiumKpiCard 
          title="Filtered Trips" 
          value={loading ? "..." : filteredReports.length.toString()} 
          subtext={`${reports.length} Total in DB`}
          trend="neutral"
          icon={BarChart2}
          colorClass="from-blue-500 to-indigo-600"
        />
        <PremiumKpiCard 
          title="Gross Freight Revenue" 
          value={loading ? "..." : `₹${totals.revenue.toLocaleString('en-IN')}`} 
          subtext="Customer Booked Value"
          trend="up"
          icon={TrendingUp}
          colorClass="from-blue-600 to-blue-800"
        />
        <PremiumKpiCard 
          title="Direct Operating Costs" 
          value={loading ? "..." : `₹${totals.cost.toLocaleString('en-IN')}`} 
          subtext="Supplier + Fuel + Tolls"
          trend="down"
          icon={DollarSign}
          colorClass="from-amber-500 to-orange-600"
        />
        <PremiumKpiCard 
          title="Net Gross Margin" 
          value={loading ? "..." : `+₹${totals.margin.toLocaleString('en-IN')}`} 
          subtext={`+${totals.avgMarginPercent}% Net Rate`}
          trend="up"
          icon={Receipt}
          colorClass="from-emerald-500 to-emerald-700"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('trips')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'trips'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" /> Trip Profitability ({filteredReports.length})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'customers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Customer Billing Summary ({customerSummary.length})
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'vendors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" /> Vendor Settlement Summary ({vendorSummary.length})
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search trip, customer, route, vendor, vehicle, material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-slate-700"
          >
            <option value="all">All Dates</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_30">Last 30 Days</option>
            <option value="last_90">Last 90 Days</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-slate-700"
          >
            <option value="all">All Trip Statuses</option>
            <option value="completed">Delivered / Closed</option>
            <option value="transit">In-Transit / Started</option>
            <option value="pending">Pending Assignment</option>
          </select>
        </div>

        {/* Billing Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
          <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select 
            value={billingFilter} 
            onChange={(e) => setBillingFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-slate-700"
          >
            <option value="all">All Billing</option>
            <option value="billed">Invoiced to Customer</option>
            <option value="unbilled">Unbilled Backlog</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* TAB 1: TRIP PROFITABILITY REPORT */}
      {activeTab === 'trips' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <ProtoTable headers={[
              "TRIP ID & DATE", 
              "CUSTOMER & MATERIAL", 
              "ROUTE JOURNEY", 
              "CARRIER & VEHICLE", 
              "CUSTOMER RATE", 
              "DIRECT COSTS BREAKDOWN", 
              "GROSS MARGIN", 
              "STATUS / BILLING"
            ]}>
              {loading ? (
                <tr>
                  <Td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 mb-3 animate-spin text-blue-600" />
                      <span className="text-sm font-bold">Compiling Trip Profitability Report...</span>
                    </div>
                  </Td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <Td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-200">
                        <FileSpreadsheet className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mb-1">
                        No report records found
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mb-3">
                        {hasActiveFilters ? "Try resetting the filters or searching with different keywords." : "No trip records are available to display."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ) : (
                filteredReports.map((r, idx) => {
                  const marginPct = r.customerRate > 0 ? ((r.margin / r.customerRate) * 100).toFixed(1) : "0";
                  const isProfitable = r.margin >= 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 text-xs">
                      {/* Trip ID & Date */}
                      <Td>
                        <div className="font-mono font-bold text-slate-900">{r.tripId}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(r.date).toLocaleDateString()}
                        </div>
                      </Td>

                      {/* Customer & Material */}
                      <Td>
                        <div className="font-bold text-slate-800 max-w-[170px] truncate" title={r.customerName}>
                          {r.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {r.material || "General Freight"} • {r.weight || 0}t
                        </div>
                      </Td>

                      {/* Route Journey */}
                      <Td>
                        <div className="min-w-[180px] max-w-[220px]">
                          <div className="flex items-center gap-1 font-semibold text-slate-800 truncate">
                            <span>{r.source}</span>
                            <span className="text-slate-300">→</span>
                            <span>{r.destination}</span>
                          </div>
                          {r.warehouseLocation && (
                            <div className="mt-0.5">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                Hub: {r.warehouseLocation}
                              </span>
                            </div>
                          )}
                        </div>
                      </Td>

                      {/* Carrier & Vehicle */}
                      <Td>
                        <div className="font-semibold text-slate-800 max-w-[140px] truncate" title={r.vendorName}>
                          {r.vendorName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {r.vehicle}
                        </div>
                      </Td>

                      {/* Customer Rate */}
                      <Td>
                        <span className="font-bold text-blue-700 text-sm">
                          ₹{(r.customerRate || 0).toLocaleString('en-IN')}
                        </span>
                      </Td>

                      {/* Direct Costs Breakdown */}
                      <Td>
                        <div className="space-y-0.5 min-w-[150px]">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Supplier:</span>
                            <span className="font-semibold text-slate-700">₹{(r.supplierRate || 0).toLocaleString('en-IN')}</span>
                          </div>
                          {r.fuelAdvance > 0 && (
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Fuel:</span>
                              <span>₹{(r.fuelAdvance || 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {r.tollCharges > 0 && (
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Toll:</span>
                              <span>₹{(r.tollCharges || 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {r.extraCharges > 0 && (
                            <div className="flex justify-between text-[11px] text-amber-600">
                              <span>Extra:</span>
                              <span className="font-bold">₹{(r.extraCharges || 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[11px] font-bold pt-1 border-t border-slate-100 text-slate-800">
                            <span>Total Cost:</span>
                            <span>₹{(r.totalCost || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </Td>

                      {/* Gross Margin */}
                      <Td>
                        <div>
                          <span className={`font-black text-sm block ${isProfitable ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isProfitable ? '+' : ''}₹{(r.margin || 0).toLocaleString('en-IN')}
                          </span>
                          <span className={`text-[10.5px] font-bold inline-block mt-0.5 px-1.5 py-0.2 rounded border ${isProfitable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {marginPct}% margin
                          </span>
                        </div>
                      </Td>

                      {/* Status / Billing */}
                      <Td>
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.status === "Closed" || r.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            r.status === "Assigned" || r.status === "InTransit" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {r.status}
                          </span>

                          <div>
                            {r.isBilled ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                <Receipt className="w-2.5 h-2.5" /> {r.invoiceNumber || "Invoiced"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Unbilled
                              </span>
                            )}
                          </div>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </ProtoTable>
          </div>

          {/* Table Summary Footer */}
          {filteredReports.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-4">
                <span>Filtered Results: <strong className="text-slate-900">{filteredReports.length} Trips</strong></span>
                <span className="text-slate-300">|</span>
                <span>Avg Margin: <strong className="text-emerald-700">+{totals.avgMarginPercent}%</strong></span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-500 font-medium mr-1">Total Revenue:</span>
                  <span className="text-blue-700 font-black text-sm">₹{totals.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium mr-1">Total Cost:</span>
                  <span className="text-slate-900 font-black text-sm">₹{totals.cost.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium mr-1">Net Margin:</span>
                  <span className="text-emerald-700 font-black text-sm">+₹{totals.margin.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER BILLING SUMMARY */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <ProtoTable headers={[
              "CUSTOMER NAME", 
              "TOTAL TRIPS", 
              "GROSS FREIGHT REVENUE", 
              "DIRECT TRIP COSTS", 
              "NET PROFIT MARGIN", 
              "AVERAGE MARGIN %", 
              "BILLING STATUS"
            ]}>
              {customerSummary.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="text-center py-16 text-slate-400">
                    No customer data found for this filter.
                  </Td>
                </tr>
              ) : (
                customerSummary.map((c: any, idx: number) => {
                  const marginPct = c.revenue > 0 ? ((c.margin / c.revenue) * 100).toFixed(1) : "0";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 text-xs">
                      <Td className="font-bold text-slate-800 text-sm">
                        {c.name}
                      </Td>
                      <Td className="font-bold text-slate-700">
                        {c.tripCount} Trips
                      </Td>
                      <Td className="font-bold text-blue-700 text-sm">
                        ₹{c.revenue.toLocaleString('en-IN')}
                      </Td>
                      <Td className="font-semibold text-slate-700">
                        ₹{c.cost.toLocaleString('en-IN')}
                      </Td>
                      <Td className="font-black text-emerald-700 text-sm">
                        +₹{c.margin.toLocaleString('en-IN')}
                      </Td>
                      <Td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{marginPct}%
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {c.billedCount} Invoiced
                          </span>
                          {c.unbilledCount > 0 && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {c.unbilledCount} Unbilled
                            </span>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </ProtoTable>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR SETTLEMENT SUMMARY */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <ProtoTable headers={[
              "VENDOR / CARRIER NAME", 
              "TOTAL TRIPS HANDLED", 
              "TOTAL FREIGHT PAYABLES", 
              "FUEL & TOLL EXPENSES", 
              "SETTLED TRIPS", 
              "PENDING SETTLEMENT"
            ]}>
              {vendorSummary.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center py-16 text-slate-400">
                    No vendor data found for this filter.
                  </Td>
                </tr>
              ) : (
                vendorSummary.map((v: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 text-xs">
                    <Td className="font-bold text-slate-800 text-sm">
                      {v.name}
                    </Td>
                    <Td className="font-bold text-slate-700">
                      {v.tripCount} Trips
                    </Td>
                    <Td className="font-bold text-slate-900 text-sm">
                      ₹{v.totalCost.toLocaleString('en-IN')}
                    </Td>
                    <Td className="font-semibold text-slate-600">
                      ₹{v.fuelTolls.toLocaleString('en-IN')}
                    </Td>
                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {v.settledCount} Settled
                      </span>
                    </Td>
                    <Td>
                      {v.pendingSettlementCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200">
                          {v.pendingSettlementCount} Pending
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">All Clear</span>
                      )}
                    </Td>
                  </tr>
                ))
              )}
            </ProtoTable>
          </div>
        </div>
      )}

    </div>
  );
}
