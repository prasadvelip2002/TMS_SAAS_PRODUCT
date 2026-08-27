"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Truck, DollarSign, Activity, CheckCircle, Clock, MapPin, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeTrips: 0,
    deliveredTrips: 0,
    revenue: 0,
    activeVendors: 0
  });
  
  // Mock data (commented out for future use if needed)
  /*
  const revenueData = [
    { name: 'Jan', revenue: 400000 },
    { name: 'Feb', revenue: 300000 },
    { name: 'Mar', revenue: 550000 },
    { name: 'Apr', revenue: 480000 },
    { name: 'May', revenue: 620000 },
    { name: 'Jun', revenue: 750000 },
    { name: 'Jul', revenue: 980000 },
  ];
  const tripsData = [
    { name: 'Mon', trips: 12 },
    { name: 'Tue', trips: 19 },
    { name: 'Wed', trips: 15 },
    { name: 'Thu', trips: 22 },
    { name: 'Fri', trips: 28 },
    { name: 'Sat', trips: 10 },
    { name: 'Sun', trips: 5 },
  ];
  */

  // Current zeroed-out data
  const revenueData = [
    { name: 'Jan', revenue: 0 },
    { name: 'Feb', revenue: 0 },
    { name: 'Mar', revenue: 0 },
    { name: 'Apr', revenue: 0 },
    { name: 'May', revenue: 0 },
    { name: 'Jun', revenue: 0 },
    { name: 'Jul', revenue: 0 },
  ];

  const tripsData = [
    { name: 'Mon', trips: 0 },
    { name: 'Tue', trips: 0 },
    { name: 'Wed', trips: 0 },
    { name: 'Thu', trips: 0 },
    { name: 'Fri', trips: 0 },
    { name: 'Sat', trips: 0 },
    { name: 'Sun', trips: 0 },
  ];

  useEffect(() => {
    // In a real app we'd fetch this from a /Stats endpoint, but for the demo we'll fetch trips and calculate
    const loadStats = async () => {
      try {
        const trips = await fetchApi("/Trips");
        const active = trips.filter((t:any) => t.status === "Started" || t.status === "Assigned");
        const delivered = trips.filter((t:any) => t.status === "Delivered" || t.status === "Closed");
        
        let rev = 0;
        trips.forEach((t:any) => {
          if (t.freightCharges) rev += t.freightCharges;
        });

        setStats({
          activeTrips: active.length, // Mock fallback: active.length || 14
          deliveredTrips: delivered.length, // Mock fallback: delivered.length || 128
          revenue: rev, // Mock fallback: rev || 4250000
          activeVendors: 0 // Mock fallback: 42
        });
      } catch (e) {
        console.error(e);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Platform Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Live analytics and fleet status for Transitflow Logistics.</p>
        </div>
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-200">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          System Operational
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <KpiCard title="Active Trips" value={stats.activeTrips} icon={Truck} color="blue" trend="+12% this week" />
        <KpiCard title="Total Revenue (YTD)" value={`₹${(stats.revenue / 100000).toFixed(2)}L`} icon={DollarSign} color="green" trend="+24% vs last year" />
        <KpiCard title="Delivered Trips" value={stats.deliveredTrips} icon={CheckCircle} color="indigo" trend="98.5% on-time rate" />
        <KpiCard title="Active Vendors" value={stats.activeVendors} icon={Users} color="orange" trend="3 new this month" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-300 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Revenue Growth</h2>
              <p className="text-sm text-slate-500">Monthly gross freight revenue (INR)</p>
            </div>
            <div className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
              2026
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val/100000}L`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Volume Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-300 transition-all duration-300">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Weekly Trip Volume</h2>
            <p className="text-sm text-slate-500">Total indents processed</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripsData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="trips" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Map Teaser / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link href="/map" className="bg-slate-900 rounded-3xl overflow-hidden shadow-lg relative group cursor-pointer transition-transform hover:-translate-y-1 block">
          <div className="absolute inset-0 opacity-40 bg-[url('https://maps.wikimedia.org/osm-intl/6/45/28.png')] bg-cover bg-center mix-blend-luminosity grayscale group-hover:grayscale-0 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
          <div className="relative p-8 h-full flex flex-col justify-end min-h-[250px]">
            <div className="bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-max mb-3">Live Fleet GPS</div>
            <h3 className="text-2xl font-bold text-white mb-2">Track Vehicles in Real-Time</h3>
            <p className="text-slate-400 text-sm mb-4">View map integrations, milestone tracking, and delay alerts for all active trips.</p>
            <div className="flex items-center text-blue-400 font-bold text-sm group-hover:text-blue-300">
              Open Map View <TrendingUp className="w-4 h-4 ml-2" />
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-300 transition-all duration-300">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-5">
            <ActivityRow icon={CheckCircle} title="POD Verified for TRP-104" time="10 mins ago" color="green" />
            <ActivityRow icon={DollarSign} title="Invoice INV-2026-F9A2 Generated" time="1 hour ago" color="blue" />
            <ActivityRow icon={MapPin} title="Vehicle MH-04-1234 reached Checkpoint" time="2 hours ago" color="orange" />
            <ActivityRow icon={Truck} title="New RFQ assigned to VRL Logistics" time="3 hours ago" color="indigo" />
          </div>
        </div>
      </div>

    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, trend }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    orange: "bg-blue-50 text-blue-700 border-blue-100",
  };

  const glowMap: any = {
    blue: "from-blue-500/20",
    green: "from-green-500/20",
    indigo: "from-indigo-500/20",
    orange: "from-blue-600/20",
  };

  return (
    <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default overflow-hidden">
      {/* Premium Corner Glow Effect on Hover */}
      <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-bl ${glowMap[color]} to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${colorMap[color]} shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-semibold mb-1">{title}</h3>
        <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
        <div className="text-xs font-bold text-slate-400 mt-2">{trend}</div>
      </div>
    </div>
  );
}

function ActivityRow({ icon: Icon, title, time, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-blue-100 text-blue-700",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  return (
    <div className="flex gap-4 items-center">
      <div className={`w-10 h-10 rounded-full flex justify-center items-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-700">{title}</p>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}
