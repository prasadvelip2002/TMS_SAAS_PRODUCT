"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge, KpiCard } from "@/components/PrototypeUI";
import { Search, Grid, List, Plus, X, Wallet, Loader2, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Slide Over State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tripId: "",
    amount: "",
    type: "Advance",
    utrNumber: "",
  });

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.tripId?.toString().includes(q) ||
      `trp-${p.tripId}`.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      p.utrNumber?.toLowerCase().includes(q) ||
      p.amount?.toString().includes(q) ||
      p.status?.toLowerCase().includes(q)
    );
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, tripData] = await Promise.all([
        fetchApi("/Payments"),
        fetchApi("/Trips")
      ]);
      setPayments(payData);
      setTrips(tripData.filter((t: any) => t.status !== 'Closed'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOutstanding = trips.reduce((acc, trip) => acc + (trip.balanceAmount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi("/Payments", {
        method: "POST",
        body: JSON.stringify({
          tripId: parseInt(formData.tripId),
          amount: parseFloat(formData.amount),
          type: formData.type,
          utrNumber: formData.utrNumber,
          status: "Completed",
          paymentDate: new Date().toISOString()
        })
      });
      setIsPanelOpen(false);
      setFormData({ tripId: "", amount: "", type: "Advance", utrNumber: "" });
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
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Payment Ledger</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Complete transaction history and manual payment logging.</p>
        </div>
        
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log Custom Payment
          </button>
          
          <div className="h-[24px] w-[1px] bg-slate-200"></div>

          <div className="relative flex items-center">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by trip #, UTR, type..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[240px] h-[42px] bg-white border border-slate-200 rounded-[12px] pl-[40px] pr-[32px] text-[14px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-[12px] p-1 shadow-sm">
            <button className="p-1.5 bg-slate-100 text-slate-800 rounded-[8px] shadow-sm"><List className="w-4 h-4" /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-[8px]"><Grid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[20px] shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding</div>
            <div className="text-2xl font-black text-slate-800">₹{totalOutstanding.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
            <ArrowUpRight className="w-5 h-5 text-amber-500" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Disbursed</div>
            <div className="text-2xl font-black text-slate-800">₹{totalPaid.toLocaleString('en-IN')}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <ArrowDownRight className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recorded Transactions</div>
            <div className="text-2xl font-black text-slate-800">{filteredPayments.length}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
            <List className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* FULL WIDTH TABLE */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <ProtoTable headers={["DATE", "TRIP ID", "PAYMENT TYPE", "UTR NUMBER", "AMOUNT", "STATUS"]}>
            {loading ? (
              <tr>
                <Td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading Ledger...</span>
                  </div>
                </Td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Wallet className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                      {searchQuery ? "No Matching Transactions" : "No Transactions Found"}
                    </h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      {searchQuery
                        ? `No payments matched "${searchQuery}". Try another search term.`
                        : "There are no payments recorded in the ledger yet."}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                      >
                        Clear Search Filter
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ) : (
              filteredPayments.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(payment => (
                <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  <Td className="font-medium text-slate-600">{new Date(payment.paymentDate).toLocaleDateString()}</Td>
                  <Td className="font-mono text-[13px] font-bold text-slate-600">TRP-{payment.tripId}</Td>
                  <Td>
                    <span className="px-[8px] py-[3px] bg-slate-100 text-slate-600 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border border-slate-200/60">
                      {payment.type}
                    </span>
                  </Td>
                  <Td className="font-mono text-[13px] font-medium text-slate-600">{payment.utrNumber || "—"}</Td>
                  <Td className="font-black text-[15px] text-slate-900">₹{payment.amount.toLocaleString('en-IN')}</Td>
                  <Td>
                    <Badge color={payment.status === 'Completed' ? 'green' : 'orange'}>{payment.status}</Badge>
                  </Td>
                </tr>
              ))
            )}
          </ProtoTable>
        </div>
      </div>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsPanelOpen(false)}
      />

      {/* SLIDE-OVER PANEL: LOG PAYMENT */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-400" /> Log Custom Payment
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">Record a manual transaction into the ledger.</p>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form id="log-payment-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Select Trip</label>
              <select 
                required 
                value={formData.tripId}
                onChange={e => setFormData({...formData, tripId: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              >
                <option value="">-- Choose an active trip --</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>TRP-{t.id} (Balance: ₹{t.balanceAmount})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Payment Type</label>
                <select 
                  required 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                >
                  <option value="Advance">Advance</option>
                  <option value="Final">Final</option>
                  <option value="Unloading">Unloading</option>
                  <option value="Toll">Toll Reimb.</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Amount (₹)</label>
                <input 
                  required 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                  placeholder="e.g. 5000" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Bank Reference / UTR Number</label>
              <input 
                required 
                type="text" 
                value={formData.utrNumber}
                onChange={e => setFormData({...formData, utrNumber: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-[14px] bg-white text-slate-900 font-mono font-bold uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                placeholder="e.g. UTR123456789" 
              />
            </div>
            
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          <button 
            type="submit" 
            form="log-payment-form"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save to Ledger"}
          </button>
        </div>
      </div>
    </div>
  );
}
