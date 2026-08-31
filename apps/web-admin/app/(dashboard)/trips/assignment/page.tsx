"use client";

import { useEffect, useState } from "react";
import { fetchApi, assignTrip } from "@/lib/api";
import { ProtoTable, Td, ProtoButton } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, X, Handshake, Box } from "lucide-react";

export default function AssignmentPage() {
  const [indents, setIndents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedIndent, setSelectedIndent] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const [formData, setFormData] = useState({
    vendorId: "",
    vehicleId: "",
    driverId: "",
    bookingType: "Fixed",
    ratePerTon: "0",
    fixedRate: "0",
    advanceAmount: "0",
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
      
      const tripsByIndent = tripsData.reduce((acc: any, trip: any) => {
        acc[trip.indentId] = trip;
        return acc;
      }, {});

      setIndents(indData.map((i: any) => {
        i.trip = tripsByIndent[i.id];
        return i;
      }).filter((i: any) => {
        if (i.status === 'New' || i.status === 'Pending') return true;
        if (i.status === 'Assigned') {
           if (i.trip && (!i.trip.vehicleId || !i.trip.driverId)) return true;
        }
        return false;
      }));
      
      setVendors(venData);
      setVehicles(vehData);
      setDrivers(drvData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignPanel = (indent: any) => {
    setSelectedIndent(indent);
    
    // If the indent already has a partial trip (e.g., from RFQ), pre-fill the form
    if (indent.trip) {
      setFormData({
        vendorId: indent.trip.vendorId?.toString() || "",
        vehicleId: indent.trip.vehicleId?.toString() || "",
        driverId: indent.trip.driverId?.toString() || "",
        bookingType: indent.trip.bookingType || "Fixed",
        ratePerTon: indent.trip.ratePerTon?.toString() || "0",
        fixedRate: (indent.trip.fixedRate || indent.trip.supplierRate || 0).toString(),
        advanceAmount: indent.trip.advanceAmount?.toString() || "0",
        startingKM: indent.trip.startingKM?.toString() || "",
        tripStartDate: indent.trip.tripStartDate ? new Date(indent.trip.tripStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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
    
    // Auto-fill vendor if it's already assigned on the trip
    const existingVendorId = selectedIndent.vendorId || parseInt(formData.vendorId);
    
    try {
      await assignTrip({
        indentId: selectedIndent.id,
        vendorId: existingVendorId,
        vehicleId: parseInt(formData.vehicleId),
        driverId: parseInt(formData.driverId),
        bookingType: formData.bookingType,
        ratePerTon: parseFloat(formData.ratePerTon || "0"),
        fixedRate: parseFloat(formData.fixedRate || "0"),
        advanceAmount: parseFloat(formData.advanceAmount),
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

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Trip Assignment</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Assign vehicles and drivers to pending indents</p>
        </div>
        
        <div className="flex items-center gap-[12px]">
          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search indents..." 
              className="w-[240px] h-[42px] bg-white border border-slate-200 rounded-[12px] pl-[40px] pr-[14px] text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-[12px] p-1 shadow-sm">
            <button className="p-1.5 bg-slate-100 text-slate-800 rounded-[8px] shadow-sm"><List className="w-4 h-4" /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-[8px]"><Grid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* FULL WIDTH TABLE */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
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
            ) : indents.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Box className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Pending Indents</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      All indents have been assigned or there are no active indents requiring assignments right now.
                    </p>
                  </div>
                </Td>
              </tr>
            ) : (
              indents.map((indent) => (
                <tr 
                  key={indent.id} 
                  className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0" 
                >
                  <Td className="font-mono text-[13px] font-semibold text-slate-600">IND-{1000 + indent.id}</Td>
                  <Td className="font-semibold text-slate-800">{indent.customer?.name || "Unknown"}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-700">{indent.source}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-[13px] font-medium text-slate-700">{indent.destination}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-[13px] font-medium text-slate-800">{indent.vehicleType}</div>
                    <div className="text-[11px] text-slate-500">{indent.weight} Tons</div>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      indent.status === 'Assigned' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-sky-50 text-sky-700 border-sky-100'
                    }`}>
                      {indent.status === 'Assigned' ? 'Awaiting Fleet' : indent.status}
                    </span>
                  </Td>
                  <Td>
                    <button 
                      onClick={() => openAssignPanel(indent)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Assign Trip
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      </div>

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
            <h2 className="text-xl font-bold text-slate-800">Assign Trip</h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">
              {selectedIndent ? `IND-${1000 + selectedIndent.id} • ${selectedIndent.material} (${selectedIndent.weight}T)` : ""}
            </p>
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
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Fleet Vendor</label>
                <select required value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})} disabled={!!selectedIndent?.trip?.vendorId} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50">
                  <option value="">Select Fleet Vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Vehicle</label>
                  <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.capacity}T)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Driver</label>
                  <select required value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

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
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Fixed Rate (₹)</label>
                      <input required type="number" value={formData.fixedRate} onChange={e => setFormData({...formData, fixedRate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    </>
                  ) : (
                    <>
                      <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Rate Per Ton (₹)</label>
                      <input required type="number" value={formData.ratePerTon} onChange={e => setFormData({...formData, ratePerTon: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Advance Amount (₹)</label>
                  <input required type="number" value={formData.advanceAmount} onChange={e => setFormData({...formData, advanceAmount: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Starting KM</label>
                  <input type="number" value={formData.startingKM} onChange={e => setFormData({...formData, startingKM: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] bg-slate-50/50 text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Optional" />
                </div>
              </div>
            </div>
            
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
