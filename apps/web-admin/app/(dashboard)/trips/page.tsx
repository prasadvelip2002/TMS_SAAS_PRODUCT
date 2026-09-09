"use client";

import { useEffect, useState } from "react";
import { getIndents, getTrips, fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge, RouteTrack } from "@/components/PrototypeUI";
import { IndentForm } from "@/components/IndentForm";
import { TripAssignmentForm } from "@/components/TripAssignmentForm";
import { MapPin, X, Activity, FileText, Truck, Grid, List, Plus, Search } from "lucide-react";
import Link from "next/link";
import { formatTime12H } from "@/lib/utils";

function SlideOver({ isOpen, onClose, title, subtitle, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
         {/* Form Header */}
         <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div>
             <h3 className="font-bold text-lg text-slate-900 tracking-tight">{title}</h3>
             {subtitle && <p className="text-[13px] font-medium text-slate-500 mt-0.5">{subtitle}</p>}
           </div>
           <button 
             onClick={onClose} 
             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
         </div>
         
         {/* Form Body - Scrollable */}
         <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
           {children}
         </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [assigningIndent, setAssigningIndent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'indents' | 'trips'>('indents');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const [ind, trp] = await Promise.all([getIndents(), getTrips()]);
      setIndents(ind);
      setTrips(trp);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingIndents = indents.filter(i => i.status !== 'Assigned');

  const filteredPendingIndents = pendingIndents.filter(i => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      `ind-${1000 + i.id}`.toLowerCase().includes(q) ||
      i.id.toString().includes(q) ||
      i.customer?.name?.toLowerCase().includes(q) ||
      i.source?.toLowerCase().includes(q) ||
      i.destination?.toLowerCase().includes(q) ||
      i.warehouseLocation?.toLowerCase().includes(q) ||
      i.material?.toLowerCase().includes(q) ||
      i.vehicleType?.toLowerCase().includes(q) ||
      i.status?.toLowerCase().includes(q)
    );
  });

  const filteredTrips = trips.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      `trp-${1000 + t.id}`.toLowerCase().includes(q) ||
      t.id.toString().includes(q) ||
      t.indent?.customer?.name?.toLowerCase().includes(q) ||
      t.indent?.source?.toLowerCase().includes(q) ||
      t.indent?.destination?.toLowerCase().includes(q) ||
      t.indent?.warehouseLocation?.toLowerCase().includes(q) ||
      t.vehicle?.vehicleNumber?.toLowerCase().includes(q) ||
      t.driver?.name?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q) ||
      t.lrNumber?.toLowerCase().includes(q) ||
      t.vendor?.name?.toLowerCase().includes(q)
    );
  });

  const TRIP_STAGES = ['Indent', 'Confirmed', 'Assigned', 'Started', 'Delivered', 'POD', 'Approved', 'Closed'];

  const isFleetAssigned = (trip: any) => {
    return Boolean(trip.vehicleId && trip.driverId);
  };

  const getEffectiveStatus = (trip: any) => {
    if (trip.invoice?.status === 'Paid') return 'Paid';
    if (!isFleetAssigned(trip) && (trip.status === 'Pending Assignment' || trip.status === 'Assigned')) {
      return 'Pending Assignment';
    }
    return trip.status;
  };

  const getStageIdx = (trip: any) => {
    if (trip.invoice?.status === 'Paid') return 7;
    if (!trip.vendorId && (trip.status === 'Closed' || trip.status === 'Approved')) return 7;
    if (!isFleetAssigned(trip)) return 1; // Confirmed / Awaiting Fleet Assignment
    const map: Record<string, number> = {
      'Pending Assignment': 1, 'Assigned': 2, 'Started': 3, 'Delivered': 4, 'POD_Uploaded': 5, 'Closed': 7, 'Approved': 6
    };
    return map[trip.status] ?? 2;
  };

  const getBadgeColor = (status: string) => {
    const map: Record<string, 'blue' | 'orange' | 'green' | 'red' | 'grey'> = {
      'Pending Assignment': 'orange', 'Assigned': 'blue', 'Started': 'blue', 'Delivered': 'orange', 'POD_Uploaded': 'blue', 'Closed': 'green', 'Approved': 'green', 'Paid': 'green'
    };
    return map[status] ?? 'grey';
  };

  const handleCreateOutboundLeg = async (tripId: number) => {
    if (!confirm("Generate a next leg for this Trip?")) return;
    try {
      await fetchApi(`/Trips/${tripId}/create-outbound-leg`, { method: "POST" });
      loadData();
    } catch (e) {
      console.error(e);
      alert("Failed to create outbound leg");
    }
  };

    const handleUpdateStatus = async (tripId: number, newStatus: string) => {
    if (!confirm(`Are you sure you want to manually update this trip to ${newStatus}?`)) return;
    try {
      await fetchApi(`/Trips/${tripId}/Status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to update status");
    }
  };

  const handleGenerateLR = async (tripId: number) => {
    if (!confirm("Generate a new Lorry Receipt (LR) for this trip?")) return;
    try {
      await fetchApi(`/Trips/${tripId}/generate-lr`, { method: "POST" });
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Failed to generate LR");
    }
  };

  const getLegBadge = (legType: string, serviceScope?: string) => {
    if (legType === "InboundLeg1" || serviceScope === "SourceToHub") return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider ml-2">Leg 1</span>;
    if (legType === "OutboundLeg2") return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase tracking-wider ml-2">Leg 2</span>;
    if (legType === "EntireRoute" || serviceScope === "EntireRoute") return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-wider ml-2">Full Route</span>;
    return null;
  };

  const canAddOutboundLeg = (trip: any) => {
    // ONLY available if intermediate Hub was selected on the indent!
    if (!trip.indent?.warehouseLocation) return false;
    // If the trip is OutboundLeg2 or EntireRoute, do not add next leg!
    if (trip.legType === "OutboundLeg2" || trip.legType === "EntireRoute" || trip.serviceScope === "EntireRoute") return false;
    // If an outbound leg already exists, do not add another
    const hasOutbound = trips.some(t => t.parentTripId === trip.id || (t.indentId === trip.indentId && t.legType === "OutboundLeg2"));
    if (hasOutbound) return false;

    // Show only when the vendor quoted SourceToHub (or trip is InboundLeg1)
    return trip.legType === "InboundLeg1" || trip.serviceScope === "SourceToHub";
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-6 h-full flex flex-col w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trip & Indent Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor pending indents and track active trips in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'indents' ? "Search indents, customer, route..." : "Search trips, vehicle, driver, route..."}
              className="w-[280px] h-[40px] bg-white border border-slate-200 rounded-xl pl-9 pr-8 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm ring-1 ring-slate-200/50 p-1.5">
            <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Grid className="w-4 h-4" /> Grid
            </button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <List className="w-4 h-4" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('indents')}
          className={`font-semibold text-[14px] pb-3 border-b-2 transition-colors ${activeTab === 'indents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pending Indents
          <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'indents' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{pendingIndents.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('trips')}
          className={`font-semibold text-[14px] pb-3 border-b-2 transition-colors ${activeTab === 'trips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Active Trips
          <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'trips' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{trips.length}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Activity className="animate-spin text-blue-600 w-8 h-8" />
        </div>
      ) : activeTab === 'indents' ? (
        viewMode === 'list' ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setIsIndentModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-all text-[13px]"
              >
                + Create Indent
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <ProtoTable headers={["INDENT #", "CUSTOMER", "ROUTE", "MATERIAL", "DATE", "STATUS", "ACTIONS"]}>
                {filteredPendingIndents.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="p-0 hover:bg-transparent">
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {searchQuery ? "No matching indents found" : "No pending indents"}
                      </h3>
                      <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">
                        {searchQuery ? `No indents matched "${searchQuery}". Try a different search.` : "All indents have been assigned to trips, or no indents exist."}
                      </p>
                    </div>
                  </Td>
                </tr>
              ) : (
                filteredPendingIndents.map(indent => (
                  <tr key={indent.id} className="hover:bg-slate-50 transition-colors">
                    <Td className="font-mono font-semibold text-[12.5px]">IND-{1000 + indent.id}</Td>
                    <Td>{indent.customer?.name}</Td>
                    <Td className="text-[12px]">
                      {indent.warehouseLocation ? (
                        <div className="flex items-center gap-1.5 flex-wrap font-medium text-slate-700">
                          <span>{indent.source}</span>
                          <span className="text-slate-300">→</span>
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {indent.warehouseLocation} (Hub)
                          </span>
                          <span className="text-slate-300">→</span>
                          <span>{indent.destination}</span>
                        </div>
                      ) : (
                        <span>{indent.source} &rarr; {indent.destination}</span>
                      )}
                    </Td>
                    <Td className="text-[12px]">{indent.material} ({indent.weight}t)</Td>
                    <Td className="text-[12px] whitespace-nowrap">
                      {new Date(indent.loadingDate).toLocaleDateString()}
                      {indent.loadingTime ? ` @ ${formatTime12H(indent.loadingTime)}` : ''}
                    </Td>
                    <Td><Badge color="orange">{indent.status}</Badge></Td>
                    <Td>
                      <button 
                        onClick={() => setAssigningIndent(indent)}
                        className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition-all text-[12px]"
                      >
                        Assign Trip
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </ProtoTable>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setIsIndentModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Indent
              </button>
            </div>
            
            {filteredPendingIndents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {searchQuery ? "No matching indents found" : "No pending indents"}
                </h3>
                <p className="text-slate-500 text-[14.5px] max-w-sm">
                  {searchQuery ? `No indents matched "${searchQuery}". Try a different search.` : "All indents have been assigned to trips, or no indents exist."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPendingIndents.map(indent => (
                  <div key={indent.id} className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Ticket Header */}
                    <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-slate-900 text-sm">IND-{1000 + indent.id}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">{indent.customer?.name}</div>
                        </div>
                      </div>
                      <Badge color="orange">{indent.status}</Badge>
                    </div>
                    
                    {/* Ticket Route Journey */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 relative">
                      <div className="relative pl-6 space-y-2.5">
                        {/* Vertical Connecting Line */}
                        <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[1.5px] border-l-2 border-dashed border-slate-300 pointer-events-none" />

                        {/* Origin */}
                        <div className="relative flex items-center gap-2 min-w-0">
                          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-blue-600 bg-white shadow-2xs z-10 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Origin / Source</div>
                            <div className="font-bold text-slate-800 text-[13.5px] truncate mt-0.5" title={indent.source}>
                              {indent.source}
                            </div>
                          </div>
                        </div>

                        {/* Warehouse / Transit Hub (if any) */}
                        {indent.warehouseLocation && (
                          <div className="relative flex items-center gap-1.5 min-w-0 py-0.5">
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-amber-500 bg-amber-100 shadow-2xs z-10" />
                            <span className="text-[10.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md truncate">
                              Transit via {indent.warehouseLocation} (Hub)
                            </span>
                          </div>
                        )}

                        {/* Destination */}
                        <div className="relative flex items-center gap-2 min-w-0">
                          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-emerald-600 bg-emerald-500 shadow-2xs z-10 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Destination</div>
                            <div className="font-bold text-slate-800 text-[13.5px] truncate mt-0.5" title={indent.destination}>
                              {indent.destination}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ticket Details */}
                    <div className="px-5 py-4 bg-slate-50/30 flex-1 grid grid-cols-2 gap-y-4 gap-x-2">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</div>
                        <div className="font-medium text-slate-700 text-sm">{indent.material}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                        <div className="font-medium text-slate-700 text-sm">{indent.weight} Tons</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Loading Date & Time</div>
                        <div className="font-medium text-slate-700 text-sm">
                          {new Date(indent.loadingDate).toLocaleDateString()} {indent.loadingTime ? `@ ${formatTime12H(indent.loadingTime)}` : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</div>
                        <div className="font-medium text-slate-700 text-sm">{indent.truckType}</div>
                      </div>
                    </div>
                    
                    {/* Ticket Action */}
                    <div className="p-4 bg-white border-t border-slate-100">
                      <button 
                        onClick={() => setAssigningIndent(indent)}
                        className="w-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Assign Trip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        viewMode === 'list' ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="overflow-auto flex-1">
              <ProtoTable headers={["TRIP ID", "ROUTE", "VEHICLE", "DRIVER", "PROGRESS", "STATUS", "ACTIONS"]}>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="p-0 hover:bg-transparent">
                      <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                          <Truck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {searchQuery ? "No matching trips found" : "No active trips"}
                        </h3>
                        <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">
                          {searchQuery ? `No trips matched "${searchQuery}". Try a different search.` : "There are no trips currently active in the system."}
                        </p>
                      </div>
                    </Td>
                  </tr>
                ) : (
                  filteredTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <Td className="font-mono font-semibold text-[12.5px]">
                        TRP-{1000 + trip.id}
                        {getLegBadge(trip.legType, trip.serviceScope)}
                      </Td>
                      <Td className="text-[12px]">
                        {trip.indent?.warehouseLocation ? (
                          <div className="flex flex-col gap-1">
                            {/* Prominently show ALL locations: Source -> Hub (Hub) -> Destination */}
                            <div className="flex items-center gap-1.5 flex-wrap font-semibold text-slate-900 text-[12.5px]">
                              <span>{trip.indent?.source}</span>
                              <span className="text-slate-400">→</span>
                              <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                                {trip.indent?.warehouseLocation} (Hub)
                              </span>
                              <span className="text-slate-400">→</span>
                              <span>{trip.indent?.destination}</span>
                            </div>
                            {/* Clear Leg / Vendor Quoted Coverage Badge */}
                            <div>
                              {trip.legType === 'InboundLeg1' || trip.serviceScope === 'SourceToHub' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  📍 Leg 1: {trip.indent?.source} → {trip.indent?.warehouseLocation} (Hub)
                                </span>
                              ) : trip.legType === 'OutboundLeg2' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  📍 Leg 2: {trip.indent?.warehouseLocation} (Hub) → {trip.indent?.destination}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🛣️ Entire Route: {trip.indent?.source} → {trip.indent?.destination}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium text-slate-800">{trip.indent?.source} &rarr; {trip.indent?.destination}</span>
                        )}
                      </Td>
                      <Td className="text-[12px] font-mono">{trip.vehicle?.vehicleNumber || "—"}</Td>
                      <Td className="text-[12px]">{trip.driver?.name || "—"}</Td>
                      <Td className="w-[200px]">
                        <RouteTrack stages={TRIP_STAGES} currentIdx={getStageIdx(trip)} />
                      </Td>
                      <Td>
                        <Badge color={getBadgeColor(getEffectiveStatus(trip))}>
                          {getEffectiveStatus(trip)}
                        </Badge>
                      </Td>
                      <Td className="flex gap-2 items-center flex-wrap">
                        {isFleetAssigned(trip) && trip.status === "Assigned" && !trip.lrNumber && (
                          <button 
                            onClick={() => handleGenerateLR(trip.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors"
                          >
                            Generate LR
                          </button>
                        )}
                        {isFleetAssigned(trip) && trip.status === "Assigned" && trip.lrNumber && (
                          <button 
                            onClick={() => handleUpdateStatus(trip.id, "Started")}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors"
                          >
                            Start Trip
                          </button>
                        )}
                        {(trip.status === "Started" || trip.status === "InTransit") && (
                          <button 
                            onClick={() => handleUpdateStatus(trip.id, "Delivered")}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {!isFleetAssigned(trip) && (
                          <Link href="/trips/assignment">
                            <button className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors">
                              Assign Fleet
                            </button>
                          </Link>
                        )}
                        {canAddOutboundLeg(trip) && (
                          <button 
                            onClick={() => handleCreateOutboundLeg(trip.id)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors"
                          >
                            + Dispatch from Hub (Leg 2)
                          </button>
                        )}
                        {trip.legType === "OutboundLeg2" && (
                          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">From TRP-{1000 + (trip.parentTripId || 0)}</span>
                        )}
                        <Link href={`/trips/${trip.id}/tracking`}>
                          <button className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors">
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        {trip.lrNumber && (
                          <a 
                            href={`/trips/${trip.id}/lr`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-[11.5px] font-bold uppercase tracking-wide transition-colors ml-2"
                          >
                            Print LR
                          </a>
                        )}
                      </Td>
                    </tr>
                  ))
                )}
              </ProtoTable>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            {filteredTrips.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {searchQuery ? "No matching trips found" : "No active trips"}
                </h3>
                <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">
                  {searchQuery ? `No trips matched "${searchQuery}". Try a different search.` : "There are no trips currently active in the system."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTrips.map(trip => (
                  <div key={trip.id} className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Ticket Header */}
                    <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            TRP-{1000 + trip.id}
                            {getLegBadge(trip.legType, trip.serviceScope)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {trip.vehicle?.vehicleNumber || 'No Vehicle'} • {trip.driver?.name || 'No Driver'}
                          </div>
                        </div>
                      </div>
                      <Badge color={getBadgeColor(getEffectiveStatus(trip))}>
                        {getEffectiveStatus(trip)}
                      </Badge>
                    </div>
                    
                    {/* Ticket Route */}
                    <div className="px-5 py-5 border-b border-slate-100 border-dashed relative">
                      {trip.indent?.warehouseLocation ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 flex-wrap font-semibold text-slate-800 text-xs">
                            <span>{trip.indent?.source}</span>
                            <span className="text-slate-300">→</span>
                            <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                              {trip.indent?.warehouseLocation} (Hub)
                            </span>
                            <span className="text-slate-300">→</span>
                            <span>{trip.indent?.destination}</span>
                          </div>
                          <div>
                            {trip.legType === 'InboundLeg1' || trip.serviceScope === 'SourceToHub' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                📍 Leg 1: {trip.indent?.source} → {trip.indent?.warehouseLocation} (Hub)
                              </span>
                            ) : trip.legType === 'OutboundLeg2' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                📍 Leg 2: {trip.indent?.warehouseLocation} (Hub) → {trip.indent?.destination}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🛣️ Entire Route: {trip.indent?.source} → {trip.indent?.destination}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source</div>
                            <div className="font-semibold text-slate-800 text-sm truncate">{trip.indent?.source || '—'}</div>
                          </div>
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <div className="w-8 h-px bg-slate-300"></div>
                            <Link href={`/trips/${trip.id}/tracking`}>
                              <button className="w-8 h-8 rounded-full border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50 flex items-center justify-center mx-1 bg-white shadow-sm z-10 transition-colors" title="Track Trip">
                                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                              </button>
                            </Link>
                            <div className="w-8 h-px bg-slate-300"></div>
                          </div>
                          <div className="flex-1 text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</div>
                            <div className="font-semibold text-slate-800 text-sm truncate">{trip.indent?.destination || '—'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Track */}
                    <div className="px-6 py-4 bg-slate-50/50">
                       <RouteTrack stages={TRIP_STAGES} currentIdx={getStageIdx(trip)} />
                    </div>
                    
                    {/* Ticket Actions */}
                    <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center flex-wrap">
                      {isFleetAssigned(trip) && trip.status === "Assigned" && !trip.lrNumber && (
                        <button 
                          onClick={() => handleGenerateLR(trip.id)}
                          className="flex-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold py-2.5 rounded-xl transition-all text-[13px]"
                        >
                          Generate LR
                        </button>
                      )}
                      {isFleetAssigned(trip) && trip.status === "Assigned" && trip.lrNumber && (
                        <button 
                          onClick={() => handleUpdateStatus(trip.id, "Started")}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold py-2.5 rounded-xl transition-all text-[13px]"
                        >
                          Start Trip
                        </button>
                      )}
                      {(trip.status === "Started" || trip.status === "InTransit") && (
                        <button 
                          onClick={() => handleUpdateStatus(trip.id, "Delivered")}
                          className="flex-1 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 font-bold py-2.5 rounded-xl transition-all text-[13px]"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {!isFleetAssigned(trip) && (
                        <Link href="/trips/assignment" className="flex-1">
                          <button className="w-full bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold py-2.5 rounded-xl transition-all text-[13px]">
                            Assign Fleet
                          </button>
                        </Link>
                      )}
                      {canAddOutboundLeg(trip) && (
                        <button 
                          onClick={() => handleCreateOutboundLeg(trip.id)}
                          className="flex-1 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 font-bold py-2.5 rounded-xl transition-all text-[13px]"
                        >
                          + Dispatch from Hub (Leg 2)
                        </button>
                      )}
                      {trip.lrNumber && (
                        <a 
                          href={`/trips/${trip.id}/lr`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all text-[13px] text-center"
                        >
                          Print LR
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Slide-overs */}
      <SlideOver 
        isOpen={isIndentModalOpen} 
        onClose={() => setIsIndentModalOpen(false)} 
        title="Create New Indent"
        subtitle="Log a new customer request"
      >
        <IndentForm onSuccess={() => { setIsIndentModalOpen(false); loadData(); }} />
      </SlideOver>
      
      <SlideOver 
        isOpen={!!assigningIndent} 
        onClose={() => setAssigningIndent(null)} 
        title="Assign Trip"
        subtitle={`Indent #IND-${assigningIndent ? 1000 + assigningIndent.id : ''}`}
      >
        {assigningIndent && (
          <TripAssignmentForm indent={assigningIndent} onSuccess={() => { setAssigningIndent(null); loadData(); }} />
        )}
      </SlideOver>
    </div>
  );
}
