"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { ProtoTable, Td, Badge } from "@/components/PrototypeUI";
import { Loader2, FileText, CheckSquare, Square, FilePlus, Search, Grid, List, Plus, X, User } from "lucide-react";

export default function CustomerInvoicingDashboard() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q) ||
      inv.grandTotal?.toString().includes(q)
    );
  });
  
  // Side Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | "">("");
  const [unbilledTrips, setUnbilledTrips] = useState<any[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<number[]>([]);
  const [customRates, setCustomRates] = useState<Record<number, number>>({});
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

      const ratesMap: Record<number, number> = {};
      data.forEach((t: any) => {
        const base = (t.customerRate && t.customerRate > 0)
          ? t.customerRate
          : ((t.indent?.customerRate && t.indent.customerRate > 0) ? t.indent.customerRate : (t.freightCharges || 0));
        const addChargesSum = (t.additionalCharges || []).reduce((acc: number, c: any) => acc + (c.amount || 0), 0);
        ratesMap[t.id] = base + (t.tollCharges || 0) + addChargesSum;
      });
      setCustomRates(ratesMap);
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
        body: JSON.stringify({ 
          tripIds: selectedTrips,
          customRates: customRates 
        })
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

          <div className="relative flex items-center">
            <Search className="w-[16px] h-[16px] text-slate-400 absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search invoices by number, customer..." 
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
            <button className="p-1.5 bg-slate-100 text-slate-800 rounded-[8px] shadow-sm"><List className="w-4 h-4" /></button>
            <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-[8px]"><Grid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* FULL WIDTH TABLE */}
      <div className="bg-white border border-slate-200 rounded-[16px] overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
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
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 mb-1">
                      {searchQuery ? "No matching invoices found" : "No Invoices Generated Yet"}
                    </h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-4">
                      {searchQuery 
                        ? `No invoices matched "${searchQuery}".` 
                        : "Click the \"Generate Invoice\" button above to group unbilled trips and bill your customers."}
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
              filteredInvoices.map((inv) => (
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
        className={`fixed top-0 right-0 h-full w-[650px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-200 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-slate-400" /> Generate New Customer Invoice
            </h2>
            <p className="text-[13px] text-slate-500 mt-1 font-medium">Select a customer, verify trip & driver charges, and manually adjust invoice price.</p>
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
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">2. Select Unbilled Trips & Adjust Rates</label>
              <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">Manual Price Override Enabled</span>
            </div>
            
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
                  {unbilledTrips.map(trip => {
                    const baseFreight = (trip.customerRate && trip.customerRate > 0)
                      ? trip.customerRate
                      : ((trip.indent?.customerRate && trip.indent.customerRate > 0) ? trip.indent.customerRate : (trip.freightCharges || 0));
                    const addCharges = trip.additionalCharges || [];
                    const addChargesTotal = addCharges.reduce((acc: number, c: any) => acc + (c.amount || 0), 0);

                    return (
                      <label key={trip.id} className="flex items-start gap-4 p-4 hover:bg-slate-50/80 cursor-pointer transition-colors group">
                        <div className="mt-1">
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
                          <div className="flex justify-between items-center mb-1 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">TRP-{trip.id >= 1000 ? trip.id : 1000 + trip.id}</span>
                              {!trip.vendorId && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Own Fleet
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border-2 border-blue-200 rounded-lg px-2.5 py-1 shadow-sm" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[12px] font-bold text-blue-600">Billable ₹</span>
                              <input 
                                type="number"
                                value={customRates[trip.id] ?? 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCustomRates(prev => ({ ...prev, [trip.id]: val }));
                                }}
                                className="w-28 bg-transparent font-black text-slate-900 text-[13px] text-right outline-none focus:text-blue-700"
                                placeholder="Final Rate"
                              />
                            </div>
                          </div>
                          <div className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5 flex-wrap">
                            {trip.legType === "InboundLeg1" ? (
                              <>
                                <span>{trip.indent?.source}</span>
                                <span className="text-slate-300">→</span>
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {trip.indent?.warehouseLocation} (Hub)
                                </span>
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded ml-1">
                                  Leg 1
                                </span>
                              </>
                            ) : trip.legType === "OutboundLeg2" ? (
                              <>
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {trip.indent?.warehouseLocation} (Hub)
                                </span>
                                <span className="text-slate-300">→</span>
                                <span>{trip.indent?.destination}</span>
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded ml-1">
                                  Leg 2
                                </span>
                              </>
                            ) : (
                              <>
                                <span>{trip.indent?.source}</span>
                                <span className="text-slate-300">→</span>
                                {trip.indent?.warehouseLocation && (
                                  <>
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      {trip.indent?.warehouseLocation} (Hub)
                                    </span>
                                    <span className="text-slate-300">→</span>
                                  </>
                                )}
                                <span>{trip.indent?.destination}</span>
                                {trip.indent?.warehouseLocation && (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded ml-1">
                                    Full Route
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* CHARGES BREAKDOWN PILLS */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              Base: ₹{baseFreight.toLocaleString('en-IN')}
                            </span>
                            {trip.tollCharges > 0 && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-medium">
                                Toll: +₹{trip.tollCharges}
                              </span>
                            )}
                            {addCharges.map((ac: any, idx: number) => (
                              <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium">
                                {ac.chargeType || 'Extra'}: +₹{ac.amount}
                              </span>
                            ))}
                            {addCharges.length === 0 && !trip.tollCharges && (
                              <span className="text-slate-400 text-[11px] italic">No extra charges logged</span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400 mt-1.5">Delivered: {new Date(trip.podReceivedDate || trip.updatedAt).toLocaleDateString()}</div>
                        </div>
                      </label>
                    );
                  })}
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
            Generate Invoice for {selectedTrips.length} Trips (₹{selectedTrips.reduce((sum, id) => sum + (customRates[id] || 0), 0).toLocaleString('en-IN')})
          </button>
        </div>
      </div>
    </div>
  );
}
