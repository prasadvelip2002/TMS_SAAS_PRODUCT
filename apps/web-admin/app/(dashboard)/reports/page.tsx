"use client";

import { BarChart2, TrendingUp, Clock, AlertTriangle, FileSpreadsheet } from "lucide-react";

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
  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Analytics, performance metrics, and downloadable data exports.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <PremiumKpiCard 
          title="Total Trips" 
          value="1,245" 
          subtext="+15% vs last month"
          trend="up"
          icon={BarChart2}
          colorClass="from-blue-500 to-indigo-600"
        />
        <PremiumKpiCard 
          title="Total Revenue" 
          value="₹42.5L" 
          subtext="On track"
          trend="up"
          icon={TrendingUp}
          colorClass="from-emerald-400 to-emerald-600"
        />
        <PremiumKpiCard 
          title="On-time Delivery" 
          value="98%" 
          subtext="Target: 95%"
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
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">Detailed Reports</h3>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">Download tabular reports for deeper analysis</p>
          </div>
        </div>
        
        {/* Empty State */}
        <div className="p-20 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
             <FileSpreadsheet className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No reports generated</h3>
           <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">The report generation engine is currently being provisioned for your tenant.</p>
           <button 
             className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 font-medium px-6 py-3 rounded-xl transition-all shadow-sm"
           >
             Request Early Access
           </button>
        </div>
      </div>
    </div>
  );
}
