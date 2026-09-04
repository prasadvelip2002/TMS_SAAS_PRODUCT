"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { Loader2, DollarSign, Wallet, CheckCircle, Search, Grid, List, X, Handshake, Printer, FileText } from "lucide-react";
import Link from "next/link";

export default function VendorSettlementDashboard() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"Pending" | "Settled" | "All">("Pending");
  
  // Settlement Panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/Finance/vendor-settlements");
      setTrips(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openPanel = (trip: any) => {
    setSelectedTrip(trip);
    setUtr("");
    setIsPanelOpen(true);
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr) return alert("Please enter the UTR / Ref Number");
    setSubmitting(true);
    
    // Calculate Final Balance
    const baseAmount = selectedTrip.supplierRate || selectedTrip.freightCharges || 0;
    const balance = baseAmount + (selectedTrip.tollCharges || 0) - (selectedTrip.advanceAmount || 0);

    try {
      await fetchApi(`/Finance/vendor-settlement/${selectedTrip.id}`, {
        method: "POST",
        body: JSON.stringify({ amount: balance, utrNumber: utr })
      });
      setIsPanelOpen(false);
      loadData();
      alert("Vendor Settled Successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to settle vendor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Vendor Settlements</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Settle final balances for vendors after PODs are received.</p>
        </div>
        
        <div className="flex items-center gap-[12px]">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-[12px] shadow-inner border border-slate-200/60 mr-2">
            <button 
              onClick={() => setFilter("Pending")}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${filter === "Pending" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter("Settled")}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${filter === "Settled" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Settled
            </button>
            <button 
              onClick={() => setFilter("All")}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-bold transition-all ${filter === "All" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              All
            </button>
          </div>

          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search settlements..." 
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
        <div className="overflow-auto flex-1">
          <ProtoTable headers={["TRIP ID", "VENDOR & ROUTE", "TOTAL FREIGHT", "ADVANCE PAID", "BALANCE DUE", "ACTION"]}>
            {(() => {
              // Filter logic
              const filteredTrips = trips.filter(t => {
                if (filter === "Pending") return !t.isVendorSettled;
                if (filter === "Settled") return t.isVendorSettled;
                return true;
              });

              if (loading) {
                return (
                  <tr>
                    <Td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                        <span className="text-[14px] font-medium">Loading Settlements...</span>
                      </div>
                    </Td>
                  </tr>
                );
              }

              if (filteredTrips.length === 0) {
                return (
                  <tr>
                    <Td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                          <Handshake className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                          {filter === "Pending" ? "All Accounts Settled!" : filter === "Settled" ? "No Settled History" : "No Closed Trips"}
                        </h3>
                        <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                          {filter === "Pending" ? "There are no pending vendor settlements at this time. Great job!" : "No trips found matching the selected status."}
                        </p>
                      </div>
                    </Td>
                  </tr>
                );
              }

              return filteredTrips.map((trip) => {
                const baseAmount = trip.supplierRate || trip.freightCharges || 0;
                const balance = baseAmount + (trip.tollCharges || 0) - (trip.advanceAmount || 0);
                return (
                  <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                    <Td className="font-mono text-[13px] font-semibold text-slate-600">
                      <Link href={`/trips/${trip.id}/lr`} className="hover:text-blue-600 hover:underline">
                        TRP-{trip.id}
                      </Link>
                    </Td>
                    <Td>
                      <div className="font-semibold text-slate-800">{trip.vendor?.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] mt-0.5">
                        {trip.indent?.source} → {trip.indent?.destination}
                      </div>
                    </Td>
                    <Td>
                      <span className="font-semibold text-slate-700">₹{(baseAmount + (trip.tollCharges || 0)).toLocaleString('en-IN')}</span>
                    </Td>
                    <Td>
                      <span className="text-amber-600 font-semibold">₹{(trip.advanceAmount || 0).toLocaleString('en-IN')}</span>
                    </Td>
                    <Td>
                      <span className="text-emerald-600 font-black text-[15px]">₹{balance.toLocaleString('en-IN')}</span>
                    </Td>
                    <Td>
                      {trip.isVendorSettled ? (
                        <button disabled className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-not-allowed opacity-70">
                          <CheckCircle className="w-4 h-4" />
                          Settled
                        </button>
                      ) : (
                        <button 
                          onClick={() => openPanel(trip)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-[12px] font-bold transition-all shadow-sm flex items-center gap-2"
                        >
                          <Wallet className="w-4 h-4" /> 
                          Settle Account
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })
            })()}
          </ProtoTable>
        </div>
      </div>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* SLIDE-OVER PANEL: VENDOR SETTLEMENT */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-slate-400" /> Vendor Settlement
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">TRP-{selectedTrip?.id} • {selectedTrip?.vendor?.name}</p>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="settlement-form" onSubmit={handleSettle} className="space-y-6">
            
            {selectedTrip && (
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Final Calculation</div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-full">Ready for Payout</span>
                </div>
                
                <div className="space-y-4 text-[14px]">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Base Freight Agreed</span>
                    <span className="font-bold text-slate-800">₹{(selectedTrip.supplierRate || selectedTrip.freightCharges || 0).toLocaleString('en-IN')}</span>
                  </div>
                  
                  {selectedTrip.tollCharges > 0 && (
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                      <span>Toll & Extras (Reimbursement)</span>
                      <span className="font-bold text-blue-600">+ ₹{(selectedTrip.tollCharges || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200/60 pt-3 mt-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Advance Payments History</div>
                    
                    {selectedTrip.payments && selectedTrip.payments.filter((p:any) => p.type === 'Advance').length > 0 ? (
                      selectedTrip.payments.filter((p:any) => p.type === 'Advance').map((p:any, idx:number) => (
                        <div key={idx} className="flex justify-between items-center mb-1.5">
                          <span className="text-slate-600 font-medium text-[13px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Advance to {p.beneficiaryType || 'Vendor'} ({p.utrNumber || 'Cash/Fuel'})
                          </span>
                          <span className="font-bold text-red-600">- ₹{p.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-600 font-medium text-[13px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Total Advance Recorded
                        </span>
                        <span className="font-bold text-red-600">- ₹{(selectedTrip.advanceAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-200/60 pt-3 mt-3">
                    <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider">Final Balance Payable</span>
                    <span className="font-black text-emerald-600 text-[24px] leading-none">
                      ₹{((selectedTrip.supplierRate || selectedTrip.freightCharges || 0) + (selectedTrip.tollCharges || 0) - (selectedTrip.advanceAmount || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200/60 flex gap-2">
                    <button 
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Trip Financial Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Transaction Details</h3>
              
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Bank Reference / UTR Number</label>
                <input 
                  required
                  type="text" 
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  placeholder="e.g. HDFC000123456"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 font-mono font-bold uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                />
                <p className="text-[11px] text-slate-500 mt-2">Enter the transaction ID from your banking portal after successfully transferring the funds.</p>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit" 
            form="settlement-form"
            disabled={submitting || !utr}
            className="w-full bg-slate-900 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Confirm Settlement</>}
          </button>
        </div>
      </div>
    </div>
  );
}
