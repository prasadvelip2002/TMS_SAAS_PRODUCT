"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { Loader2, FileText, CheckSquare, Square, FilePlus, Search, Grid, List, Plus, X, User } from "lucide-react";

export default function CustomerInvoicingDashboard() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Side Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | "">("");
  const [unbilledTrips, setUnbilledTrips] = useState<any[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true);
    try {
      const [custData, invData] = await Promise.all([
        fetchApi("/Customers"),
        fetchApi("/Finance/invoices")
      ]);
      setCustomers(custData);
      setInvoices(invData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      loadUnbilledTrips(selectedCustomer as number);
    } else {
      setUnbilledTrips([]);
      setSelectedTrips([]);
    }
  }, [selectedCustomer]);

  const loadUnbilledTrips = async (custId: number) => {
    try {
      const data = await fetchApi(`/Finance/unbilled-trips/${custId}`);
      setUnbilledTrips(data);
      setSelectedTrips([]); // reset selection
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTripSelection = (tripId: number) => {
    if (selectedTrips.includes(tripId)) {
      setSelectedTrips(selectedTrips.filter(id => id !== tripId));
    } else {
      setSelectedTrips([...selectedTrips, tripId]);
    }
  };

  const toggleAll = () => {
    if (selectedTrips.length === unbilledTrips.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips(unbilledTrips.map(t => t.id));
    }
  };

  const handleGenerateInvoice = async () => {
    if (selectedTrips.length === 0) return alert("Select at least one trip to invoice.");
    setGenerating(true);
    try {
      await fetchApi("/Finance/invoice", {
        method: "POST",
        body: JSON.stringify({ tripIds: selectedTrips })
      });
      setIsPanelOpen(false);
      setSelectedCustomer("");
      alert("Invoice generated successfully!");
      loadBaseData();
    } catch (e) {
      console.error(e);
      alert("Failed to generate invoice");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm("Are you sure you want to mark this invoice as Paid?")) return;
    try {
      await fetchApi(`/Finance/invoices/${id}/pay`, { method: "POST" });
      loadBaseData();
    } catch (e) {
      console.error(e);
      alert("Failed to mark invoice as paid");
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-[20px] shrink-0">
        <div>
          <h1 className="font-disp font-bold text-[28px] text-slate-900 tracking-tight leading-tight">Customer Invoices</h1>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Generate formal tax invoices for closed trips and track payments.</p>
        </div>
        
        <div className="flex items-center gap-[16px]">
          <button 
            onClick={() => {
              setSelectedCustomer("");
              setUnbilledTrips([]);
              setSelectedTrips([]);
              setIsPanelOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
          
          <div className="h-[24px] w-[1px] bg-slate-200"></div>

          <div className="relative">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
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
          <ProtoTable headers={["INVOICE NO.", "DATE", "CUSTOMER", "AMOUNT (INC. TAX)", "STATUS", "ACTION"]}>
            {loading ? (
              <tr>
                <Td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 mb-3 animate-spin text-slate-300" />
                    <span className="text-[14px] font-medium">Loading Invoices...</span>
                  </div>
                </Td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">No Invoices Generated Yet</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
                      Click the "Generate Invoice" button above to group unbilled trips and bill your customers.
                    </p>
                  </div>
                </Td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                  <Td className="font-mono text-[13px] font-bold text-blue-600">{inv.invoiceNumber}</Td>
                  <Td className="font-medium text-slate-600">{new Date(inv.invoiceDate).toLocaleDateString()}</Td>
                  <Td className="font-bold text-slate-800">{inv.customer?.name}</Td>
                  <Td className="font-black text-slate-900 text-[15px]">₹{inv.grandTotal.toLocaleString('en-IN')}</Td>
                  <Td>
                    <Badge color={inv.status === "Paid" ? "green" : inv.status === "Unpaid" ? "red" : "orange"}>
                      {inv.status}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`/invoices/${inv.id}/pdf`}
                        target="_blank"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 w-max shadow-sm"
                      >
                        <FileText className="w-4 h-4 text-slate-500" /> View PDF
                      </a>
                      {inv.status === "Unpaid" && (
                        <button 
                          onClick={() => handleMarkPaid(inv.id)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-[12px] font-bold transition-all shadow-sm flex items-center gap-1.5 w-max"
                        >
                          <CheckSquare className="w-4 h-4" /> Mark Paid
                        </button>
                      )}
                    </div>
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

      {/* SLIDE-OVER PANEL: GENERATE INVOICE */}
      <div 
        className={`fixed top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-slate-400" /> Generate New Invoice
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">Select a customer and group their unbilled trips.</p>
          </div>
          <button 
            onClick={() => setIsPanelOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-8 border-b border-slate-100 shrink-0">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">1. Select Customer</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : "")}
                className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-[14px] bg-white text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm appearance-none"
              >
                <option value="" disabled>-- Choose a customer to bill --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">2. Select Unbilled Trips</label>
            
            {selectedCustomer === "" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-4 text-slate-200" />
                <p className="text-[14px] font-medium max-w-[250px] text-center">Select a customer above to view their unbilled closed trips.</p>
              </div>
            ) : unbilledTrips.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <CheckSquare className="w-12 h-12 mb-4 text-emerald-200" />
                <p className="text-[14px] font-bold text-slate-600 mb-1">All Caught Up!</p>
                <p className="text-[13px] font-medium max-w-[250px] text-center">There are no unbilled trips for this customer.</p>
              </div>
            ) : (
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                  <button 
                    onClick={toggleAll} 
                    className="flex items-center gap-2 text-[12px] font-bold text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    {selectedTrips.length === unbilledTrips.length ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    Select All ({unbilledTrips.length})
                  </button>
                  <span className="text-[12px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    {selectedTrips.length} Selected
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {unbilledTrips.map(trip => (
                    <label key={trip.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors group">
                      <div className="mt-0.5">
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={selectedTrips.includes(trip.id)}
                          onChange={() => toggleTripSelection(trip.id)}
                        />
                        {selectedTrips.includes(trip.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-[13px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">TRP-{trip.id}</span>
                          <span className="font-black text-slate-800">₹{((trip.customerRate ?? trip.indent?.customerRate ?? trip.freightCharges) + (trip.tollCharges || 0)).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-[12px] font-medium text-slate-500">{trip.indent?.source} → {trip.indent?.destination}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Delivered: {new Date(trip.podReceivedDate).toLocaleDateString()}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          <button 
            onClick={handleGenerateInvoice}
            disabled={selectedTrips.length === 0 || generating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FilePlus className="w-5 h-5" />}
            Generate Invoice for {selectedTrips.length} Trips
          </button>
        </div>
      </div>
    </div>
  );
}
