"use client";

import { BarChart2, TrendingUp, Clock, AlertTriangle, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";

function PremiumKpiCard({ title, value, subtext, trend, icon: Icon, colorClass }: any) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/50 relative overflow-hidden group hover:shadow-md transition-all`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass} opacity-10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} text-white shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
          {subtext}
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
        <div className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mt-1">{title}</div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/Reports/trips")
      .then(data => setReports(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const downloadCSV = () => {
    if (reports.length === 0) return;
    const headers = ["Trip ID", "Date", "Customer", "Route", "Vendor", "Selling Price", "Supplier Cost", "Fuel", "Toll", "Extra Charges", "Total Cost", "Gross Margin", "Status"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + reports.map(r => 
          `${r.tripId},${new Date(r.date).toLocaleDateString()},"${r.customerName}","${r.source} to ${r.destination}","${r.vendorName}",${r.customerRate},${r.supplierRate},${r.fuelAdvance},${r.tollCharges},${r.extraCharges || 0},${r.totalCost || (r.supplierRate + r.fuelAdvance + r.tollCharges + (r.extraCharges || 0))},${r.margin},${r.status}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trip_profitability_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = reports.reduce((acc, curr) => acc + (curr.customerRate || 0), 0);
  const totalMargin = reports.reduce((acc, curr) => acc + (curr.margin || 0), 0);

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports & Profitability</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Analytics, financial metrics, and downloadable data exports.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <PremiumKpiCard 
          title="Total Trips" 
          value={loading ? "..." : reports.length.toString()} 
          subtext="Active & Completed"
          trend="up"
          icon={BarChart2}
          colorClass="from-blue-500 to-indigo-600"
        />
        <PremiumKpiCard 
          title="Total Revenue" 
          value={loading ? "..." : `₹${totalRevenue.toLocaleString('en-IN')}`} 
          subtext="Gross Billed"
          trend="up"
          icon={TrendingUp}
          colorClass="from-emerald-400 to-emerald-600"
        />
        <PremiumKpiCard 
          title="Gross Margin" 
          value={loading ? "..." : `₹${totalMargin.toLocaleString('en-IN')}`} 
          subtext={`${((totalMargin / (totalRevenue || 1)) * 100).toFixed(1)}% Avg Margin`}
          trend="up"
          icon={Clock}
          colorClass="from-amber-400 to-orange-500"
        />
        <PremiumKpiCard 
          title="Delayed Trips" 
          value="12" 
          subtext="Needs attention"
          trend="down"
          icon={AlertTriangle}
          colorClass="from-red-400 to-rose-600"
        />
      </div>

      {/* Reports Table Area */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden flex flex-col h-[500px]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Trip Profitability Report</h3>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">Detailed breakdown of customer billing vs supplier costs</p>
          </div>
          <button 
            onClick={downloadCSV}
            disabled={reports.length === 0}
            className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl hover:bg-slate-50 transition-all text-[13px] flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          <ProtoTable headers={["TRIP ID / DATE", "ROUTE & CUSTOMER", "VENDOR", "SELLING PRICE", "COSTS BREAKDOWN", "GROSS MARGIN", "STATUS"]}>
            {loading ? (
              <tr>
                <Td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Generating Report...</span>
                  </div>
                </Td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <Td colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 border border-slate-200">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No trips found</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">There are no trips to report on yet.</p>
                  </div>
                </Td>
              </tr>
            ) : (
              reports.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  <Td>
                    <div className="font-mono text-[13px] font-bold text-slate-700">{r.tripId}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{new Date(r.date).toLocaleDateString()}</div>
                  </Td>
                  <Td>
                    <div className="font-semibold text-slate-800 max-w-[200px] truncate">{r.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] mt-0.5">
                      {r.source} → {r.destination}
                    </div>
                  </Td>
                  <Td>
                    <div className="font-semibold text-slate-800 max-w-[150px] truncate">{r.vendorName}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">{r.vehicle}</div>
                  </Td>
                  <Td>
                    <span className="font-bold text-blue-700 text-[14px]">₹{(r.customerRate || 0).toLocaleString('en-IN')}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5 min-w-[160px]">
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-slate-500">Supplier:</span>
                        <span className="font-bold text-slate-700">₹{(r.supplierRate || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {(r.fuelAdvance > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Fuel:</span>
                          <span className="font-medium text-slate-600">₹{(r.fuelAdvance || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {(r.tollCharges > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Toll:</span>
                          <span className="font-medium text-slate-600">₹{(r.tollCharges || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {(r.extraCharges > 0) && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-amber-600 font-medium">Extra Charges:</span>
                          <span className="font-bold text-amber-700">₹{(r.extraCharges || 0).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[11.5px] pt-1 mt-0.5 border-t border-slate-100 font-bold">
                        <span className="text-slate-600">Total Cost:</span>
                        <span className="text-slate-900">₹{(r.totalCost || (r.supplierRate + r.fuelAdvance + r.tollCharges + (r.extraCharges || 0))).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <span className={`font-black text-[15px] block ${r.margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {r.margin >= 0 ? '+' : ''}₹{(r.margin || 0).toLocaleString('en-IN')}
                      </span>
                      {r.customerRate > 0 && (
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          {((r.margin / r.customerRate) * 100).toFixed(1)}% margin
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge color={
                      r.status === "Closed" || r.status === "Delivered" ? "green" :
                      r.status === "Assigned" ? "blue" : "grey"
                    }>
                      {r.status}
                    </Badge>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      </div>
    </div>
  );
}
