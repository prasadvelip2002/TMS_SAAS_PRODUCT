"use client";

import { useEffect, useState } from "react";
import { fetchApi, assignTrip } from "@/lib/api";
import { ProtoTable, Td, ProtoButton } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, X, Handshake, Box, Activity } from "lucide-react";
import { formatTime12H } from "@/lib/utils";

export default function AssignmentPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [selectedIndent, setSelectedIndent] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredIndents = indents.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.id?.toString().toLowerCase().includes(q) ||
      `ind-${1000 + item.indentId}`.toLowerCase().includes(q) ||
      (item.tripId ? `trp-${1000 + item.tripId}`.toLowerCase().includes(q) : false) ||
      item.customer?.name?.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q) ||
      item.destination?.toLowerCase().includes(q) ||
      item.warehouseLocation?.toLowerCase().includes(q) ||
      item.vehicleType?.toLowerCase().includes(q) ||
      item.material?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  });

  const [formData, setFormData] = useState({
    vendorId: "",
    vehicleId: "",
    driverId: "",
    bookingType: "Fixed",
    ratePerTon: "0",
    fixedRate: "0",
    advanceAmount: "0",
    supplierPaymentTo: "Vendor",
    startingKM: "",
    tripStartDate: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [indData, venData, vehData, drvData, tripsData] = await Promise.all([
        fetchApi("/Indents"),
        fetchApi("/Vendors"),
        fetchApi("/Vehicles"),
        fetchApi("/Drivers"),
        fetchApi("/Trips")
      ]);
      
      const indentsMap = (indData || []).reduce((acc: any, i: any) => {
        acc[i.id] = i;
        return acc;
      }, {});

      const items: any[] = [];

      // 1. Process Indents for Leg 1 (or Direct / EntireRoute)
      (indData || []).forEach((indent: any) => {
        const indentTrips = (tripsData || []).filter((t: any) => t.indentId === indent.id);
        const leg1Trip = indentTrips.find((t: any) => t.legType === "InboundLeg1" || (!t.legType && !t.parentTripId) || t.legType === "Direct" || t.legType === "EntireRoute");

        // Needs assignment if:
        // - Indent is New/Pending and no trip assigned yet, OR
        // - Leg 1 / EntireRoute trip exists but doesn't have vehicle or driver assigned
        if (!leg1Trip && (indent.status === "New" || indent.status === "Pending")) {
          items.push({
            id: `ind-${indent.id}-leg1`,
            indentId: indent.id,
            tripId: null,
            legType: indent.warehouseLocation ? "InboundLeg1" : "Direct",
            serviceScope: null,
            customer: indent.customer,
            source: indent.source,
            destination: indent.destination,
            finalDestination: indent.destination,
            warehouseLocation: indent.warehouseLocation,
            vehicleType: indent.vehicleType,
            weight: indent.weight,
            material: indent.material,
            loadingDate: indent.loadingDate,
            loadingTime: indent.loadingTime,
            status: "Pending Assignment",
            indent: indent,
            trip: null
          });
        } else if (leg1Trip && (!leg1Trip.vehicleId || !leg1Trip.driverId || leg1Trip.status === "Pending Assignment")) {
          items.push({
            id: `trip-${leg1Trip.id}`,
            indentId: indent.id,
            tripId: leg1Trip.id,
            legType: leg1Trip.legType || (indent.warehouseLocation ? (leg1Trip.serviceScope === "SourceToHub" ? "InboundLeg1" : "EntireRoute") : "Direct"),
            serviceScope: leg1Trip.serviceScope,
            customer: indent.customer,
            source: indent.source,
            destination: indent.destination,
            finalDestination: indent.destination,
            warehouseLocation: indent.warehouseLocation,
            vehicleType: indent.vehicleType,
            weight: indent.weight,
            material: indent.material,
            loadingDate: indent.loadingDate,
            loadingTime: indent.loadingTime,
            status: "Pending Assignment",
            indent: indent,
            trip: leg1Trip
          });
        }
      });

      // 2. Process Leg 2 (Outbound from Hub) trips that need vehicle & driver assignment
      (tripsData || []).forEach((trip: any) => {
        if (trip.legType === "OutboundLeg2" && (!trip.vehicleId || !trip.driverId || trip.status === "Pending Assignment")) {
          const indent = trip.indent || indentsMap[trip.indentId];
          items.push({
            id: `trip-${trip.id}-leg2`,
            indentId: trip.indentId,
            tripId: trip.id,
            legType: "OutboundLeg2",
            serviceScope: trip.serviceScope,
            customer: indent?.customer,
            source: indent?.source || trip.source,
            destination: indent?.destination || trip.destination,
            finalDestination: indent?.destination || trip.destination,
            warehouseLocation: indent?.warehouseLocation || trip.warehouseLocation,
            vehicleType: indent?.vehicleType || "Standard Truck",
            weight: indent?.weight || 0,
            material: indent?.material || "Cargo",
            loadingDate: trip.tripStartDate || indent?.loadingDate,
            loadingTime: indent?.loadingTime,
            status: "Pending Assignment",
            indent: indent,
            trip: trip
          });
        }
      });

      setIndents(items);
      setVendors(venData || []);
      setVehicles(vehData || []);
      setDrivers(drvData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignPanel = (item: any) => {
    setSelectedIndent(item);
    
    // If the item already has a partial trip, pre-fill the form
    if (item.trip) {
        const baseRate = item.trip.fixedRate || item.trip.supplierRate || item.trip.freightCharges || 0;
        const calculatedAdvance = baseRate * 0.9;
        
        setFormData({
          vendorId: item.trip.vendorId?.toString() || "",
          vehicleId: item.trip.vehicleId?.toString() || "",
          driverId: item.trip.driverId?.toString() || "",
          bookingType: (item.trip.bookingType === "Contract" ? "Fixed" : item.trip.bookingType) || "Fixed",
          ratePerTon: item.trip.ratePerTon?.toString() || "0",
          fixedRate: baseRate.toString(),
          advanceAmount: item.trip.advanceAmount > 0 ? item.trip.advanceAmount.toString() : calculatedAdvance.toString(),
          supplierPaymentTo: item.trip.supplierPaymentTo || "Vendor",
          startingKM: item.trip.startingKM?.toString() || "",
          tripStartDate: item.trip.tripStartDate ? new Date(item.trip.tripStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
    } else {
      // Reset form for fresh assignment
      setFormData({
        vendorId: "",
        vehicleId: "",
        driverId: "",
        bookingType: "Fixed",
        ratePerTon: "0",
        fixedRate: "0",
        advanceAmount: "0",
        supplierPaymentTo: "Vendor",
        startingKM: "",
        tripStartDate: new Date().toISOString().split('T')[0],
      });
    }
    
    setIsSidePanelOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndent) return;
    
    setIsSubmitting(true);
    
    // Auto-fill vendor if it's already assigned on the trip, or null if Own Fleet
    const existingVendorId = selectedIndent.trip?.vendorId || (formData.vendorId ? parseInt(formData.vendorId) : null);
    
    try {
      await assignTrip({
        tripId: selectedIndent.tripId,
        indentId: selectedIndent.indentId,
        vendorId: existingVendorId,
        vehicleId: parseInt(formData.vehicleId),
        driverId: parseInt(formData.driverId),
        bookingType: formData.bookingType,
        ratePerTon: parseFloat(formData.ratePerTon || "0"),
        fixedRate: parseFloat(formData.fixedRate || "0"),
        advanceAmount: parseFloat(formData.advanceAmount || "0"),
        supplierPaymentTo: formData.supplierPaymentTo,
        startingKM: formData.startingKM ? parseFloat(formData.startingKM) : null,
        tripStartDate: new Date(formData.tripStartDate).toISOString(),
      });
      setIsSidePanelOpen(false);
      setSelectedIndent(null);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to assign trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (!formData.vendorId) {
      return !v.vendorId;
    }
    return v.vendorId === parseInt(formData.vendorId);
  });

  const filteredDrivers = drivers.filter(d => {
    if (!formData.vendorId) {
      return !d.vendorId;
    }
    return d.vendorId === parseInt(formData.vendorId);
  });

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Trip Assignment</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Assign vehicles and drivers to pending indents</p>
        </div>
        
        <div className="flex items-center gap-[12px]">
          <div className="relative flex items-center">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search indents by ID, customer, route, vehicle..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[240px] md:w-[280px] h-[42px] bg-white border border-slate-200 rounded-[12px] pl-[40px] pr-[34px] text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-[12px] p-1 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-[8px] transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}><Grid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
            <ProtoTable headers={["INDENT ID", "CUSTOMER", "ROUTE", "REQ. TYPE", "STATUS", "ACTION"]}>
              {loading ? (
                <tr>
                  <Td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Handshake className="w-12 h-12 mb-3 text-slate-300 animate-pulse" />
                      <span className="text-[14px] font-medium">Loading Indents...</span>
                    </div>
                  </Td>
                </tr>
              ) : filteredIndents.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <Box className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                        {searchQuery ? "No matching indents found" : "No Pending Indents"}
                      </h3>
                      <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-4">
                        {searchQuery 
                          ? `No indents matched "${searchQuery}".` 
                          : "All indents have been assigned or there are no active indents requiring assignments right now."}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ) : (
                filteredIndents.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0" 
                  >
                    <Td className="font-mono text-[13px] font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.tripId ? `TRP-${1000 + item.tripId}` : `IND-${1000 + item.indentId}`}</span>
                        {item.warehouseLocation && (
                          <>
                            {(item.legType === "InboundLeg1" || item.serviceScope === "SourceToHub") && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold uppercase">Leg 1</span>
                            )}
                            {item.legType === "OutboundLeg2" && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-bold uppercase">Leg 2</span>
                            )}
                            {item.legType !== "InboundLeg1" && item.legType !== "OutboundLeg2" && item.serviceScope !== "SourceToHub" && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">Full Route</span>
                            )}
                          </>
                        )}
                      </div>
                    </Td>
                    <Td className="font-semibold text-slate-800">{item.customer?.name || "Unknown"}</Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        {/* All locations: Source -> Hub (Hub) -> Destination matching Screenshot 3 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-medium text-slate-700">{item.source}</span>
                          {item.warehouseLocation ? (
                            <>
                              <span className="text-slate-300">→</span>
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {item.warehouseLocation} (Hub)
                              </span>
                              <span className="text-slate-300">→</span>
                            </>
                          ) : (
                            <span className="text-slate-300">→</span>
                          )}
                          <span className="text-[13px] font-medium text-slate-700">{item.destination}</span>
                        </div>

                        {/* Leg assignment scope badge */}
                        {item.warehouseLocation && (
                          <div>
                            {item.legType === "InboundLeg1" || item.serviceScope === "SourceToHub" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                📍 Leg 1: {item.source} → {item.warehouseLocation} (Hub)
                              </span>
                            ) : item.legType === "OutboundLeg2" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                📍 Leg 2: {item.warehouseLocation} (Hub) → {item.destination}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🛣️ Entire Route: {item.source} → {item.destination}
                              </span>
                            )}
                          </div>
                        )}

                        {item.loadingDate && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Schedule: {new Date(item.loadingDate).toLocaleDateString()} {item.loadingTime ? `@ ${formatTime12H(item.loadingTime)}` : ''}
                          </div>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <div className="text-[13px] font-medium text-slate-800">{item.vehicleType}</div>
                      <div className="text-[11px] text-slate-500">{item.weight} Tons</div>
                    </Td>
                    <Td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        item.legType === 'OutboundLeg2'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : item.status === 'Assigned' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-sky-50 text-sky-700 border-sky-100'
                      }`}>
                        {item.legType === 'OutboundLeg2' ? 'Outbound Leg 2' : item.status === 'Assigned' ? 'Awaiting Fleet' : item.status}
                      </span>
                    </Td>
                    <Td>
                      <button 
                        onClick={() => openAssignPanel(item)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {item.legType === "OutboundLeg2" ? "Assign Leg 2" : "Assign Trip"}
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
          {loading ? (
            <div className="flex justify-center p-16">
              <Activity className="animate-spin text-blue-600 w-8 h-8" />
            </div>
          ) : filteredIndents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                <Box className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                {searchQuery ? "No matching indents found" : "No Pending Indents"}
              </h3>
              <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-4">
                {searchQuery 
                  ? `No indents matched "${searchQuery}".` 
                  : "All indents have been assigned or there are no active indents requiring assignments right now."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredIndents.map(item => (
                <div key={item.id} className="bg-white rounded-2xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  {/* Ticket Header */}
                  <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${item.legType === 'OutboundLeg2' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        <Handshake className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{item.tripId ? `TRP-${1000 + item.tripId}` : `IND-${1000 + item.indentId}`}</span>
                          {item.warehouseLocation && (
                            <>
                              {(item.legType === "InboundLeg1" || item.serviceScope === "SourceToHub") && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold uppercase">Leg 1</span>
                              )}
                              {item.legType === "OutboundLeg2" && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-bold uppercase">Leg 2</span>
                              )}
                              {item.legType !== "InboundLeg1" && item.legType !== "OutboundLeg2" && item.serviceScope !== "SourceToHub" && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold uppercase">Full Route</span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">{item.customer?.name || "Unknown"}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      item.legType === 'OutboundLeg2'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : item.status === 'Assigned' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-sky-50 text-sky-700 border-sky-100'
                    }`}>
                      {item.legType === 'OutboundLeg2' ? 'Outbound Leg 2' : item.status === 'Assigned' ? 'Awaiting Fleet' : item.status}
                    </span>
                  </div>
                  
                  {/* Ticket Route */}
                  <div className="px-5 py-5 border-b border-slate-100 border-dashed relative">
                    {item.warehouseLocation ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap font-semibold text-slate-800 text-xs">
                          <span>{item.source}</span>
                          <span className="text-slate-300">→</span>
                          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                            {item.warehouseLocation} (Hub)
                          </span>
                          <span className="text-slate-300">→</span>
                          <span>{item.destination}</span>
                        </div>
                        <div>
                          {item.legType === 'InboundLeg1' || item.serviceScope === 'SourceToHub' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              📍 Leg 1: {item.source} → {item.warehouseLocation} (Hub)
                            </span>
                          ) : item.legType === 'OutboundLeg2' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              📍 Leg 2: {item.warehouseLocation} (Hub) → {item.destination}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              🛣️ Entire Route: {item.source} → {item.destination}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source</div>
                          <div className="font-semibold text-slate-800 text-sm truncate" title={item.source}>{item.source}</div>
                        </div>
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <div className="w-8 h-px bg-slate-300"></div>
                          <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center mx-1 bg-white shadow-sm z-10">
                            <span className="text-[10px]">→</span>
                          </div>
                          <div className="w-8 h-px bg-slate-300"></div>
                        </div>
                        <div className="flex-1 text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</div>
                          <div className="font-semibold text-slate-800 text-sm truncate" title={item.destination}>{item.destination}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Ticket Details */}
                  <div className="px-5 py-4 bg-slate-50/30 flex-1 grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vehicle Type</div>
                      <div className="font-medium text-slate-700 text-[13px]">{item.vehicleType}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</div>
                      <div className="font-medium text-slate-700 text-[13px]">{item.weight} Tons</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule</div>
                      <div className="font-medium text-slate-700 text-[12px]">
                        {item.loadingDate ? `${new Date(item.loadingDate).toLocaleDateString()} ${item.loadingTime ? `@ ${formatTime12H(item.loadingTime)}` : ''}` : 'Not set'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</div>
                      <div className="font-medium text-slate-700 text-[13px] line-clamp-1">{item.material || 'Standard goods'}</div>
                    </div>
                  </div>
                  
                  {/* Ticket Action */}
                  <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                    <button 
                      onClick={() => openAssignPanel(item)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {item.legType === "OutboundLeg2" ? "Assign Leg 2 Fleet" : "Assign Trip"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SLIDE-OVER PANEL */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isSidePanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidePanelOpen(false)}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isSidePanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedIndent?.legType === "OutboundLeg2" ? "Assign Outbound Leg 2" : "Assign Trip"}
              </h2>
              {selectedIndent?.warehouseLocation && (
                <>
                  {(selectedIndent.legType === "InboundLeg1" || selectedIndent.serviceScope === "SourceToHub") && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">Leg 1 (To Hub)</span>
                  )}
                  {selectedIndent.legType === "OutboundLeg2" && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase">Leg 2 (To Dest)</span>
                  )}
                  {selectedIndent.legType !== "InboundLeg1" && selectedIndent.legType !== "OutboundLeg2" && selectedIndent.serviceScope !== "SourceToHub" && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Entire Route</span>
                  )}
                </>
              )}
            </div>
            <div className="text-[13px] text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
              {selectedIndent?.warehouseLocation ? (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  {selectedIndent.source} → <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10.5px]">{selectedIndent.warehouseLocation} (Hub)</span> → {selectedIndent.destination}
                </span>
              ) : (
                <span>{selectedIndent ? `${selectedIndent.source} → ${selectedIndent.destination}` : ""}</span>
              )}
              <span className="text-slate-400">•</span>
              <span>{selectedIndent?.weight}T</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidePanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="assign-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Fleet Details</h3>
              
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Fleet Vendor <span className="text-slate-400 font-normal">(Optional for Own Fleet)</span></label>
                <select 
                  value={formData.vendorId} 
                  onChange={e => {
                    const vId = e.target.value;
                    setFormData(prev => ({ ...prev, vendorId: vId, vehicleId: "", driverId: "" }));
                  }} 
                  disabled={!!selectedIndent?.trip?.vendorId} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                >
                  <option value="">No Vendor (Own Fleet)</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Vehicle</label>
                  <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <option value="">Select Vehicle</option>
                    {filteredVehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.capacity}T)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Driver</label>
                  <select required value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <option value="">Select Driver</option>
                    {filteredDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formData.vendorId && (
              <div className="space-y-4 pt-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Commercials & Tracking</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Booking Type</label>
                    <select value={formData.bookingType} onChange={e => setFormData({...formData, bookingType: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                      <option value="Fixed">Fixed Rate</option>
                      <option value="PerTon">Per Ton Rate</option>
                    </select>
                  </div>

                  <div>
                    {formData.bookingType === "Fixed" ? (
                      <>
                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Fixed Rate (₹) {!!selectedIndent?.trip?.vendorId && <span className="text-emerald-600 ml-1">(Agreed in RFQ)</span>}</label>
                        <input required type="number" disabled={!!selectedIndent?.trip?.vendorId} value={formData.fixedRate} 
                          onChange={e => {
                            const rate = parseFloat(e.target.value) || 0;
                            setFormData({...formData, fixedRate: e.target.value, advanceAmount: (rate * 0.9).toString()});
                          }} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                        />
                      </>
                    ) : (
                      <>
                        <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Rate Per Ton (₹)</label>
                        <input required type="number" value={formData.ratePerTon} 
                          onChange={e => {
                            const rate = parseFloat(e.target.value) || 0;
                            const weight = selectedIndent?.weight || 0;
                            setFormData({...formData, ratePerTon: e.target.value, advanceAmount: (rate * weight * 0.9).toString()});
                          }} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[13px] font-bold text-slate-700">Advance Amount (₹)</label>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">90% Policy Applied</span>
                    </div>
                    <input required type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Starting KM</label>
                    <input type="number" value={formData.startingKM} onChange={e => setFormData({...formData, startingKM: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Optional" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Advance Payee (Visible to payee in App)</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                    <button type="button" onClick={() => setFormData({...formData, supplierPaymentTo: "Vendor"})} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${formData.supplierPaymentTo === "Vendor" ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      Fleet Vendor
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, supplierPaymentTo: "Driver"})} className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${formData.supplierPaymentTo === "Driver" ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      Direct to Driver
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button 
            type="submit" 
            form="assign-form"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Assign & Create Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}
