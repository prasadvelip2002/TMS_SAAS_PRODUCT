"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { Search, Grid, List, Banknote, Building, CreditCard, CheckCircle, X, Loader2 } from "lucide-react";

export default function AdvancePaymentPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/Trips");
      // Filter for trips that have an advance amount setup but might not be fully paid yet
      setTrips(data.filter((t: any) => t.advanceAmount > 0));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProcessPanel = (trip: any) => {
    setSelectedTrip(trip);
    setUtrNumber("");
    setIsPanelOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !utrNumber) return;
    
    setIsSubmitting(true);
    try {
      await fetchApi("/Payments", {
        method: "POST",
        body: JSON.stringify({
          tripId: selectedTrip.id,
          amount: selectedTrip.advanceAmount,
          type: "Advance",
          utrNumber: utrNumber,
          status: "Completed",
          paymentDate: new Date().toISOString()
        }),
      });
      setIsPanelOpen(false);
      setSelectedTrip(null);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to process payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Advance Payments</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Process and track advance payments for fleet vendors.</p>
        </div>
        
        <div className="flex items-center gap-[12px]">
          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search payments..." 
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
          <ProtoTable headers={["TRIP ID", "VENDOR & BANK DETAILS", "ADVANCE REQ.", "STATUS", "ACTION"]}>
            {loading ? (
              <tr>
                <Td colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading Payments...</span>
                  </div>
                </Td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <Td colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Banknote className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Advance Payments Pending</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      All trips have their advance payments settled or no trips require advances at the moment.
                    </p>
                  </div>
                </Td>
              </tr>
            ) : (
              trips.map(trip => {
                const isPaid = trip.payments && trip.payments.some((p: any) => p.type === 'Advance' && p.status === 'Completed');
                
                return (
                  <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                    <Td className="font-mono text-[13px] font-semibold text-slate-600">TRP-{1000 + trip.id}</Td>
                    <Td>
                      <div className="font-semibold text-slate-800">{trip.vendor?.name || `Vendor #${trip.vendorId}`}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">{trip.vendor?.bankDetails || "No Bank Details"}</div>
                    </Td>
                    <Td>
                      <span className="text-[15px] font-black text-slate-800">₹{trip.advanceAmount?.toLocaleString()}</span>
                    </Td>
                    <Td>
                      {isPaid ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                          Pending Payment
                        </span>
                      )}
                    </Td>
                    <Td>
                      {isPaid ? (
                        <button disabled className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-not-allowed opacity-70">
                          <CheckCircle className="w-4 h-4" />
                          Payment Settled
                        </button>
                      ) : (
                        <button 
                          onClick={() => openProcessPanel(trip)}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-[12px] font-bold transition-all shadow-sm flex items-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          Process Payment
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </ProtoTable>
        </div>
      </div>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* PROCESS PAYMENT SIDE PANEL */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-400" /> Process Advance
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">TRP-{selectedTrip ? 1000 + selectedTrip.id : ""}</p>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="payment-form" onSubmit={handlePayment} className="space-y-6">
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[11px] font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Amount to Pay</div>
              <div className="text-[32px] font-black text-emerald-800">
                ₹{selectedTrip?.advanceAmount?.toLocaleString()}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Beneficiary Details</h3>
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5"><Building className="w-3.5 h-3.5"/> Vendor</span>
                  <span className="text-[13px] font-bold text-slate-800">{selectedTrip?.vendor?.name}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200/60">
                  <span className="text-[12px] font-medium text-slate-500 flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5"/> Bank A/C</span>
                  <span className="text-[13px] font-mono font-bold text-slate-800">{selectedTrip?.vendor?.bankDetails || "Not Provided"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">Transaction Details</h3>
              
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Bank Reference / UTR Number</label>
                <input 
                  required 
                  value={utrNumber} 
                  onChange={e => setUtrNumber(e.target.value)} 
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 font-mono font-bold uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                  placeholder="e.g. HDFC123456789" 
                />
                <p className="text-[11px] text-slate-500 mt-2">Enter the transaction ID from your banking portal after successfully transferring the funds.</p>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit" 
            form="payment-form"
            disabled={isSubmitting || !utrNumber}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
